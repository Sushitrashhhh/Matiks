import { WebSocketServer, WebSocket } from "ws";
import { verify, type JwtPayload } from "jsonwebtoken";
import { prisma } from "@repo/db/client";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
const wss = new WebSocketServer({ port: 8080 });

export interface OnlineUser {
    id: string;
    name: string;
    ws: WebSocket;
}

const onlineUsers = new Map<string, OnlineUser>();

interface WebSocketMessage {
    type: 'JOIN' | 'SEND_MESSAGE';
    payload: {
        name: string;
        message?: string;
        roomId: string;
    };
}

wss.on("connection", async (ws, req) => {
    const url = new URL(req.url ?? '', `http://${req.headers.host || 'localhost'}`);
    const token = url.searchParams.get("token");

    if (!token) {
        ws.close(1008, "Token required");
        return;
    }

    let decoded: JwtPayload & { userId: string };
    try {
        decoded = verify(token, JWT_SECRET) as JwtPayload & { userId: string };
    } catch (err) {
        ws.close(1008, "Invalid or expired token");
        return;
    }

    if (!decoded?.userId) {
        ws.close(1008, "Invalid token payload");
        return;
    }

    const user = await prisma.user.findUnique({
        where: {
            id: decoded.userId
        }
    });

    if (!user) {
        ws.close(1008, "User not found");
        return;
    }

    const userId = user.id;

    onlineUsers.set(userId, {
        id: user.id,
        name: user.username,
        ws: ws
    });

    console.log(`User connected: ${user.username} (${userId})`);

    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: "USER_JOINED",
                payload: {
                    users: "ONLINE_USERS",
                    user: {
                        id: userId,
                        name: user.username
                    }
                },
            }));
        }
    });

    ws.on("message", (event) => {
        try {
            const parsedData: WebSocketMessage = JSON.parse(event.toString());

            if (parsedData.type === 'JOIN' && parsedData.payload?.roomId) {
                console.log(`User ${userId} joined room ${parsedData.payload.roomId}`);
            }
        } catch (err) {
            console.error("Invalid JSON message:", err);
        }
    });

    ws.on("close", () => {
        onlineUsers.delete(userId);
        console.log(`User ${userId} disconnected`);
    });
});

console.log("Server started on port 8080");


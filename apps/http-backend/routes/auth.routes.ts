import { Router } from "express";
import { prisma } from "@repo/db/client";
import {loginSchema, registerSchema, zodErrorMessage} from "@repo/common/common"
import { hash, compare } from "bcryptjs";
import { sign } from "jsonwebtoken";
import { authMiddleware } from "../auth.middleware";

export const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET!;

authRouter.post("/register", async(req, res) => {
    // email, password

    const{ success, data, error } = registerSchema.safeParse(req.body) 

    if(!success) {
        return res.status(403).json({message: zodErrorMessage({ error })})
    }

    const {email, password} = data;  
    //check user already exists 
    const user = await prisma.user.findUnique({ where: {email} });
    if(user) {
        return res.status(403).json({message: "User already exists"});
    }
    //username
    const baseUsername = email.split("@")[0] || "user";
    let username = baseUsername;
    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
        username = `${baseUsername}_${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const hashedPassword = await hash(password, 10);
    const newUser = await prisma.user.create({
        data: {
            email,
            username,
            password: hashedPassword
        }
    });

    return res.status(201).json({
        message: "User created successfully",
        user: {
            id: newUser.id,
            email: newUser.email,
            username: newUser.username
        }
    });
})

authRouter.post("/signin", async (req, res) => {
    const { success, data, error } = loginSchema.safeParse(req.body);

    if (!success) {
        return res.status(403).json({ message: zodErrorMessage({ error }) });
    }

    const { email, password } = data;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (!existingUser) {
        return res.status(403).json({ message: "User not found" });
    }

    // Verify password
    const isPasswordValid = await compare(password, existingUser.password);
    if (!isPasswordValid) {
        return res.status(403).json({ message: "Invalid credentials" });
    }

    // Generate token
    const token = sign(
        { userId: existingUser.id, email: existingUser.email },
        JWT_SECRET,
        { expiresIn: "7d" }
    );

    return res.status(200).json({
        message: "Logged in successfully",
        data:{token, user:{id: existingUser.id, email: existingUser.email, username: existingUser.username}}
    });
})

authRouter.post('/me', authMiddleware, async(req, res) => {
    try{
        const userId = req.userId;
    
    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    
    const user = await prisma.user.findUnique({
        where: { id: userId },
        omit: {
            password: true
        },
        include: {
            rating: true,
            gameMember: { include: { game: true } },
            sender: true,
            receiver: true
        }
    });

    if(!user) {
        return res.status(403).json({message: "User not found"});
    }
    return res.status(200).json({
        message: "User found",
        data: user
    });
    } catch (error) {
        console.error(error);
        return res.status(500).json({message: "Internal server error"});
    }
});
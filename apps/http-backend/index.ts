import express from "express";
import { authRouter } from "./routes/auth.routes";


const app = express();

app.use(express.json())

app.use("/api/v1/auth", authRouter);

app.listen(4000, () => {
    console.log("server is started", 4000)
})
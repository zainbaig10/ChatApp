import expressRouter from "express";
import userRouter from "./userRoutes.js";
import chatRouter from "./chatRoutes.js";
import chatsRouter from "./chatsRoutes.js";

const appRoutes = expressRouter();

appRoutes.use("/user", userRouter);
appRoutes.use("/chat", chatRouter);
appRoutes.use("/chats", chatsRouter);

export default appRoutes;

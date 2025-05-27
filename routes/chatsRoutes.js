import express from "express";
import {
  fetchChatMessages,
  fetchChatsByUser,
  initiateChat,
} from "../controllers/chatsController.js";

const chatsRouter = express.Router();

chatsRouter.post("/initiate", initiateChat);
chatsRouter.get("/fetchChats/:chatId", fetchChatMessages);
chatsRouter.get("/fetchChatsByUser/:userId", fetchChatsByUser);

export default chatsRouter;

import express from "express";
import {
  sendMessage,
  getMessages,
  markAsRead,
} from "../controllers/chatController.js";

const chatRouter = express.Router();

chatRouter.post("/send", sendMessage);
chatRouter.get("/messages/:user1/:user2", getMessages);
chatRouter.post("/markAsRead", markAsRead);

export default chatRouter;

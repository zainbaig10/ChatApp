import asyncHandler from "express-async-handler";
import {
  handleErrorResponse,
  handleNotFound,
} from "../utils/responseHandlers.js";
import User from "../schema/userSchema.js";
import Chats from "../schema/chatsSchema.js";
import Messages from "../schema/messageSchema.js";
import { sendPushNotification } from "../utils/sendPushNotifications.js";

export const initiateChat = asyncHandler(async (req, res) => {
  try {
    const { sender, receiver } = req.body;

    const senderUser = await User.findById(sender);
    const receiverUser = await User.findById(receiver);

    if (!senderUser || !receiverUser) {
      console.log("Sender and Reciever not found", sender, receiver);
      return handleNotFound(res, "User", "sender reciever not found");
    }

    let existingChat = await Chats.findOne({
      members: { $all: [senderUser._id, receiverUser._id] },
    });

    if (existingChat) {
      console.log("Chat already exists:", existingChat._id);
      return res.status(200).json({
        success: true,
        chatsDoc: existingChat,
        msg: "Chat already exists",
        chatsId: existingChat._id,
      });
    }

    const chatsDoc = await Chats.create({
      members: [senderUser?._id, receiverUser?._id],
      lastMessage: "Start a new Chat",
      lastMessageTime: new Date(),
    });

    console.log(chatsDoc, "New Chats Room created");

    try {
      const fcmToken = receiverUser?.fcmToken;

      if (
        fcmToken &&
        receiverUser._id.toString() !== senderUser._id.toString()
      ) {
        console.log("Receiver FCM Token:", fcmToken);

        const response = await sendPushNotification(
          fcmToken,
          "New Chat Started",
          `${senderUser.username} has started a chat with you.`,
          {
            chatId: chatsDoc._id.toString(),
            type: "chat",
            senderId: senderUser._id.toString(),
          }
        );
        console.log("Notification sent successfully:", response);
      }
    } catch (notifError) {
      console.error(
        "Failed to send chat notification:",
        notifError.message || notifError
      );
    }

    return res.status(200).json({
      success: true,
      chatsDoc,
      msg: "Created Chats",
      chatsId: chatsDoc?._id ?? "N/A",
    });
  } catch (error) {
    console.log(error);
    return handleErrorResponse(res, error, "error while initiating chat");
  }
});

export const fetchChatMessages = asyncHandler(async (req, res) => {
  try {
    const { chatId } = req.params;

    const chatsDoc = await Chats.findById(chatId).populate("members").exec();
    if (!chatsDoc) {
      return handleNotFound(res, "Chats", chatId);
    }

    const messages = await Messages.find({ chatId: chatId }).sort({
      createdAt: 1,
    });

    return res.status(200).json({
      success: true,
      msg: "Fetched Chat Messages",
      messages,
      chatsDoc,
    });
  } catch (error) {
    console.log(error);
    return handleErrorResponse(res, error, "Error while fetching chats");
  }
});

export const fetchChatsByUser = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const userDoc = await User.findById(userId);
    if (!userDoc) {
      return handleNotFound(res, "User", userId);
    }

    const chats = await Chats.find({ members: userId })
      .sort({ updatedAt: -1 })
      .populate("members", "username profilePic businessName")
      .exec();

    return res.status(200).json({
      success: true,
      msg: "Fetched chats for user",
      chats,
    });
  } catch (error) {
    console.log(error);
    return handleErrorResponse(
      res,
      error,
      "Error while fetching chats for user"
    );
  }
});

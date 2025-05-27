import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import mongooseConnection from "./mongo.js";
import appRoutes from "./routes/index.js";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

import http from "http";
import https from "https";
import { Server as SocketIOServer } from "socket.io";
import { chatSocketHandler } from "./socket/chatHandler.js";
import Messages from "./schema/messageSchema.js";
import Chats from "./schema/chatsSchema.js";

// Firebase dependencies
import { initializeApp, applicationDefault } from "firebase-admin/app";
import admin from "firebase-admin";

let serviceAccount;
if (process.env.FIREBASE_CONFIG) {
  serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);
} else {
  serviceAccount = JSON.parse(
    fs.readFileSync("./config/chatAppFirebaseConf.json", "utf-8")
  );
}

const port = process.env.PORT || 4000;
const app = express();

// Middleware
app.use(bodyParser.json({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB Connection
mongooseConnection();

// CORS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);

// Firebase Initialization
initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: "chatapp-f0e1f",
});

// Health Check Endpoint
app.get("/health", (req, res) => {
  console.log("Health check pinged at", Date.now());
  res.status(200).json({ msg: "Server is up and running" });
});

// API Routes
app.use("/api", appRoutes);

// === Start Server ===

let server;

// Detect if running on Render (it sets RENDER=true automatically)
if (process.env.RENDER === "true") {
  // Use HTTP for Render (Render manages HTTPS)
  server = http.createServer(app);
} else if (process.env.DEPLOY_ENV === "prod") {
  // Use HTTPS in your custom production environment
  server = https.createServer(
    {
      cert: fs.readFileSync(process.env.SSL_CRT_PATH),
      key: fs.readFileSync(process.env.SSL_KEY_PATH),
    },
    app
  );
} else {
  // Default to HTTP for local development
  server = http.createServer(app);
}

// === Socket.IO ===

const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("User connected to Socket:", socket.id);

  socket.on("join-chat", (chatId) => {
    console.log("Socket joined chat", chatId);
    socket.join(chatId);
  });

  socket.on("send-message", async ({ chatId, senderId, receiverId, text }) => {
    try {
      const newMessage = await Messages.create({
        chatId,
        sender: senderId,
        text,
        receiver: receiverId,
      });

      await Chats.findByIdAndUpdate(chatId, {
        lastMessage: text,
        lastMessageTime: new Date(),
      });

      io.to(chatId).emit("receive-message", newMessage);
      console.log(`Emitted message to room ${chatId}`);
    } catch (error) {
      console.log("Socket error while sending message:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// === Start Listening ===

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import mongooseConnection from "./mongo.js";
import appRoutes from "./routes/index.js";
import fs from "fs";
import dotenv from "dotenv";
import https from "https";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { chatSocketHandler } from "./socket/chatHandler.js";
import Messages from "./schema/messageSchema.js";
import Chats from "./schema/chatsSchema.js";

//Firebase dependencies
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

dotenv.config();
const port = process.env.PORT || 4000;

const app = express();

// Body parser
app.use(bodyParser.json({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));

// Connect to MongoDB
mongooseConnection();

// Enable CORS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);

initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: "chatapp-f0e1f",
});


// Health check
app.get("/health", (req, res) => {
  console.log("Received request at " + Date.now());
  return res.status(200).json({ msg: "Server is up and running" });
});

// API routes
app.use("/api", appRoutes);

let server;
if (process.env.DEPLOY_ENV === "local") {
  server = http.createServer(app);

  // Initialize Socket.IO on the selected server
  const io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("User connected to Socket:", socket.id);
    socket.on("join-chat", (chatId) => {
      console.log("Socket joined chat",chatId);
      socket.join(chatId);
    });

    socket.on("send-message", async ({ chatId, senderId,receiverId, text }) => {
      try {
        const newMessage = await Messages.create({
          chatId,
          sender: senderId,
          text,
          receiver:receiverId
        });

        console.log("Created new message",newMessage);
  
        await Chats.findByIdAndUpdate(chatId, {
          lastMessage: text,
          lastMessageTime: new Date(),
        });
  
        io.to(chatId).emit("receive-message", newMessage);
        console.log(`Emitted message to room ${chatId}`);
      } catch (error) {
        console.log(error,"Error while sending Message on socket")
      }

    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  server.listen(port, () => {
    console.log(`HTTP Server running on port ${port}`);
  });
} else if (process.env.DEPLOY_ENV === "prod") {
  server = https.createServer(
    {
      cert: fs.readFileSync(process.env.SSL_CRT_PATH),
      key: fs.readFileSync(process.env.SSL_KEY_PATH),
    },
    app
  );

  // Initialize Socket.IO on the selected server
  const io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });
  io.on("connection", (socket) => {
    console.log("User connected to Socket:", socket.id);
    socket.on("join-chat", (chatId) => {
      console.log("Socket joined chat",chatId);
      socket.join(chatId);
    });

    socket.on("send-message", async ({ chatId, senderId,receiverId, text }) => {
      console.log(chatId,senderId,receiverId,text,"Recieved this message");
      try {
        const newMessage = await Messages.create({
          chatId,
          sender: senderId,
          text,
          receiver:receiverId
        });

        console.log("Created new message",newMessage);
  
        await Chats.findByIdAndUpdate(chatId, {
          lastMessage: text,
          lastMessageTime: new Date(),
        });
  
        io.to(chatId).emit("receive-message", newMessage);
        console.log(`Emitted message to room ${chatId}`);
      } catch (error) {
        console.log(error,"Error while sending Message on socket")
      }

    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  server.listen(port, () => {
    console.log("HTTPS Server running on port 443");
  });
}
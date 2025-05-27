import Chat from "../schema/chatSchema.js";
import User from "../schema/userSchema.js";
import { sendPushNotification } from "../utils/sendPushNotifications.js";

const users = new Map();

export const chatSocketHandler = (io, socket) => {
  
  socket.on("register", (userId) => {
    if (!userId) {
      console.warn(`Register event missing userId on socket ${socket.id}`);
      return;
    }
    users.set(userId, socket.id);
    console.log(`User ${userId} connected via socket ${socket.id}`);
  });

  socket.on("private_message", async ({ senderId, receiverId, message }) => {
    try {
      if (!senderId || !receiverId || !message) {
        socket.emit("message_error", { msg: "senderId, receiverId and message are required" });
        return;
      }

      const [sender, receiver] = await Promise.all([
        User.findById(senderId).select("username fcmToken"),
        User.findById(receiverId).select("username fcmToken"),
      ]);

      if (!sender || !receiver) {
        socket.emit("message_error", { msg: "Invalid sender or receiver ID" });
        return;
      }

      const chat = await Chat.create({ sender: senderId, receiver: receiverId, message });

      // Send push notification regardless of online status if FCM token exists
      if (receiver.fcmToken) {
        try {
          await sendPushNotification(
            receiver.fcmToken,
            "New Message",
            `${sender.username} sent you a message: "${message}"`,
            {
              senderId,
              chatId: chat._id.toString(),
            }
          );
        } catch (notifErr) {
          console.error("Push notification error:", notifErr);
        }
      }

      // Send real-time message via socket if user is online
      const receiverSocketId = users.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receive_message", chat);
      }

      socket.emit("message_sent", chat);
    } catch (err) {
      console.error("private_message handler error:", err);
      socket.emit("message_error", { msg: "Internal Server Error", error: err.message });
    }
  });

  socket.on("disconnect", () => {
    for (const [userId, socketId] of users.entries()) {
      if (socketId === socket.id) {
        users.delete(userId);
        console.log(`User ${userId} disconnected and removed from users map`);
        break;
      }
    }
    console.log(`Socket ${socket.id} disconnected`);
  });
};
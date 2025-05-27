import Chat from "../schema/chatSchema.js";
import User from "../schema/userSchema.js";
import { sendPushNotification } from "../utils/sendPushNotifications.js";

export const sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, message } = req.body;
    console.log(req.body);
    if (!senderId || !receiverId || !message) {
      return res.status(400).json({ msg: "All fields are required" });
    }
    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);
    console.log(sender, receiver, "Sender receiver");
    if (!sender || !receiver) {
      return res.status(400).json({
        success: false,
        error: "Invalid User ids",
        sender,
        receiver,
      });
    }
    console.log(senderId, receiverId, new Date());
    const chat = await Chat.create({
      sender: senderId,
      receiver: receiverId,
      message,
    });
    console.log(chat, "Created");

    // ✅ Send push notification to receiver
    if (
      receiver.fcmToken &&
      receiver._id.toString() !== sender._id.toString()
    ) {
      try {
        const response = await sendPushNotification(
          receiver.fcmToken,
          `New Message from ${sender.username}`,
          message,
          {
            type: "message",
            chatId: chat._id.toString(),
            senderId: sender._id.toString(),
          }
        );
        console.log("Message notification sent:", response);
      } catch (notifError) {
        console.error(
          "Error sending message notification:",
          notifError.message || notifError
        );
      }
    }

    return res
      .status(201)
      .json({ success: true, message: "Message sent successfully", chat });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
};

export const getMessages = async (req, res) => {
  const { user1, user2 } = req.params;
  try {
    const messages = await Chat.find({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 },
      ],
    }).sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;

    if (!senderId || !receiverId) {
      return res
        .status(400)
        .json({ message: "Sender and receiver IDs are required" });
    }

    console.log(senderId, receiverId, "Mark as read");
    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);
    console.log(sender, receiver, "Sender receiver");

    if (!sender || !receiver) {
      return res.status(400).json({
        success: false,
        error: "Invalid User ids",
        sender,
        receiver,
      });
    }

    // Step 1: Check if there are unread messages
    const unreadMessages = await Chat.countDocuments({
      sender: senderId,
      receiver: receiverId,
      read: false,
    });

    // Step 2: If there are unread messages, mark them as read
    if (unreadMessages > 0) {
      await Chat.updateMany(
        { sender: senderId, receiver: receiverId, read: false },
        { $set: { read: true } }
      );

      // Send push notification to the sender
      if (
        sender.fcmToken &&
        sender._id.toString() !== receiver._id.toString()
      ) {
        try {
          const response = await sendPushNotification(
            sender.fcmToken,
            "Messages Read",
            `${receiver.username} has read your messages.`,
            {
              type: "message",
              senderId: sender._id.toString(),
              receiverId: receiver._id.toString(),
            }
          );
          console.log("Read receipt notification sent:", response);
        } catch (notifError) {
          console.error(
            "Error sending read notification:",
            notifError.message || notifError
          );
        }
      }
    }

    return res.status(200).json({
      message:
        unreadMessages > 0
          ? "Unread messages marked as read"
          : "No unread messages found",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: err.message });
  }
};

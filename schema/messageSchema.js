import mongoose from "mongoose";


const messageSchema = new mongoose.Schema(
    {
      chatId: { type: mongoose.Schema.Types.ObjectId, ref: "chats", required: true },
      sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      text: { type: String },
      messageType: { type: String, enum: ["TEXT", "IMAGE", "FILE"], default: "TEXT" },
      receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    },
    { timestamps: true }
);

const Messages = mongoose.model("messages",messageSchema);
export default Messages;
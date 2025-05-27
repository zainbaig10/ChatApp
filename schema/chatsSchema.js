import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
    {
      members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      lastMessage: { type: String }, 
      lastMessageTime: { type: Date },
    },
    { timestamps: true }
  );

const Chats = mongoose.model("chats",chatSchema);
export default Chats;
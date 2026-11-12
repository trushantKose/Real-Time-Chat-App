
const mongoose = require("mongoose");

const aiMessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const aiConversationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      default: "New AI Chat",
    },

    messages: [aiMessageSchema],
  },
  {
    timestamps: true,
  }
);

const AIConversation = mongoose.model(
  "AIConversation",
  aiConversationSchema
);

module.exports = AIConversation;

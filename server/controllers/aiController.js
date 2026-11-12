
const mongoose = require("mongoose");
const { GoogleGenAI } = require("@google/genai");

const AIConversation = require("../models/AIConversation");

// SEND MESSAGE TO GEMINI AI
const sendAIMessage = async (req, res) => {
  try {
    const userId = req.userId;
    const { conversationId, message } = req.body;

    // Validate message
    if (
      typeof message !== "string" ||
      !message.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enter a message",
      });
    }

    if (message.trim().length > 4000) {
      return res.status(400).json({
        success: false,
        message: "Message cannot exceed 4000 characters",
      });
    }

    // Check API key
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "Gemini API key is not configured",
      });
    }

    // Initialize Gemini
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    let conversation;

    // Find existing conversation
    if (conversationId) {
      if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid conversation ID",
        });
      }

      conversation = await AIConversation.findOne({
        _id: conversationId,
        user: userId,
      });

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: "Conversation not found",
        });
      }
    } else {
      conversation = new AIConversation({
        user: userId,
        title: message.trim().slice(0, 40),
        messages: [],
      });
    }

    // Prepare recent conversation history
    const previousMessages = conversation.messages
      .slice(-20)
      .map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));

    // Generate AI response
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      contents: [
        ...previousMessages,
        {
          role: "user",
          parts: [{ text: message.trim() }],
        },
      ],
      config: {
        systemInstruction:
          "You are a helpful AI assistant inside a real-time chat application. " +
          "Give clear, friendly and accurate answers. " +
          "Explain programming concepts step by step when asked.",
      },
    });

    const aiReply = response.text;

    if (!aiReply) {
      throw new Error("Gemini returned an empty response");
    }

    // Save conversation messages
    conversation.messages.push(
      {
        role: "user",
        content: message.trim(),
      },
      {
        role: "assistant",
        content: aiReply,
      }
    );

    await conversation.save();

    return res.status(200).json({
      success: true,
      conversationId: conversation._id,
      reply: aiReply,
      conversation,
    });
  } catch (error) {
    console.error("Gemini AI Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to generate AI response. Please try again.",
    });
  }
};

module.exports = {
  sendAIMessage,
};

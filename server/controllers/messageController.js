
const mongoose = require("mongoose");
const Message = require("../models/Message");

// SEND MESSAGE
const sendMessage = async (req, res) => {
  try {
    const sender = req.userId;
    const { receiver, text, image } = req.body;

    if (!receiver || (!text?.trim() && !image)) {
      return res.status(400).json({
        success: false,
        message: "Receiver and message content are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(receiver)) {
      return res.status(400).json({
        success: false,
        message: "Invalid receiver ID",
      });
    }

    const message = await Message.create({
      sender,
      receiver,
      text: text?.trim() || "",
      image: image || "",
    });

    res.status(201).json({
      success: true,
      message,
    });
  } catch (error) {
    console.error("Send Message Error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to send message",
    });
  }
};

// GET CONVERSATION MESSAGES
const getMessages = async (req, res) => {
  try {
    const currentUserId = req.userId;
    const { user2 } = req.query;

    if (!user2 || !mongoose.Types.ObjectId.isValid(user2)) {
      return res.status(400).json({
        success: false,
        message: "Valid user2 ID is required",
      });
    }

    const messages = await Message.find({
      deletedFor: { $ne: currentUserId },

      $or: [
        {
          sender: currentUserId,
          receiver: user2,
        },
        {
          sender: user2,
          receiver: currentUserId,
        },
      ],
    })
      .populate("sender", "fullName email profilePic")
      .populate("receiver", "fullName email profilePic")
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error("Get Messages Error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch messages",
    });
  }
};

module.exports = {
  sendMessage,
  getMessages,
};

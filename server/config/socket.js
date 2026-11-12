const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const Message = require("../models/Message");
const User = require("../models/User");

const onlineUsers = new Map();

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  // SOCKET AUTHENTICATION
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication token required"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (error) {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId.toString();

    console.log("User connected:", userId);

    socket.join(userId);

    // TRACK ONLINE USERS
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }

    onlineUsers.get(userId).add(socket.id);

    io.emit("onlineUsers", Array.from(onlineUsers.keys()));

    // SEND TEXT OR IMAGE MESSAGE
    socket.on("sendMessage", async (data, callback) => {
      try {
        const { receiver, text, image } = data || {};

        const cleanText = typeof text === "string" ? text.trim() : "";

        if (!receiver || !mongoose.Types.ObjectId.isValid(receiver)) {
          return callback?.({
            success: false,
            message: "Valid receiver is required",
          });
        }

        if (!cleanText && !image) {
          return callback?.({
            success: false,
            message: "Message text or image is required",
          });
        }

        // Validate uploaded image URL
        if (image) {
          try {
            const imageUrl = new URL(image);

            if (
              !["http:", "https:"].includes(imageUrl.protocol) ||
              !imageUrl.pathname.startsWith("/uploads/")
            ) {
              return callback?.({
                success: false,
                message: "Invalid image URL",
              });
            }
          } catch {
            return callback?.({
              success: false,
              message: "Invalid image URL",
            });
          }
        }

        if (receiver.toString() === userId) {
          return callback?.({
            success: false,
            message: "You cannot send a message to yourself",
          });
        }

        const receiverExists = await User.exists({
          _id: receiver,
        });

        if (!receiverExists) {
          return callback?.({
            success: false,
            message: "Receiver not found",
          });
        }

        const savedMessage = await Message.create({
          sender: userId,
          receiver,
          text: cleanText,
          image: image || "",
        });

        const populatedMessage = await Message.findById(savedMessage._id)
          .populate("sender", "fullName email profilePic")
          .populate("receiver", "fullName email profilePic");

        io.to(receiver.toString())
          .to(userId)
          .emit("newMessage", populatedMessage);

        callback?.({
          success: true,
          message: populatedMessage,
        });
      } catch (error) {
        console.error("Socket Message Error:", error.message);

        callback?.({
          success: false,
          message: "Unable to send message",
        });
      }
    });

    // MESSAGE DELIVERED
    socket.on("messageDelivered", async (data, callback) => {
      try {
        const { messageId } = data || {};

        if (!mongoose.Types.ObjectId.isValid(messageId)) {
          return callback?.({
            success: false,
            message: "Invalid message ID",
          });
        }

        const updatedMessage = await Message.findOneAndUpdate(
          {
            _id: messageId,
            receiver: userId,
            status: "sent",
          },
          {
            $set: { status: "delivered" },
          },
          {
            returnDocument: "after",
          },
        );

        if (updatedMessage) {
          io.to(updatedMessage.sender.toString()).emit("messageStatusUpdated", {
            messageId: updatedMessage._id.toString(),
            status: "delivered",
          });
        }

        callback?.({ success: true });
      } catch (error) {
        console.error("Delivery Receipt Error:", error.message);

        callback?.({
          success: false,
          message: "Unable to update delivery status",
        });
      }
    });

    // MARK MESSAGES AS READ
    socket.on("markMessagesRead", async (data, callback) => {
      try {
        const { senderId } = data || {};

        if (
          !mongoose.Types.ObjectId.isValid(senderId) ||
          senderId.toString() === userId
        ) {
          return callback?.({
            success: false,
            message: "Invalid sender ID",
          });
        }

        const unreadMessages = await Message.find({
          sender: senderId,
          receiver: userId,
          status: { $ne: "read" },
        }).select("_id");

        const messageIds = unreadMessages.map((message) => message._id);

        if (messageIds.length > 0) {
          await Message.updateMany(
            {
              _id: { $in: messageIds },
            },
            {
              $set: { status: "read" },
            },
          );

          io.to(senderId.toString()).emit("messagesRead", {
            messageIds: messageIds.map((id) => id.toString()),
            readerId: userId,
          });
        }

        callback?.({
          success: true,
          updatedCount: messageIds.length,
        });
      } catch (error) {
        console.error("Read Receipt Error:", error.message);

        callback?.({
          success: false,
          message: "Unable to update read status",
        });
      }
    });

    // EDIT MESSAGE
    socket.on("editMessage", async (data, callback) => {
      try {
        const { messageId, text } = data || {};
        const cleanText = typeof text === "string" ? text.trim() : "";

        if (!mongoose.Types.ObjectId.isValid(messageId) || !cleanText) {
          return callback?.({
            success: false,
            message: "Valid message ID and text are required",
          });
        }

        // Only the original sender can edit
        const updatedMessage = await Message.findOneAndUpdate(
          {
            _id: messageId,
            sender: userId,
          },
          {
            $set: {
              text: cleanText,
              edited: true,
            },
          },
          {
            new: true,
          },
        )
          .populate("sender", "fullName email profilePic")
          .populate("receiver", "fullName email profilePic");

        if (!updatedMessage) {
          return callback?.({
            success: false,
            message: "Message not found or you cannot edit it",
          });
        }

        io.to(updatedMessage.sender._id.toString())
          .to(updatedMessage.receiver._id.toString())
          .emit("messageEdited", {
            message: updatedMessage,
          });

        callback?.({
          success: true,
          message: updatedMessage,
        });
      } catch (error) {
        console.error("Edit Message Error:", error.message);

        callback?.({
          success: false,
          message: "Unable to edit message",
        });
      }
    });

    // DELETE MESSAGE
    socket.on("deleteMessage", async (data, callback) => {
      try {
        const { messageId, deleteFor } = data || {};

        if (
          !mongoose.Types.ObjectId.isValid(messageId) ||
          !["me", "everyone"].includes(deleteFor)
        ) {
          return callback?.({
            success: false,
            message: "Invalid delete request",
          });
        }

        const message = await Message.findById(messageId);

        if (!message) {
          return callback?.({
            success: false,
            message: "Message not found",
          });
        }

        const senderId = message.sender.toString();
        const receiverId = message.receiver.toString();

        // Make sure current user belongs to this conversation
        if (senderId !== userId && receiverId !== userId) {
          return callback?.({
            success: false,
            message: "You cannot delete this message",
          });
        }

        if (deleteFor === "everyone") {
          // Only the original sender can delete for everyone
          if (senderId !== userId) {
            return callback?.({
              success: false,
              message: "Only the sender can delete for everyone",
            });
          }

          await Message.deleteOne({ _id: messageId });

          io.to(senderId)
            .to(receiverId)
            .emit("messageDeleted", {
              messageId: String(messageId),
              deleteFor: "everyone",
            });
        } else {
          // Hide message only for current user
          await Message.updateOne(
            { _id: messageId },
            { $addToSet: { deletedFor: userId } },
          );

          io.to(userId).emit("messageDeleted", {
            messageId: String(messageId),
            deleteFor: "me",
          });
        }

        callback?.({ success: true });
      } catch (error) {
        console.error("Delete Message Error:", error.message);

        callback?.({
          success: false,
          message: "Unable to delete message",
        });
      }
    });

    // DELETE ENTIRE CHAT FOR CURRENT USER
    socket.on("deleteChat", async (data, callback) => {
      try {
        const { otherUserId } = data || {};

        if (
          !mongoose.Types.ObjectId.isValid(otherUserId) ||
          otherUserId.toString() === userId
        ) {
          return callback?.({
            success: false,
            message: "Invalid user ID",
          });
        }

        await Message.updateMany(
          {
            $or: [
              {
                sender: userId,
                receiver: otherUserId,
              },
              {
                sender: otherUserId,
                receiver: userId,
              },
            ],
          },
          {
            $addToSet: {
              deletedFor: userId,
            },
          },
        );

        // Notify only this user's connected devices
        io.to(userId).emit("chatDeleted", {
          otherUserId: String(otherUserId),
        });

        callback?.({
          success: true,
          message: "Chat deleted successfully",
        });
      } catch (error) {
        console.error("Delete Chat Error:", error.message);

        callback?.({
          success: false,
          message: "Unable to delete chat",
        });
      }
    });

    // USER IS TYPING
    socket.on("typing", (data = {}) => {
      const { receiver } = data;

      if (
        !receiver ||
        !mongoose.Types.ObjectId.isValid(receiver) ||
        receiver.toString() === userId
      ) {
        return;
      }

      io.to(receiver.toString()).emit("userTyping", {
        senderId: userId,
      });
    });

    // USER STOPPED TYPING
    socket.on("stopTyping", (data = {}) => {
      const { receiver } = data;

      if (
        !receiver ||
        !mongoose.Types.ObjectId.isValid(receiver) ||
        receiver.toString() === userId
      ) {
        return;
      }

      io.to(receiver.toString()).emit("userStoppedTyping", {
        senderId: userId,
      });
    });

    // DISCONNECT
    socket.on("disconnect", () => {
      console.log("User disconnected:", userId);

      const userSockets = onlineUsers.get(userId);

      if (userSockets) {
        userSockets.delete(socket.id);

        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
        }
      }

      io.emit("onlineUsers", Array.from(onlineUsers.keys()));
    });
  });

  return io;
};

module.exports = initSocket;

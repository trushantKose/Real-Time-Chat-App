import { useState, useEffect, useRef } from "react";

import Sidebar from "./components/Sidebar";
import ChatList from "./components/ChatList";
import ChatWindow from "./components/ChatWindow";

import socket from "./lib/socket";
import api from "./lib/axios";
import useAuth from "./context/useAuth";

import "./App.css";

const ChatPage = () => {
  const { user } = useAuth();

  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [message, setMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploading, setUploading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState("");
  const [typingUserId, setTypingUserId] = useState(null);

  const onlineUsersRef = useRef([]);
  const typingTimerRef = useRef(null);

  const selectedChat = chats.find((chat) => chat.id === selectedChatId);

  const formatTime = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Create image preview
  useEffect(() => {
    if (!selectedImage) {
      setImagePreview("");
      return;
    }

    const previewUrl = URL.createObjectURL(selectedImage);
    setImagePreview(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [selectedImage]);

  // 1. Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);

        const response = await api.get("/users");

        const otherUsers = response.data.users.filter(
          (item) => item._id !== user?._id,
        );

        const formattedChats = otherUsers.map((item) => ({
          id: item._id,
          name: item.fullName,
          avatar: item.fullName.charAt(0).toUpperCase(),
          profilePic: item.profilePic,
          online: onlineUsersRef.current.includes(item._id),
          lastMessage: "Start a conversation",
          time: "",
          unread: 0,
          messages: [],
        }));

        setChats(formattedChats);
      } catch (error) {
        console.error("Fetch Users Error:", error);

        setError(error.response?.data?.message || "Unable to load users");
      } finally {
        setLoading(false);
      }
    };

    if (user?._id) fetchUsers();
  }, [user?._id]);

  // 2. Fetch previous messages
  useEffect(() => {
    if (!selectedChatId || !user?._id) return;

    let isActive = true;

    const fetchMessages = async () => {
      try {
        setMessagesLoading(true);

        const response = await api.get(`/messages?user2=${selectedChatId}`);

        if (!isActive) return;

        const formattedMessages = response.data.messages.map((msg) => ({
          id: String(msg._id),
          text: msg.text || "",
          image: msg.image || "",
          sender: String(msg.sender?._id) === String(user._id) ? "me" : "other",
          time: formatTime(msg.createdAt),
          status: msg.status || "sent",
        }));

        setChats((previousChats) =>
          previousChats.map((chat) =>
            chat.id === selectedChatId
              ? {
                  ...chat,
                  messages: formattedMessages,
                  lastMessage:
                    formattedMessages.at(-1)?.text ||
                    (formattedMessages.at(-1)?.image
                      ? "📷 Image"
                      : "Start a conversation"),
                }
              : chat,
          ),
        );

        if (socket.connected) {
          socket.emit("markMessagesRead", {
            senderId: selectedChatId,
          });
        }
      } catch (error) {
        if (!isActive) return;

        console.error("Fetch Messages Error:", error);

        setError(error.response?.data?.message || "Unable to load messages");
      } finally {
        if (isActive) setMessagesLoading(false);
      }
    };

    fetchMessages();

    return () => {
      isActive = false;
    };
  }, [selectedChatId, user?._id]);

  // 3. Connect to Socket.IO and track online users
  useEffect(() => {
    if (!user?._id) return;

    socket.auth = {
      token: localStorage.getItem("token"),
    };

    const handleConnect = () => {
      console.log("Socket connected:", socket.id);
    };

    const handleConnectError = (error) => {
      console.error("Socket connection error:", error.message);
    };

    const handleOnlineUsers = (onlineUserIds) => {
      onlineUsersRef.current = onlineUserIds.map(String);

      setChats((previousChats) =>
        previousChats.map((chat) => ({
          ...chat,
          online: onlineUsersRef.current.includes(String(chat.id)),
        })),
      );
    };

    socket.on("connect", handleConnect);
    socket.on("connect_error", handleConnectError);
    socket.on("onlineUsers", handleOnlineUsers);

    socket.connect();

    return () => {
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleConnectError);
      socket.off("onlineUsers", handleOnlineUsers);
      socket.disconnect();
    };
  }, [user?._id]);

  // 4. Listen for new messages
  useEffect(() => {
    if (!user?._id) return;

    const handleNewMessage = (msg) => {
      const senderId = String(msg.sender?._id);
      const receiverId = String(msg.receiver?._id);
      const currentUserId = String(user._id);

      const isReceiver = receiverId === currentUserId;

      const otherUserId = isReceiver ? senderId : receiverId;

      const newMessage = {
        id: String(msg._id),
        text: msg.text || "",
        image: msg.image || "",
        sender: isReceiver ? "other" : "me",
        time: formatTime(msg.createdAt),
        status: msg.status || "sent",
      };

      setChats((previousChats) =>
        previousChats.map((chat) => {
          if (chat.id !== otherUserId) return chat;

          const alreadyExists = chat.messages.some(
            (item) => item.id === newMessage.id,
          );

          return {
            ...chat,
            messages: alreadyExists
              ? chat.messages
              : [...chat.messages, newMessage],
            lastMessage: msg.text || (msg.image ? "📷 Image" : ""),
            time: "Now",
          };
        }),
      );

      // Confirm delivery and read status
      if (isReceiver && socket.connected) {
        socket.emit("messageDelivered", {
          messageId: String(msg._id),
        });

        if (selectedChatId === senderId) {
          socket.emit("markMessagesRead", {
            senderId,
          });
        }
      }
    };

    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, [user?._id, selectedChatId]);

  // 5. Listen for delivery status updates
  useEffect(() => {
    const handleMessageStatusUpdated = ({ messageId, status }) => {
      setChats((previousChats) =>
        previousChats.map((chat) => ({
          ...chat,
          messages: chat.messages.map((msg) =>
            msg.id === String(messageId) ? { ...msg, status } : msg,
          ),
        })),
      );
    };

    socket.on("messageStatusUpdated", handleMessageStatusUpdated);

    return () => {
      socket.off("messageStatusUpdated", handleMessageStatusUpdated);
    };
  }, []);

  // 6. Listen for read receipts
  useEffect(() => {
    const handleMessagesRead = ({ messageIds }) => {
      const readIds = new Set(messageIds.map(String));

      setChats((previousChats) =>
        previousChats.map((chat) => ({
          ...chat,
          messages: chat.messages.map((msg) =>
            readIds.has(msg.id) ? { ...msg, status: "read" } : msg,
          ),
        })),
      );
    };

    socket.on("messagesRead", handleMessagesRead);

    return () => {
      socket.off("messagesRead", handleMessagesRead);
    };
  }, []);

  // 7. Listen for typing events
  useEffect(() => {
    if (!selectedChatId) {
      setTypingUserId(null);
      return;
    }

    const handleUserTyping = ({ senderId }) => {
      if (String(senderId) === String(selectedChatId)) {
        setTypingUserId(String(senderId));
      }
    };

    const handleUserStoppedTyping = ({ senderId }) => {
      if (String(senderId) === String(selectedChatId)) {
        setTypingUserId(null);
      }
    };

    socket.on("userTyping", handleUserTyping);
    socket.on("userStoppedTyping", handleUserStoppedTyping);

    return () => {
      socket.off("userTyping", handleUserTyping);
      socket.off("userStoppedTyping", handleUserStoppedTyping);
      setTypingUserId(null);
    };
  }, [selectedChatId]);

  // 8. Stop typing and clear timer
  const stopTyping = (receiverId) => {
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }

    if (receiverId && socket.connected) {
      socket.emit("stopTyping", {
        receiver: receiverId,
      });
    }
  };

  // 9. Handle message input and typing events
  const handleMessageChange = (nextValue) => {
    const value =
      typeof nextValue === "string"
        ? nextValue
        : (nextValue?.target?.value ?? "");

    setMessage(value);

    if (!selectedChatId || !socket.connected) return;

    if (!value.trim()) {
      stopTyping(selectedChatId);
      return;
    }

    socket.emit("typing", {
      receiver: selectedChatId,
    });

    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }

    typingTimerRef.current = setTimeout(() => {
      stopTyping(selectedChatId);
    }, 1000);
  };

  // 10. Select an image
  const handleImageSelect = (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be 5 MB or less");
      return;
    }

    setSelectedImage(file);
    setError("");
  };

  // Remove selected image
  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview("");
  };

  // 11. Select a user
  const handleSelectChat = (chat) => {
    stopTyping(selectedChatId);

    setSelectedChatId(chat.id);
    setTypingUserId(null);
    setError("");
    setMessage("");
    setSelectedImage(null);
  };

  // 12. Send text or image message
  const handleSendMessage = async () => {
    const text = message.trim();

    if ((!text && !selectedImage) || !selectedChatId) return;

    if (!socket.connected) {
      setError("Not connected to chat server. Please try again.");
      return;
    }

    try {
      setUploading(true);
      setError("");

      stopTyping(selectedChatId);

      let imageUrl = "";

      // Upload image first
      if (selectedImage) {
        const formData = new FormData();

        formData.append("image", selectedImage);

        const uploadResponse = await api.post("/images/upload", formData);

        imageUrl = uploadResponse.data.image;

        if (!imageUrl) {
          throw new Error("Image upload did not return a URL");
        }
      }

      // Send text and/or uploaded image through Socket.IO
      socket.emit(
        "sendMessage",
        {
          receiver: selectedChatId,
          text,
          image: imageUrl,
        },
        (response) => {
          if (!response?.success) {
            setError(response?.message || "Message could not be sent");
            return;
          }

          setMessage("");
          setSelectedImage(null);
          setImagePreview("");
          setError("");
        },
      );
    } catch (error) {
      console.error("Send Message Error:", error);

      setError(
        error.response?.data?.message ||
          error.message ||
          "Unable to send message",
      );
    } finally {
      setUploading(false);
    }
  };

  // EDIT MESSAGE
  const handleEditMessage = (messageId, newText) => {
    if (!newText.trim() || !socket.connected) return;

    socket.emit(
      "editMessage",
      {
        messageId,
        text: newText.trim(),
      },
      (response) => {
        if (!response?.success) {
          setError(response?.message || "Unable to edit message");
          return;
        }

        setError("");
      },
    );
  };

  // DELETE MESSAGE
  const handleDeleteMessage = (messageId, deleteFor) => {
    if (!socket.connected) return;

    socket.emit(
      "deleteMessage",
      {
        messageId,
        deleteFor,
      },
      (response) => {
        if (!response?.success) {
          setError(response?.message || "Unable to delete message");
          return;
        }

        setError("");
      },
    );
  };

  // DELETE ENTIRE CHAT FOR ME
  const handleDeleteChat = (otherUserId) => {
    if (!socket.connected) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this conversation for yourself?",
    );

    if (!confirmed) return;

    socket.emit("deleteChat", { otherUserId }, (response) => {
      if (!response?.success) {
        setError(response?.message || "Unable to delete chat");
        return;
      }

      setSelectedChatId(null);
      setMessage("");
      setSelectedImage(null);
      setError("");
    });
  };

  // 13. Clean up typing timer
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
    };
  }, []);

  // HANDLE EDIT AND DELETE EVENTS
  useEffect(() => {
    // Message edited
    const handleMessageEdited = ({ message }) => {
      setChats((previousChats) =>
        previousChats.map((chat) => ({
          ...chat,
          messages: chat.messages.map((msg) =>
            msg.id === String(message._id)
              ? {
                  ...msg,
                  text: message.text,
                  edited: message.edited,
                }
              : msg,
          ),
        })),
      );
    };

    // Message deleted
    const handleMessageDeleted = ({ messageId, deleteFor }) => {
      setChats((previousChats) =>
        previousChats.map((chat) => ({
          ...chat,
          messages: chat.messages.filter((msg) => msg.id !== String(messageId)),
        })),
      );
    };

    // Entire chat deleted for current user
    const handleChatDeleted = ({ otherUserId }) => {
      setChats((previousChats) =>
        previousChats.map((chat) =>
          chat.id === String(otherUserId)
            ? {
                ...chat,
                messages: [],
                lastMessage: "Start a conversation",
                time: "",
              }
            : chat,
        ),
      );

      if (selectedChatId === String(otherUserId)) {
        setSelectedChatId(null);
        setMessage("");
        setSelectedImage(null);
      }
    };

    socket.on("messageEdited", handleMessageEdited);
    socket.on("messageDeleted", handleMessageDeleted);
    socket.on("chatDeleted", handleChatDeleted);

    return () => {
      socket.off("messageEdited", handleMessageEdited);
      socket.off("messageDeleted", handleMessageDeleted);
      socket.off("chatDeleted", handleChatDeleted);
    };
  }, [selectedChatId]);

  return (
    <div className="app-container">
      <Sidebar />

      <ChatList
        chats={chats}
        selectedChat={selectedChat}
        onSelectChat={handleSelectChat}
        loading={loading}
      />

      {error ? (
        <div className="chat-window">
          <p>{error}</p>
        </div>
      ) : selectedChat ? (
        <ChatWindow
          chat={selectedChat}
          message={message}
          setMessage={handleMessageChange}
          onSend={handleSendMessage}
          messagesLoading={messagesLoading}
          isTyping={typingUserId === selectedChatId}
          selectedImage={selectedImage}
          imagePreview={imagePreview}
          onImageSelect={handleImageSelect}
          onRemoveImage={handleRemoveImage}
          uploading={uploading}
          onEditMessage={handleEditMessage}
          onDeleteMessage={handleDeleteMessage}
          onDeleteChat={handleDeleteChat}
        />
      ) : (
        <div className="chat-window">
          <p>
            {loading ? "Loading users..." : "Select a user to start chatting."}
          </p>
        </div>
      )}
    </div>
  );
};

export default ChatPage;

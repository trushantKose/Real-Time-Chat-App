
import { useState } from "react";

import {
  Phone,
  Video,
  Check,
  CheckCheck,
  X,
  MoreVertical,
  Pencil,
  Trash2,
  MessageSquareOff,
  Save,
} from "lucide-react";

import MessageInput from "./MessageInput";

// Display message delivery status
function MessageStatus({ status }) {
  if (status === "read") {
    return (
      <CheckCheck
        size={16}
        className="message-status read"
        title="Read"
      />
    );
  }

  if (status === "delivered") {
    return (
      <CheckCheck
        size={16}
        className="message-status"
        title="Delivered"
      />
    );
  }

  return (
    <Check
      size={16}
      className="message-status"
      title="Sent"
    />
  );
}

function ChatWindow({
  chat,
  message,
  setMessage,
  onSend,
  messagesLoading,
  isTyping,
  selectedImage,
  imagePreview,
  onImageSelect,
  onRemoveImage,
  uploading,
  onEditMessage,
  onDeleteMessage,
  onDeleteChat,
}) {
  const [activeMenu, setActiveMenu] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState("");

  // START EDITING
  const handleStartEdit = (msg) => {
    setEditingMessageId(msg.id);
    setEditText(msg.text || "");
    setActiveMenu(null);
  };

  // SAVE EDITED MESSAGE
  const handleSaveEdit = (messageId) => {
    if (!editText.trim()) return;

    onEditMessage(messageId, editText);

    setEditingMessageId(null);
    setEditText("");
  };

  // CANCEL EDITING
  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditText("");
  };

  // DELETE MESSAGE
  const handleDelete = (messageId, deleteFor) => {
    const messageText =
      deleteFor === "everyone"
        ? "Delete this message for everyone?"
        : "Delete this message for yourself?";

    if (!window.confirm(messageText)) return;

    onDeleteMessage(messageId, deleteFor);
    setActiveMenu(null);
  };

  // DELETE CHAT
  const handleDeleteChat = () => {
    onDeleteChat(chat.id);
    setActiveMenu(null);
  };

  return (
    <section className="chat-window">
      {/* CHAT HEADER */}
      <header className="chat-header">
        <div className="chat-user">
          <div className="avatar">
            {chat.profilePic ? (
              <img
                src={chat.profilePic}
                alt={chat.name}
                className="avatar-image"
              />
            ) : (
              chat.avatar
            )}
          </div>

          <div>
            <h2>{chat.name}</h2>

            <span>
              {isTyping ? (
                <span className="typing-text">
                  Typing...
                </span>
              ) : (
                <>
                  <span
                    className={`online-dot ${
                      chat.online ? "" : "offline-dot"
                    }`}
                  ></span>

                  {chat.online ? "Online" : "Offline"}
                </>
              )}
            </span>
          </div>
        </div>

        <div className="chat-actions">
          <button type="button" title="Voice call">
            <Phone />
          </button>

          <button type="button" title="Video call">
            <Video />
          </button>

          <button
            type="button"
            title="Delete chat"
            onClick={handleDeleteChat}
          >
            <Trash2 size={20} />
          </button>
        </div>
      </header>

      {/* MESSAGES AREA */}
      <div className="messages-area">
        {messagesLoading ? (
          <p>Loading messages...</p>
        ) : chat.messages?.length === 0 ? (
          <p className="empty-messages">
            No messages yet. Say hello!
          </p>
        ) : (
          chat.messages.map((msg) => (
            <div
              key={msg.id}
              className={`message-row ${
                msg.sender === "me" ? "my-message" : ""
              }`}
            >
              <div
                className={`message-bubble ${
                  msg.sender === "me" ? "sent" : "received"
                }`}
              >
                {/* MESSAGE MENU */}
                {editingMessageId !== msg.id && (
                  <div className="message-menu-container">
                    <button
                      type="button"
                      className="message-menu-button"
                      title="Message options"
                      onClick={() =>
                        setActiveMenu(
                          activeMenu === msg.id ? null : msg.id
                        )
                      }
                    >
                      <MoreVertical size={17} />
                    </button>

                    {activeMenu === msg.id && (
                      <div className="message-action-menu">
                        {msg.sender === "me" && msg.text && (
                          <button
                            type="button"
                            onClick={() => handleStartEdit(msg)}
                          >
                            <Pencil size={15} />
                            Edit
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(msg.id, "me")
                          }
                        >
                          <Trash2 size={15} />
                          Delete for me
                        </button>

                        {msg.sender === "me" && (
                          <button
                            type="button"
                            className="delete-everyone-option"
                            onClick={() =>
                              handleDelete(msg.id, "everyone")
                            }
                          >
                            <MessageSquareOff size={15} />
                            Delete for everyone
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* EDIT MESSAGE FORM */}
                {editingMessageId === msg.id ? (
                  <div className="edit-message-form">
                    <textarea
                      value={editText}
                      onChange={(e) =>
                        setEditText(e.target.value)
                      }
                      autoFocus
                      rows={3}
                    />

                    <div className="edit-message-actions">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        title="Cancel"
                      >
                        <X size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSaveEdit(msg.id)}
                        disabled={!editText.trim()}
                        title="Save changes"
                      >
                        <Save size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* DISPLAY IMAGE */}
                    {msg.image && (
                      <img
                        src={msg.image}
                        alt="Shared image"
                        className="chat-message-image"
                        onClick={() =>
                          window.open(
                            msg.image,
                            "_blank",
                            "noopener,noreferrer"
                          )
                        }
                      />
                    )}

                    {/* DISPLAY TEXT */}
                    {msg.text && <p>{msg.text}</p>}

                    {/* MESSAGE TIME AND STATUS */}
                    <div className="message-meta">
                      {msg.edited && (
                        <span className="edited-label">
                          edited
                        </span>
                      )}

                      <span>{msg.time}</span>

                      {msg.sender === "me" && (
                        <MessageStatus status={msg.status} />
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))
        )}

        {/* TYPING INDICATOR */}
        {isTyping && (
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
      </div>

      {/* IMAGE PREVIEW */}
      {imagePreview && (
        <div className="image-preview-container">
          <div className="image-preview-wrapper">
            <img
              src={imagePreview}
              alt="Selected image preview"
              className="image-preview"
            />

            <button
              type="button"
              className="remove-image-button"
              onClick={onRemoveImage}
              disabled={uploading}
              title="Remove image"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* MESSAGE INPUT */}
      <MessageInput
        message={message}
        setMessage={setMessage}
        onSend={onSend}
        onImageSelect={onImageSelect}
        uploading={uploading}
        hasImage={Boolean(selectedImage)}
      />
    </section>
  );
}

export default ChatWindow;

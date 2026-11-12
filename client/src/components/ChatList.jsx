
function ChatList({
  chats,
  selectedChat,
  onSelectChat,
  loading,
}) {
  return (
    <section className="chat-list">
      <div className="chat-list-header">
        <h2>Your Chats</h2>
        <button className="new-chat-btn">
          + New Chat
        </button>
      </div>

      <div className="chat-items">
        {loading && <p>Loading users...</p>}

        {!loading && chats.length === 0 && (
          <p>No other users found.</p>
        )}

        {chats.map((chat) => (
          <div
            key={chat.id}
            className={`chat-item ${
              selectedChat?.id === chat.id ? "selected" : ""
            }`}
            onClick={() => onSelectChat(chat)}
          >
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

            <div className="chat-info">
              <div className="chat-name">
                <h3>{chat.name}</h3>
                <span>{chat.time}</span>
              </div>

              <div className="last-message">
                <p>{chat.lastMessage}</p>

                {chat.unread > 0 && (
                  <span className="unread-badge">
                    {chat.unread}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default ChatList;

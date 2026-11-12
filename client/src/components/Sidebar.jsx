
import { MessageCircle, Users, LogOut } from "lucide-react";
import useAuth from "../context/useAuth";

function Sidebar() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <aside className="sidebar">
      <div className="brand">
        <MessageCircle size={32} />
        <h2>ChatApp</h2>
      </div>

      <div className="user-status">
        <span className="online-dot"></span>
        Online
      </div>

      <nav className="sidebar-nav">
        <button className="nav-item active">
          <MessageCircle size={21} />
          Chats
        </button>

        <button className="nav-item">
          <Users size={21} />
          Users
        </button>

        <button className="nav-item" onClick={handleLogout}>
          <LogOut size={21} />
          Logout
        </button>
      </nav>

      <div className="profile">
        <div className="avatar my-avatar">
          {user?.fullName?.charAt(0).toUpperCase() || "U"}
        </div>

        <span>{user?.fullName || "User"}</span>
      </div>
    </aside>
  );
}

export default Sidebar;

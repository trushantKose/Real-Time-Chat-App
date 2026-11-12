
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const path = require("path");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");
const authRoutes = require("./routes/authRoutes");
const imageRoutes = require("./routes/imageRoutes");
const connectDB = require("./config/db");
const initSocket = require("./config/socket");
const aiRoutes = require("./routes/aiRoutes");
dotenv.config();

console.log(
  "Gemini API key loaded:",
  Boolean(process.env.GEMINI_API_KEY)
);
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO AFTER importing initSocket
const io = initSocket(server);

app.use(cors());
app.use(express.json());
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/images", imageRoutes);
app.use("/api/ai", aiRoutes);

app.get("/", (req, res) => {
  res.send("Chat App Backend is Running");
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();

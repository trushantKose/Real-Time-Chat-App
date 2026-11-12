# Real-Time Chat Application

A full-stack real-time chat application built using **React, Node.js, Express, MongoDB, and Socket.IO**. It allows users to communicate instantly through a responsive messaging interface.

## Features

- User registration and login
- Secure authentication using JWT
- Real-time messaging using Socket.IO
- Online and offline user status
- Typing indicators
- Message delivery and read receipts
- Image sharing
- Edit and delete messages
- Responsive chat interface

## Tech Stack

**Frontend**
- React.js
- Vite
- React Router
- Axios
- Socket.IO Client
- CSS
- Lucide React

**Backend**
- Node.js
- Express.js
- MongoDB
- Mongoose
- Socket.IO
- JSON Web Tokens (JWT)

## Project Structure

```text
Real-Time-Chat-App/
│
├── client/              # React frontend
│   ├── src/
│   ├── public/
│   └── package.json
│
├── server/              # Node.js backend
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── server.js
│
├── .gitignore
└── README.md
```

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/trushantKose/Real-Time-Chat-App.git
```

### 2. Navigate to the project folder

```bash
cd Real-Time-Chat-App
```

### 3. Install frontend dependencies

```bash
cd client
npm install
```

### 4. Install backend dependencies

Open another terminal:

```bash
cd server
npm install
```

### 5. Configure environment variables

Create `.env` files using the provided example files:

- `client/.env.example`
- `server/.env.example`

Add your own local configuration values. Never commit real API keys, database credentials, or JWT secrets.

### 6. Run the application

Start the backend using the development or start script defined in `server/package.json`.

Start the frontend using:

```bash
cd client
npm run dev
```

Open the local frontend URL shown in your terminal, usually:

```text
http://localhost:5173
```

## Screenshots

Screenshots of the application will be added here.

<!-- Add screenshots in a screenshots folder and link them here. -->

## Future Improvements

- AI-powered chatbot
- Voice and video calling
- Group chat functionality
- Message search
- Cloud-based image storage

## Author

**Trushant Kose**

GitHub: https://github.com/trushantKose

---

This project was developed as part of my full-stack web development learning journey.

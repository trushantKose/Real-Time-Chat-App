
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ChatPage from "./ChatPage";
import useAuth from "./context/useAuth";

const ProtectedRoute = ({ children }) => {
  const { token } = useAuth();

  return token ? children : <Navigate to="/login" replace />;
};

function App() {
  const { token } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={token ? <Navigate to="/" replace /> : <Login />}
        />

        <Route
          path="/register"
          element={token ? <Navigate to="/" replace /> : <Register />}
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;


import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import "../styles/auth.css";
import useAuth from "../context/useAuth";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/");
    } catch (error) {
      setError(
        error.response?.data?.message || "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="auth-brand-panel">
          <div className="auth-brand">
            <div className="brand-icon">
              <MessageCircle size={25} />
            </div>
            <span>Connectly</span>
          </div>

          <div className="brand-content">
            <span className="brand-tagline">
              <Sparkles size={15} />
              YOUR SPACE TO CONNECT
            </span>

            <h1>
              Conversations
              <br />
              that bring us
              <br />
              <span>closer.</span>
            </h1>

            <p>
              Connect with people, share moments, and
              make every conversation count.
            </p>

            <div className="brand-decoration">
              <div className="decoration-circle circle-one" />
              <div className="decoration-circle circle-two" />
              <div className="decoration-circle circle-three" />
              <MessageCircle className="decoration-icon" size={100} />
            </div>
          </div>

          <div className="brand-footer">
            <span>Simple. Personal. Connected.</span>
            <span>© 2026 Connectly</span>
          </div>
        </div>

        <div className="auth-form-panel">
          <div className="auth-form-wrapper">
            <div className="mobile-brand">
              <div className="brand-icon">
                <MessageCircle size={23} />
              </div>
              <span>Connectly</span>
            </div>

            <div className="auth-heading">
              <span className="auth-eyebrow">WELCOME BACK</span>
              <h2>Sign in to your account</h2>
              <p>
                Enter your details to continue your conversations.
              </p>
            </div>

            <form onSubmit={handleLogin} className="auth-form">
              <div className="auth-field">
                <label htmlFor="login-email">Email address</label>
                <div className="auth-input-wrapper">
                  <Mail size={19} />
                  <input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="login-password">Password</label>
                <div className="auth-input-wrapper">
                  <Lock size={19} />
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <p className="auth-message error" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="auth-submit"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <p className="auth-switch">
              Don't have an account?
              <Link to="/register"> Create account</Link>
            </p>

            <div className="auth-bottom-text">
              Your conversations, all in one place.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

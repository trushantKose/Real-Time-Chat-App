
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import "../styles/auth.css";
import useAuth from "../context/useAuth";

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await register(fullName, email, password);

      setSuccess("Registration successful! Please login.");

      setTimeout(() => navigate("/login"), 1000);
    } catch (error) {
      setError(
        error.response?.data?.message || "Registration failed"
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
              START SOMETHING NEW
            </span>

            <h1>
              Your people.
              <br />
              Your moments.
              <br />
              <span>One place.</span>
            </h1>

            <p>
              Create your account and discover a better
              way to stay connected with the people who matter.
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
              <span className="auth-eyebrow">GET STARTED</span>
              <h2>Create your account</h2>
              <p>
                Join Connectly and start meaningful conversations.
              </p>
            </div>

            <form onSubmit={handleRegister} className="auth-form">
              <div className="auth-field">
                <label htmlFor="register-name">Full name</label>
                <div className="auth-input-wrapper">
                  <User size={19} />
                  <input
                    id="register-name"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    autoComplete="name"
                    required
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="register-email">Email address</label>
                <div className="auth-input-wrapper">
                  <Mail size={19} />
                  <input
                    id="register-email"
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
                <label htmlFor="register-password">Password</label>
                <div className="auth-input-wrapper">
                  <Lock size={19} />
                  <input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
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

              {success && (
                <p className="auth-message success" role="status">
                  {success}
                </p>
              )}

              <button
                type="submit"
                className="auth-submit"
                disabled={loading}
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>

            <p className="auth-switch">
              Already have an account?
              <Link to="/login"> Sign in</Link>
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

export default Register;

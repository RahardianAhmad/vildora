import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [loading, setLoading] = useState(false);

  // ======================================================
  // LOGIN SECURITY
  // ======================================================

  const MAX_ATTEMPTS = 3;
  const LOCK_TIME = 2 * 60 * 1000; // 2 menit

  const [attempts, setAttempts] = useState(() => {
    return Number(localStorage.getItem("loginAttempts") || 0);
  });

  const [lockUntil, setLockUntil] = useState(() => {
    return Number(localStorage.getItem("loginLockUntil") || 0);
  });

  const [remainingTime, setRemainingTime] = useState(0);

  // ======================================================
  // CEK LOCK
  // ======================================================

  useEffect(() => {
    const checkLock = () => {
      const savedLockUntil = Number(
        localStorage.getItem("loginLockUntil") || 0,
      );

      const now = Date.now();

      if (savedLockUntil > now) {
        setLockUntil(savedLockUntil);

        const remaining = Math.ceil((savedLockUntil - now) / 1000);

        setRemainingTime(remaining);
      } else {
        if (savedLockUntil !== 0) {
          localStorage.removeItem("loginLockUntil");
          localStorage.removeItem("loginAttempts");
        }

        setLockUntil(0);
        setRemainingTime(0);
        setAttempts(0);
      }
    };

    checkLock();

    const interval = setInterval(checkLock, 1000);

    return () => clearInterval(interval);
  }, []);

  // ======================================================
  // FORMAT WAKTU
  // ======================================================

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);

    const secs = seconds % 60;

    return `${String(minutes).padStart(
      2,
      "0",
    )}:${String(secs).padStart(2, "0")}`;
  };

  // ======================================================
  // LOGIN
  // ======================================================

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    // ==================================================
    // CEK APAKAH MASIH DIKUNCI
    // ==================================================

    const savedLockUntil = Number(localStorage.getItem("loginLockUntil") || 0);

    if (savedLockUntil > Date.now()) {
      const remaining = Math.ceil((savedLockUntil - Date.now()) / 1000);

      setRemainingTime(remaining);

      setError("Terlalu banyak percobaan login.");

      return;
    }

    setLoading(true);

    try {
      console.log("Mengirim login:", email);

      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          email: email.trim(),
          password: password,
        }),
      });

      console.log("Status:", response.status);

      const data = await response.json();

      console.log("Response backend:", data);

      // ==================================================
      // LOGIN GAGAL
      // ==================================================

      if (!response.ok) {
        const newAttempts = attempts + 1;

        setAttempts(newAttempts);

        localStorage.setItem("loginAttempts", newAttempts);

        // ==============================================
        // SUDAH 3 KALI
        // ==============================================

        if (newAttempts >= MAX_ATTEMPTS) {
          const newLockUntil = Date.now() + LOCK_TIME;

          localStorage.setItem("loginLockUntil", newLockUntil);

          localStorage.setItem("loginAttempts", newAttempts);

          setLockUntil(newLockUntil);

          setRemainingTime(LOCK_TIME / 1000);

          setError("3 kali percobaan gagal. Login dikunci selama 2 menit.");
        } else {
          // ==========================================
          // MASIH ADA PERCOBAAN
          // ==========================================

          const remainingAttempts = MAX_ATTEMPTS - newAttempts;

          setError(
            `${
              data.message || "Email atau password salah"
            }. Sisa percobaan: ${remainingAttempts} kali.`,
          );
        }

        setLoading(false);

        return;
      }

      // ==================================================
      // LOGIN BERHASIL
      // ==================================================

      localStorage.setItem("token", data.token);

      localStorage.setItem("user", JSON.stringify(data.user));

      // RESET PERCOBAAN
      localStorage.removeItem("loginAttempts");

      localStorage.removeItem("loginLockUntil");

      setAttempts(0);
      setLockUntil(0);
      setRemainingTime(0);

      console.log("LOGIN BERHASIL");

      console.log("USER:", data.user);

      // ==================================================
      // POPUP BERHASIL
      // ==================================================

      setSuccess("Login berhasil! Selamat datang 👋");

      setLoading(false);

      // ==================================================
      // REDIRECT
      // ==================================================

      setTimeout(() => {
        if (data.user.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
      }, 1000);
    } catch (error) {
      console.error("LOGIN ERROR:", error);

      setError("Tidak dapat terhubung ke server.");

      setLoading(false);
    }
  };

  // ======================================================
  // STATUS LOCK
  // ======================================================

  const isLocked = lockUntil > Date.now();

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <>
      <style>{`

        * {
          box-sizing: border-box;
        }

        /* ================================================
           PAGE
        ================================================ */

        .auth-page {
          min-height: 100vh;

          display: flex;

          align-items: center;
          justify-content: center;

          padding: 25px;

          background:
            radial-gradient(
              circle at top left,
              rgba(37,99,235,.15),
              transparent 35%
            ),
            radial-gradient(
              circle at bottom right,
              rgba(124,58,237,.14),
              transparent 35%
            ),
            #070b16;

          color: #f8fafc;
        }


        /* ================================================
           CARD
        ================================================ */

        .auth-card {
          width: 100%;
          max-width: 440px;

          padding: 38px;

          border:
            1px solid rgba(255,255,255,.08);

          border-radius: 20px;

          background:
            rgba(15,23,42,.94);

          box-shadow:
            0 25px 70px rgba(0,0,0,.40);

          backdrop-filter:
            blur(15px);
        }


        .auth-card h1 {
          margin: 0 0 8px;

          color: #f8fafc;

          font-size: 30px;

          font-weight: 800;
        }


        .auth-subtitle {
          margin: 0 0 24px;

          color: #94a3b8;

          font-size: 14px;
        }


        /* ================================================
           FORM
        ================================================ */

        .auth-card form {
          display: flex;

          flex-direction: column;

          gap: 14px;
        }


        .auth-card input {
          width: 100%;

          height: 52px;

          padding: 0 16px;

          border:
            1px solid rgba(255,255,255,.10);

          border-radius: 10px;

          outline: none;

          color: #f8fafc;

          background:
            rgba(15,23,42,.85);

          font-size: 14px;

          transition: .2s ease;
        }


        .auth-card input::placeholder {
          color: #64748b;
        }


        .auth-card input:focus {
          border-color: #3b82f6;

          box-shadow:
            0 0 0 3px
            rgba(59,130,246,.12);
        }


        .auth-card input:disabled {
          opacity: .5;

          cursor: not-allowed;
        }


        /* ================================================
           BUTTON
        ================================================ */

        .auth-card button.login-button {
          width: 100%;

          height: 50px;

          margin-top: 2px;

          border: 0;

          border-radius: 10px;

          color: white;

          background:
            linear-gradient(
              135deg,
              #2563eb,
              #7c3aed
            );

          font-size: 15px;

          font-weight: 700;

          cursor: pointer;

          transition: .2s ease;
        }


        .auth-card button.login-button:hover:not(:disabled) {
          transform: translateY(-2px);

          box-shadow:
            0 10px 30px
            rgba(37,99,235,.30);
        }


        .auth-card button.login-button:disabled {
          opacity: .55;

          cursor: not-allowed;

          transform: none;
        }


        /* ================================================
           LOCK BOX
        ================================================ */

        .lock-box {
          display: flex;

          align-items: center;

          gap: 12px;

          margin-bottom: 15px;

          padding: 14px;

          border:
            1px solid rgba(239,68,68,.25);

          border-radius: 10px;

          background:
            rgba(239,68,68,.08);
        }


        .lock-icon {
          width: 38px;
          height: 38px;

          flex: 0 0 38px;

          display: grid;

          place-items: center;

          border-radius: 9px;

          color: #f87171;

          background:
            rgba(239,68,68,.12);

          font-size: 18px;
        }


        .lock-text {
          flex: 1;
        }


        .lock-text strong {
          display: block;

          margin-bottom: 3px;

          color: #fca5a5;

          font-size: 13px;
        }


        .lock-text span {
          color: #94a3b8;

          font-size: 12px;
        }


        .lock-time {
          color: #f87171 !important;

          font-size: 16px !important;

          font-weight: 800;
        }


        /* ================================================
           ATTEMPT INFO
        ================================================ */

        .attempt-info {
          margin-top: -3px;

          margin-bottom: 2px;

          color: #64748b;

          font-size: 11px;

          text-align: right;
        }


        /* ================================================
           REGISTER
        ================================================ */

        .register-text {
          margin-top: 20px !important;

          margin-bottom: 0 !important;

          color: #94a3b8 !important;

          font-size: 13px !important;
        }


        .register-text a {
          color: #60a5fa;

          font-weight: 700;

          text-decoration: none;
        }


        .register-text a:hover {
          color: #93c5fd;

          text-decoration: underline;
        }


        /* ================================================
           TOAST
        ================================================ */

        .login-toast {
          position: fixed;

          top: 25px;

          right: 25px;

          z-index: 99999;

          width:
            min(390px, calc(100vw - 30px));

          display: flex;

          align-items: center;

          gap: 13px;

          padding: 15px 17px;

          border-radius: 14px;

          background:
            rgba(15,23,42,.97);

          box-shadow:
            0 18px 50px
            rgba(0,0,0,.40);

          backdrop-filter:
            blur(15px);

          animation:
            toastSlideIn .35s ease forwards;
        }


        .login-toast.error {
          border:
            1px solid
            rgba(239,68,68,.30);
        }


        .login-toast.success {
          border:
            1px solid
            rgba(34,197,94,.30);
        }


        .toast-icon {
          width: 42px;
          height: 42px;

          flex: 0 0 42px;

          display: grid;

          place-items: center;

          border-radius: 50%;

          font-size: 19px;

          font-weight: 900;
        }


        .login-toast.error
        .toast-icon {
          color: #f87171;

          background:
            rgba(239,68,68,.14);
        }


        .login-toast.success
        .toast-icon {
          color: #4ade80;

          background:
            rgba(34,197,94,.14);
        }


        .toast-content {
          flex: 1;

          min-width: 0;
        }


        .toast-content strong {
          display: block;

          margin-bottom: 3px;

          color: #f8fafc;

          font-size: 14px;
        }


        .toast-content span {
          display: block;

          color: #94a3b8;

          font-size: 12px;

          line-height: 1.5;
        }


        .toast-close {
          width: 28px;
          height: 28px;

          flex: 0 0 28px;

          display: grid;

          place-items: center;

          border: 0;

          border-radius: 7px;

          color: #64748b;

          background: transparent;

          cursor: pointer;

          font-size: 16px;
        }


        .toast-close:hover {
          color: white;

          background:
            rgba(255,255,255,.08);
        }


        @keyframes toastSlideIn {

          from {
            opacity: 0;

            transform:
              translateX(40px)
              scale(.96);
          }

          to {
            opacity: 1;

            transform:
              translateX(0)
              scale(1);
          }

        }


        /* ================================================
           MOBILE
        ================================================ */

        @media (max-width:600px) {

          .auth-page {
            padding: 15px;
          }


          .auth-card {
            padding: 28px 22px;

            border-radius: 17px;
          }


          .auth-card h1 {
            font-size: 27px;
          }


          .login-toast {
            top: 15px;

            right: 15px;

            left: 15px;

            width: auto;
          }

        }

      `}</style>

      {/* ==================================================
          POPUP ERROR
      ================================================== */}

      {error && (
        <div className="login-toast error">
          <div className="toast-icon">✕</div>

          <div className="toast-content">
            <strong>Login Gagal</strong>

            <span>{error}</span>
          </div>

          <button
            type="button"
            className="toast-close"
            onClick={() => setError("")}
          >
            ×
          </button>
        </div>
      )}

      {/* ==================================================
          POPUP SUCCESS
      ================================================== */}

      {success && (
        <div className="login-toast success">
          <div className="toast-icon">✓</div>

          <div className="toast-content">
            <strong>Login Berhasil</strong>

            <span>{success}</span>
          </div>

          <button
            type="button"
            className="toast-close"
            onClick={() => setSuccess("")}
          >
            ×
          </button>
        </div>
      )}

      {/* ==================================================
          LOGIN PAGE
      ================================================== */}

      <div className="auth-page">
        <div className="auth-card">
          <h1>Selamat Datang</h1>

          <p className="auth-subtitle">Login ke akun Colingers kamu</p>

          {/* ==================================================
              LOCK NOTIFICATION
          ================================================== */}

          {isLocked && (
            <div className="lock-box">
              <div className="lock-icon">🔒</div>

              <div className="lock-text">
                <strong>Login dikunci sementara</strong>

                <span>Terlalu banyak percobaan. Coba lagi dalam:</span>
              </div>

              <span className="lock-time">{formatTime(remainingTime)}</span>
            </div>
          )}

          {/* ==================================================
              FORM
          ================================================== */}

          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              disabled={isLocked || loading}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              disabled={isLocked || loading}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {!isLocked && attempts > 0 && (
              <div className="attempt-info">
                Percobaan gagal: {attempts}/{MAX_ATTEMPTS}
              </div>
            )}

            <button
              type="submit"
              className="login-button"
              disabled={loading || isLocked}
            >
              {isLocked
                ? `Tunggu ${formatTime(remainingTime)}`
                : loading
                  ? "Memproses..."
                  : "Login"}
            </button>
          </form>

          {/* ==================================================
              REGISTER
          ================================================== */}

          <p className="register-text">
            Belum punya akun? <Link to="/register">Register</Link>
          </p>
        </div>
      </div>
    </>
  );
}

export default Login;

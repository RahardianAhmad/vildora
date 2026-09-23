import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);

  // ======================================================
  // LOAD USER
  // ======================================================

  useEffect(() => {
    const loadUser = () => {
      const savedUser = localStorage.getItem("user");

      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);

          setUser(parsedUser);
        } catch (error) {
          console.error("User data error:", error);

          localStorage.removeItem("user");
          localStorage.removeItem("token");

          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    loadUser();
  }, [location.pathname]);

  // ======================================================
  // LOGO DESTINATION
  // ======================================================

  const getLogoDestination = () => {
    // Belum login
    if (!user) {
      return "/";
    }

    // ADMIN
    if (user.role === "admin") {
      return "/admin";
    }

    // USER BIASA
    return "/dashboard";
  };

  // ======================================================
  // LOGOUT
  // ======================================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);

    navigate("/");
  };

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <nav className="navbar">
      {/* ==================================================
          LOGO
      ================================================== */}

      <div className="logo">
        <Link to={getLogoDestination()}>Colingers</Link>
      </div>

      {/* ==================================================
          SEARCH
      ================================================== */}

      <div className="search">
        <input type="text" placeholder="Cari video..." />

        <button type="button">🔍</button>
      </div>

      {/* ==================================================
          MENU
      ================================================== */}

      <div className="nav-menu">
        {/* ==================================================
            BELUM LOGIN
        ================================================== */}

        {!user && (
          <>
            <Link to="/">Home</Link>

            <Link to="/login">Login</Link>

            <Link to="/register" className="register-btn">
              Register
            </Link>
          </>
        )}

        {/* ==================================================
            USER BIASA
        ================================================== */}

        {user && user.role !== "admin" && (
          <>
            <Link to="/dashboard">Dashboard</Link>

            <Link to="/upload">Upload</Link>

            <Link to="/my-videos">Video Saya</Link>

            <button type="button" className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </>
        )}

        {/* ==================================================
            ADMIN
        ================================================== */}

        {user && user.role === "admin" && (
          <>
            <Link to="/admin">Dashboard Admin</Link>

            <Link to="/admin/approve">Approve Video</Link>

            <Link to="/upload">Upload Video</Link>

            <Link to="/my-videos">Video Saya</Link>

            <button type="button" className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;

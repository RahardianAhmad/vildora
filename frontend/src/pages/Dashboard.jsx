import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = "https://epidermal-unloader-viscous.ngrok-free.dev";

function Dashboard() {
  const navigate = useNavigate();

  // ======================================================
  // STATE
  // ======================================================

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);

  // ======================================================
  // AMBIL TOKEN
  // ======================================================

  const getToken = () => {
    return localStorage.getItem("token");
  };

  // ======================================================
  // LOAD DASHBOARD
  // ======================================================

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      // ==================================================
      // BELUM LOGIN
      // ==================================================

      if (!token) {
        navigate("/login");
        return;
      }

      // ==================================================
      // USER LOCAL
      // ==================================================

      try {
        const localUser = JSON.parse(localStorage.getItem("user") || "null");

        setUser(localUser);
      } catch (error) {
        console.warn("User local tidak valid.");
      }

      // ==================================================
      // REQUEST DASHBOARD
      // ==================================================

      const response = await fetch(`${API_URL}/api/videos/dashboard`, {
        method: "GET",

        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      console.log("DASHBOARD RESPONSE:", data);

      // ==================================================
      // TOKEN EXPIRED
      // ==================================================

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login");

        return;
      }

      // ==================================================
      // ERROR
      // ==================================================

      if (!response.ok) {
        throw new Error(data.message || "Gagal mengambil dashboard.");
      }

      // ==================================================
      // SET DATA
      // ==================================================

      setVideos(Array.isArray(data.videos) ? data.videos : []);
    } catch (error) {
      console.error("DASHBOARD ERROR:", error);

      setError(error.message || "Gagal mengambil data dashboard.");
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // LOAD
  // ======================================================

  useEffect(() => {
    loadDashboard();
  }, []);

  // ======================================================
  // FORMAT HARGA
  // ======================================================

  const formatPrice = (price) => {
    const value = Number(price || 0);

    if (value <= 0) {
      return "Gratis";
    }

    return `Rp ${value.toLocaleString("id-ID")}`;
  };

  // ======================================================
  // VIDEO SAYA
  // ======================================================

  const myVideos = videos.filter((video) => video.isOwner === true);

  // ======================================================
  // VIDEO ORANG LAIN
  // ======================================================

  const otherVideos = videos.filter((video) => video.isOwner !== true);

  // ======================================================
  // VIDEO APPROVED
  // ======================================================

  const approvedVideos = videos.filter((video) => video.status === "approved");

  // ======================================================
  // TOTAL UPLOAD
  // ======================================================

  const totalUpload = myVideos.length;

  // ======================================================
  // LOADING
  // ======================================================

  if (loading) {
    return (
      <>
        <style>{dashboardStyles}</style>

        <main className="dashboard-page">
          <div className="dashboard-container">
            <div className="empty-state">
              <div className="loading-spinner"></div>

              <h2>Memuat dashboard...</h2>

              <p>Tunggu sebentar.</p>
            </div>
          </div>
        </main>
      </>
    );
  }

  // ======================================================
  // ERROR
  // ======================================================

  if (error) {
    return (
      <>
        <style>{dashboardStyles}</style>

        <main className="dashboard-page">
          <div className="dashboard-container">
            <div className="empty-state error-state">
              <div className="empty-icon">⚠️</div>

              <h2>Gagal mengambil data</h2>

              <p>{error}</p>

              <button
                type="button"
                className="hero-primary"
                onClick={loadDashboard}
              >
                🔄 Coba Lagi
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <>
      <style>{dashboardStyles}</style>

      <main className="dashboard-page">
        <div className="dashboard-container">
          {/* ==================================================
              HEADER
          ================================================== */}

          <section className="dashboard-header">
            <div className="dashboard-welcome">
              <span className="dashboard-label">Colingers DASHBOARD</span>

              <h1>
                Selamat datang,
                <span> {user?.username || "User"}</span> 👋
              </h1>

              <p>Video Viral dan Buat Para Colingers Yang Sagapunks.</p>
            </div>

            <Link to="/upload" className="dashboard-upload-btn">
              <span className="upload-plus">＋</span>
              Upload Video
            </Link>
          </section>

          {/* ==================================================
              STATISTIK
          ================================================== */}

          <section className="dashboard-stats">
            {/* VIDEO SAYA */}

            <div className="dashboard-stat-card">
              <div className="dashboard-stat-icon blue">▶</div>

              <div className="dashboard-stat-content">
                <span>Video Saya</span>

                <strong>{myVideos.length}</strong>

                <small>Video yang kamu upload</small>
              </div>
            </div>

            {/* VIDEO APPROVED */}

            <div className="dashboard-stat-card">
              <div className="dashboard-stat-icon purple">◆</div>

              <div className="dashboard-stat-content">
                <span>Video Tersedia</span>

                <strong>{approvedVideos.length}</strong>

                <small>Video VIRAL Para Colingers</small>
              </div>
            </div>

            {/* TOTAL */}

            <div className="dashboard-stat-card">
              <div className="dashboard-stat-icon cyan">↑</div>

              <div className="dashboard-stat-content">
                <span>Total Upload</span>

                <strong>{totalUpload}</strong>

                <small>Semua video yang kamu upload</small>
              </div>
            </div>
          </section>

          {/* ==================================================
              VIDEO SAYA
          ================================================== */}

          <section className="dashboard-section">
            <div className="dashboard-section-header">
              <div>
                <div className="section-title-row">
                  <div className="section-title-icon blue">▶</div>

                  <div>
                    <h2>Video Saya</h2>

                    <p>Video yang kamu upload</p>
                  </div>
                </div>
              </div>

              {myVideos.length > 0 && (
                <Link to="/my-videos" className="view-all-link">
                  Lihat Semua
                  <span>→</span>
                </Link>
              )}
            </div>

            {myVideos.length === 0 ? (
              <div className="dashboard-empty">
                <div className="dashboard-empty-icon">🎬</div>

                <h3>Belum ada video</h3>

                <p>Kamu belum mengupload video.</p>

                <Link to="/upload" className="dashboard-small-btn">
                  + Upload Video
                </Link>
              </div>
            ) : (
              <div className="dashboard-video-grid">
                {myVideos.map((video) => (
                  <VideoCard key={`my-${video.id}`} video={video} />
                ))}
              </div>
            )}
          </section>

          {/* ==================================================
              VIDEO ORANG LAIN
          ================================================== */}

          <section className="dashboard-section">
            <div className="dashboard-section-header">
              <div>
                <div className="section-title-row">
                  <div className="section-title-icon purple">◆</div>

                  <div>
                    <h2>Video Pengguna Lain</h2>

                    <p>Video approved dari pengguna Colingers lainnya</p>
                  </div>
                </div>
              </div>

              {/* JELAJAHI SEMUA */}

              <Link to="/videos" className="view-all-link">
                Jelajahi Semua
                <span>→</span>
              </Link>
            </div>

            {otherVideos.length === 0 ? (
              <div className="dashboard-empty">
                <div className="dashboard-empty-icon">🎥</div>

                <h3>Belum ada video pengguna lain</h3>

                <p>
                  Saat pengguna lain mengupload video dan admin menyetujuinya,
                  video akan muncul di sini.
                </p>
              </div>
            ) : (
              <div className="dashboard-video-grid">
                {otherVideos.map((video) => (
                  <VideoCard key={`other-${video.id}`} video={video} />
                ))}
              </div>
            )}
          </section>

          {/* ==================================================
              QUICK ACTION
          ================================================== */}

          <section className="dashboard-quick">
            <div className="quick-header">
              <div>
                <span className="quick-label">MENU CEPAT</span>

                <h2>Quick Action</h2>

                <p>Akses fitur Colingers dengan cepat.</p>
              </div>
            </div>

            <div className="dashboard-quick-grid">
              {/* UPLOAD */}

              <Link to="/upload" className="dashboard-quick-item">
                <div className="dashboard-quick-icon">↑</div>

                <div>
                  <strong>Upload Video</strong>

                  <small>Bagikan video baru</small>
                </div>

                <span className="quick-arrow">→</span>
              </Link>

              {/* VIDEO SAYA */}

              <Link to="/my-videos" className="dashboard-quick-item">
                <div className="dashboard-quick-icon purple">▶</div>

                <div>
                  <strong>Video Saya</strong>

                  <small>Kelola video kamu</small>
                </div>

                <span className="quick-arrow">→</span>
              </Link>

              {/* JELAJAHI VIDEO */}

              <Link to="/videos" className="dashboard-quick-item">
                <div className="dashboard-quick-icon cyan">◆</div>

                <div>
                  <strong>Jelajahi Video</strong>

                  <small>Cari video menarik</small>
                </div>

                <span className="quick-arrow">→</span>
              </Link>
            </div>
          </section>

          {/* ==================================================
              INFO
          ================================================== */}

          <section className="dashboard-info">
            <div className="dashboard-info-icon">✓</div>

            <div>
              <h3>Upload video dengan bebas</h3>

              <p>
                Setiap video yang kamu upload akan diperiksa terlebih dahulu
                oleh admin sebelum ditampilkan kepada pengguna lain.
              </p>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

// ======================================================
// VIDEO CARD
// ======================================================

function VideoCard({ video }) {
  const API_URL = "https://epidermal-unloader-viscous.ngrok-free.dev";

  const thumbnail = video.thumbnail
    ? `${API_URL}/uploads/thumbnails/${video.thumbnail}`
    : null;

  const price = Number(video.price || 0);

  return (
    <Link to={`/watch/${video.id}`} className="dashboard-video-card">
      {/* THUMBNAIL */}

      <div className="dashboard-video-thumbnail">
        {thumbnail ? (
          <img src={thumbnail} alt={video.title} loading="lazy" />
        ) : (
          <div className="dashboard-no-thumbnail">
            <div className="no-thumbnail-icon">▶</div>

            <span>COLINGERS</span>
          </div>
        )}

        {/* OVERLAY */}

        <div className="thumbnail-overlay">
          <div className="play-button">▶</div>
        </div>

        {/* STATUS */}

        {video.isOwner && video.status !== "approved" && (
          <span className={`dashboard-status ${video.status}`}>
            {video.status === "pending" ? "Menunggu" : "Ditolak"}
          </span>
        )}

        {/* PRICE */}

        <span className={`dashboard-price ${price > 0 ? "paid" : "free"}`}>
          {price > 0 ? formatVideoPrice(price) : "GRATIS"}
        </span>
      </div>

      {/* INFO */}

      <div className="dashboard-video-info">
        <h3 title={video.title}>{video.title}</h3>

        <p className="video-owner">
          <span className="user-icon">👤</span>

          {video.isOwner
            ? "Video Saya"
            : video.username?.toLowerCase() === "admin"
              ? "Colingers"
              : video.username || "User"}
        </p>

        <div className="video-meta">
          <span>👁 {video.views || 0}</span>

          <span className={`video-status-text ${video.status}`}>
            {video.status === "approved" ? "✓ Approved" : video.status}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ======================================================
// FORMAT HARGA VIDEO CARD
// ======================================================

function formatVideoPrice(price) {
  const value = Number(price || 0);

  if (value <= 0) {
    return "Gratis";
  }

  return `Rp ${value.toLocaleString("id-ID")}`;
}

// ======================================================
// CSS
// ======================================================

const dashboardStyles = `

/* ======================================================
   GLOBAL
====================================================== */

.dashboard-page {
  width: 100%;
  min-height: 100vh;
  padding: 35px 20px 80px;

  background:
    radial-gradient(
      circle at 10% 0%,
      rgba(37, 99, 235, 0.13),
      transparent 30%
    ),
    radial-gradient(
      circle at 90% 80%,
      rgba(124, 58, 237, 0.10),
      transparent 30%
    ),
    #060a14;

  color: #f8fafc;
}

.dashboard-container {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
}

/* ======================================================
   HEADER
====================================================== */

.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 30px;

  padding: 34px;

  margin-bottom: 25px;

  border: 1px solid rgba(255,255,255,0.08);

  border-radius: 24px;

  background:
    linear-gradient(
      135deg,
      rgba(15,23,42,0.97),
      rgba(17,24,39,0.92)
    );

  box-shadow:
    0 20px 60px rgba(0,0,0,0.28);
}

.dashboard-welcome {
  min-width: 0;
}

.dashboard-label {
  display: inline-block;

  margin-bottom: 10px;

  color: #38bdf8;

  font-size: 11px;

  font-weight: 800;

  letter-spacing: 2.5px;
}

.dashboard-header h1 {
  margin: 0;

  color: #f8fafc;

  font-size: clamp(28px, 4vw, 43px);

  line-height: 1.15;

  font-weight: 800;

  letter-spacing: -1px;
}

.dashboard-header h1 span {
  background:
    linear-gradient(
      90deg,
      #38bdf8,
      #818cf8,
      #a78bfa
    );

  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.dashboard-header p {
  max-width: 650px;

  margin: 15px 0 0;

  color: #94a3b8;

  font-size: 15px;

  line-height: 1.7;
}

.dashboard-upload-btn {
  display: inline-flex;

  align-items: center;
  justify-content: center;

  gap: 8px;

  flex-shrink: 0;

  min-width: 165px;

  padding: 14px 20px;

  border-radius: 12px;

  color: #ffffff;

  text-decoration: none;

  font-size: 14px;

  font-weight: 700;

  background:
    linear-gradient(
      135deg,
      #2563eb,
      #7c3aed
    );

  box-shadow:
    0 10px 30px rgba(37,99,235,0.25);

  transition:
    transform .25s ease,
    box-shadow .25s ease;
}

.dashboard-upload-btn:hover {
  transform: translateY(-3px);

  box-shadow:
    0 15px 40px rgba(37,99,235,0.40);
}

.upload-plus {
  font-size: 20px;

  line-height: 1;
}

/* ======================================================
   STATISTICS
====================================================== */

.dashboard-stats {
  display: grid;

  grid-template-columns:
    repeat(3, minmax(0, 1fr));

  gap: 20px;

  margin-bottom: 38px;
}

.dashboard-stat-card {
  display: flex;

  align-items: center;

  gap: 17px;

  min-width: 0;

  padding: 23px;

  border:
    1px solid rgba(255,255,255,0.07);

  border-radius: 18px;

  background:
    rgba(15,23,42,0.78);

  box-shadow:
    0 10px 30px rgba(0,0,0,0.12);

  transition:
    transform .25s ease,
    border-color .25s ease,
    box-shadow .25s ease;
}

.dashboard-stat-card:hover {
  transform: translateY(-4px);

  border-color:
    rgba(56,189,248,0.25);

  box-shadow:
    0 18px 40px rgba(0,0,0,0.22);
}

.dashboard-stat-icon {
  width: 54px;
  height: 54px;

  flex: 0 0 54px;

  display: grid;

  place-items: center;

  border-radius: 15px;

  font-size: 20px;

  font-weight: 900;
}

.dashboard-stat-icon.blue {
  color: #60a5fa;

  background:
    rgba(37,99,235,0.14);
}

.dashboard-stat-icon.purple {
  color: #a78bfa;

  background:
    rgba(124,58,237,0.14);
}

.dashboard-stat-icon.cyan {
  color: #22d3ee;

  background:
    rgba(6,182,212,0.14);
}

.dashboard-stat-content {
  min-width: 0;
}

.dashboard-stat-card span {
  display: block;

  margin-bottom: 4px;

  color: #94a3b8;

  font-size: 13px;
}

.dashboard-stat-card strong {
  display: block;

  color: #f8fafc;

  font-size: 27px;

  line-height: 1.2;
}

.dashboard-stat-card small {
  display: block;

  margin-top: 5px;

  overflow: hidden;

  color: #64748b;

  font-size: 11px;

  white-space: nowrap;

  text-overflow: ellipsis;
}

/* ======================================================
   SECTION
====================================================== */

.dashboard-section {
  margin-top: 38px;
}

.dashboard-section-header {
  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 20px;

  margin-bottom: 20px;
}

.section-title-row {
  display: flex;

  align-items: center;

  gap: 13px;
}

.section-title-icon {
  width: 42px;
  height: 42px;

  flex: 0 0 42px;

  display: grid;

  place-items: center;

  border-radius: 12px;

  font-size: 16px;

  font-weight: 900;
}

.section-title-icon.blue {
  color: #60a5fa;

  background:
    rgba(37,99,235,0.14);
}

.section-title-icon.purple {
  color: #a78bfa;

  background:
    rgba(124,58,237,0.14);
}

.dashboard-section-header h2 {
  margin: 0;

  color: #f8fafc;

  font-size: 22px;

  line-height: 1.3;
}

.dashboard-section-header p {
  margin: 5px 0 0;

  color: #64748b;

  font-size: 13px;
}

.view-all-link {
  display: inline-flex;

  align-items: center;

  gap: 8px;

  color: #38bdf8;

  text-decoration: none;

  font-size: 13px;

  font-weight: 700;

  transition: .2s ease;
}

.view-all-link:hover {
  color: #7dd3fc;
}

.view-all-link span {
  font-size: 17px;

  transition: transform .2s ease;
}

.view-all-link:hover span {
  transform: translateX(4px);
}

/* ======================================================
   VIDEO GRID
====================================================== */

.dashboard-video-grid {
  display: grid;

  grid-template-columns:
    repeat(4, minmax(0, 1fr));

  gap: 20px;
}

/* ======================================================
   VIDEO CARD
====================================================== */

.dashboard-video-card {
  display: block;

  min-width: 0;

  overflow: hidden;

  border:
    1px solid rgba(255,255,255,0.07);

  border-radius: 18px;

  color: inherit;

  text-decoration: none;

  background:
    #0d1424;

  box-shadow:
    0 10px 30px rgba(0,0,0,0.12);

  transition:
    transform .3s ease,
    border-color .3s ease,
    box-shadow .3s ease;
}

.dashboard-video-card:hover {
  transform: translateY(-6px);

  border-color:
    rgba(56,189,248,0.32);

  box-shadow:
    0 20px 45px rgba(0,0,0,0.32);
}

/* ======================================================
   THUMBNAIL
====================================================== */

.dashboard-video-thumbnail {
  position: relative;

  width: 100%;

  aspect-ratio: 16 / 9;

  overflow: hidden;

  background:
    #111827;
}

.dashboard-video-thumbnail img {
  display: block;

  width: 100%;
  height: 100%;

  object-fit: cover;

  transition:
    transform .45s ease;
}

.dashboard-video-card:hover
.dashboard-video-thumbnail img {
  transform: scale(1.06);
}

/* ======================================================
   THUMBNAIL OVERLAY
====================================================== */

.thumbnail-overlay {
  position: absolute;

  inset: 0;

  display: flex;

  align-items: center;
  justify-content: center;

  background:
    linear-gradient(
      to top,
      rgba(0,0,0,0.55),
      transparent 55%
    );

  opacity: 0;

  transition: opacity .3s ease;
}

.dashboard-video-card:hover
.thumbnail-overlay {
  opacity: 1;
}

.play-button {
  width: 48px;
  height: 48px;

  display: grid;

  place-items: center;

  padding-left: 3px;

  border-radius: 50%;

  color: white;

  background:
    rgba(37,99,235,0.90);

  box-shadow:
    0 8px 25px rgba(0,0,0,0.35);

  font-size: 17px;
}

/* ======================================================
   NO THUMBNAIL
====================================================== */

.dashboard-no-thumbnail {
  width: 100%;
  height: 100%;

  display: flex;

  align-items: center;
  justify-content: center;

  flex-direction: column;

  gap: 6px;

  background:
    radial-gradient(
      circle at center,
      #172554,
      #0f172a 65%,
      #080d18
    );
}

.no-thumbnail-icon {
  width: 50px;
  height: 50px;

  display: grid;

  place-items: center;

  padding-left: 3px;

  border-radius: 50%;

  color: #60a5fa;

  background:
    rgba(37,99,235,0.14);

  font-size: 19px;
}

.dashboard-no-thumbnail span {
  color: #64748b;

  font-size: 9px;

  font-weight: 800;

  letter-spacing: 2px;
}

/* ======================================================
   PRICE
====================================================== */

.dashboard-price {
  position: absolute;

  right: 10px;
  bottom: 10px;

  z-index: 3;

  padding: 6px 10px;

  border-radius: 7px;

  color: white;

  background:
    rgba(0,0,0,0.78);

  backdrop-filter:
    blur(8px);

  font-size: 11px;

  font-weight: 800;
}

.dashboard-price.paid {
  color: #fbbf24;

  background:
    rgba(0,0,0,0.82);
}

.dashboard-price.free {
  color: #4ade80;

  background:
    rgba(0,0,0,0.82);
}

/* ======================================================
   STATUS BADGE
====================================================== */

.dashboard-status {
  position: absolute;

  top: 10px;
  left: 10px;

  z-index: 3;

  padding: 6px 10px;

  border-radius: 7px;

  color: white;

  font-size: 10px;

  font-weight: 800;

  text-transform: uppercase;

  backdrop-filter:
    blur(8px);
}

.dashboard-status.pending {
  background:
    rgba(245,158,11,0.92);
}

.dashboard-status.rejected {
  background:
    rgba(239,68,68,0.92);
}

.dashboard-status.approved {
  background:
    rgba(34,197,94,0.92);
}

/* ======================================================
   VIDEO INFO
====================================================== */

.dashboard-video-info {
  padding: 16px;
}

.dashboard-video-info h3 {
  margin: 0 0 9px;

  overflow: hidden;

  color: #f8fafc;

  font-size: 15px;

  font-weight: 700;

  line-height: 1.4;

  display: -webkit-box;

  -webkit-line-clamp: 2;

  -webkit-box-orient: vertical;
}

.video-owner {
  display: flex;

  align-items: center;

  gap: 6px;

  margin: 0 0 13px;

  color: #94a3b8;

  font-size: 12px;
}

.user-icon {
  font-size: 11px;
}

.video-meta {
  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 10px;

  padding-top: 10px;

  border-top:
    1px solid rgba(255,255,255,0.05);

  color: #64748b;

  font-size: 11px;
}

.video-status-text {
  font-weight: 700;

  text-transform: capitalize;
}

.video-status-text.approved {
  color: #4ade80;
}

.video-status-text.pending {
  color: #fbbf24;
}

.video-status-text.rejected {
  color: #f87171;
}

/* ======================================================
   EMPTY
====================================================== */

.dashboard-empty,
.empty-state {
  padding: 55px 25px;

  text-align: center;

  border:
    1px dashed rgba(255,255,255,0.12);

  border-radius: 18px;

  background:
    rgba(15,23,42,0.48);
}

.dashboard-empty-icon,
.empty-icon {
  width: 65px;
  height: 65px;

  display: grid;

  place-items: center;

  margin: 0 auto 17px;

  border-radius: 18px;

  background:
    rgba(37,99,235,0.10);

  font-size: 30px;
}

.dashboard-empty h3,
.empty-state h2 {
  margin: 0 0 8px;

  color: #f8fafc;

  font-size: 19px;
}

.dashboard-empty p,
.empty-state p {
  max-width: 500px;

  margin: 0 auto 20px;

  color: #64748b;

  font-size: 13px;

  line-height: 1.7;
}

.dashboard-small-btn,
.hero-primary {
  display: inline-flex;

  align-items: center;
  justify-content: center;

  padding: 11px 18px;

  border: 0;

  border-radius: 10px;

  color: white;

  background:
    linear-gradient(
      135deg,
      #2563eb,
      #7c3aed
    );

  text-decoration: none;

  font-size: 13px;

  font-weight: 700;

  cursor: pointer;

  transition:
    transform .2s ease,
    box-shadow .2s ease;
}

.dashboard-small-btn:hover,
.hero-primary:hover {
  transform: translateY(-2px);

  box-shadow:
    0 10px 25px rgba(37,99,235,0.30);
}

/* ======================================================
   LOADING
====================================================== */

.loading-spinner {
  width: 42px;
  height: 42px;

  margin: 0 auto 20px;

  border:
    3px solid rgba(255,255,255,0.08);

  border-top-color:
    #38bdf8;

  border-radius: 50%;

  animation:
    dashboard-spin .8s linear infinite;
}

@keyframes dashboard-spin {
  to {
    transform: rotate(360deg);
  }
}

/* ======================================================
   QUICK ACTION
====================================================== */

.dashboard-quick {
  margin-top: 45px;

  padding: 27px;

  border:
    1px solid rgba(255,255,255,0.07);

  border-radius: 20px;

  background:
    rgba(15,23,42,0.72);

  box-shadow:
    0 15px 40px rgba(0,0,0,0.14);
}

.quick-label {
  display: block;

  margin-bottom: 5px;

  color: #38bdf8;

  font-size: 10px;

  font-weight: 800;

  letter-spacing: 2px;
}

.dashboard-quick h2 {
  margin: 0;

  color: #f8fafc;

  font-size: 21px;
}

.dashboard-quick p {
  margin: 5px 0 20px;

  color: #64748b;

  font-size: 13px;
}

.dashboard-quick-grid {
  display: grid;

  grid-template-columns:
    repeat(3, minmax(0, 1fr));

  gap: 14px;
}

.dashboard-quick-item {
  display: flex;

  align-items: center;

  gap: 13px;

  min-width: 0;

  padding: 16px;

  border:
    1px solid rgba(255,255,255,0.06);

  border-radius: 14px;

  color: white;

  text-decoration: none;

  background:
    rgba(2,6,23,0.52);

  transition:
    transform .25s ease,
    border-color .25s ease,
    background .25s ease;
}

.dashboard-quick-item:hover {
  transform: translateY(-3px);

  border-color:
    rgba(56,189,248,0.25);

  background:
    rgba(30,41,59,0.72);
}

.dashboard-quick-item > div:nth-child(2) {
  flex: 1;

  min-width: 0;
}

.dashboard-quick-item strong {
  display: block;

  margin-bottom: 4px;

  color: #f8fafc;

  font-size: 13px;
}

.dashboard-quick-item small {
  display: block;

  overflow: hidden;

  color: #64748b;

  font-size: 11px;

  white-space: nowrap;

  text-overflow: ellipsis;
}

.dashboard-quick-icon {
  width: 43px;
  height: 43px;

  flex: 0 0 43px;

  display: grid;

  place-items: center;

  border-radius: 11px;

  color: #60a5fa;

  background:
    rgba(37,99,235,0.14);

  font-size: 17px;
}

.dashboard-quick-icon.purple {
  color: #a78bfa;

  background:
    rgba(124,58,237,0.14);
}

.dashboard-quick-icon.cyan {
  color: #22d3ee;

  background:
    rgba(6,182,212,0.14);
}

.quick-arrow {
  color: #38bdf8;

  font-size: 17px;

  transition:
    transform .2s ease;
}

.dashboard-quick-item:hover
.quick-arrow {
  transform: translateX(4px);
}

/* ======================================================
   INFO
====================================================== */

.dashboard-info {
  display: flex;

  align-items: center;

  gap: 17px;

  margin-top: 24px;

  padding: 20px;

  border:
    1px solid rgba(56,189,248,0.14);

  border-radius: 16px;

  background:
    rgba(14,116,144,0.07);
}

.dashboard-info-icon {
  width: 43px;
  height: 43px;

  flex: 0 0 43px;

  display: grid;

  place-items: center;

  border-radius: 50%;

  color: #22d3ee;

  background:
    rgba(6,182,212,0.12);

  font-size: 18px;

  font-weight: 900;
}

.dashboard-info h3 {
  margin: 0 0 5px;

  color: #f8fafc;

  font-size: 14px;
}

.dashboard-info p {
  margin: 0;

  color: #64748b;

  font-size: 12px;

  line-height: 1.6;
}

/* ======================================================
   RESPONSIVE TABLET
====================================================== */

@media (max-width: 1150px) {

  .dashboard-video-grid {
    grid-template-columns:
      repeat(3, minmax(0, 1fr));
  }

}

@media (max-width: 900px) {

  .dashboard-header {
    align-items: flex-start;

    flex-direction: column;
  }

  .dashboard-upload-btn {
    width: 100%;
  }

  .dashboard-stats {
    grid-template-columns:
      1fr;
  }

  .dashboard-video-grid {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }

  .dashboard-quick-grid {
    grid-template-columns:
      1fr;
  }

}

/* ======================================================
   RESPONSIVE MOBILE
====================================================== */

@media (max-width: 600px) {

  .dashboard-page {
    padding:
      20px 12px 50px;
  }

  .dashboard-header {
    padding: 23px 20px;

    border-radius: 19px;
  }

  .dashboard-header h1 {
    font-size: 27px;

    letter-spacing: -.5px;
  }

  .dashboard-header p {
    font-size: 13px;
  }

  .dashboard-stats {
    gap: 12px;
  }

  .dashboard-stat-card {
    padding: 18px;
  }

  .dashboard-stat-icon {
    width: 48px;
    height: 48px;

    flex-basis: 48px;
  }

  .dashboard-section {
    margin-top: 30px;
  }

  .dashboard-section-header {
    align-items: flex-start;

    flex-direction: column;

    gap: 10px;
  }

  .dashboard-video-grid {
    grid-template-columns:
      1fr;

    gap: 15px;
  }

  .dashboard-video-card {
    border-radius: 16px;
  }

  .dashboard-quick {
    padding: 20px;

    border-radius: 17px;
  }

  .dashboard-info {
    align-items: flex-start;

    padding: 17px;
  }

}

/* ======================================================
   SMALL MOBILE
====================================================== */

@media (max-width: 380px) {

  .dashboard-page {
    padding-left: 9px;
    padding-right: 9px;
  }

  .dashboard-header {
    padding: 20px 16px;
  }

  .dashboard-header h1 {
    font-size: 24px;
  }

  .dashboard-stat-card strong {
    font-size: 23px;
  }

}

`;

export default Dashboard;

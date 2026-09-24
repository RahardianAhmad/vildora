import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_URL = "https://epidermal-unloader-viscous.ngrok-free.dev";

function Videos() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================================
  // LOAD VIDEO
  // =====================================================

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      setLoading(true);
      setError("");

      // Ambil token dari localStorage
      const token = localStorage.getItem("token");

      console.log("TOKEN VIDEOS:", token);

      // =================================================
      // REQUEST KE BACKEND
      // =================================================

      const response = await fetch(`${API_URL}/api/videos/approved`, {
        method: "GET",

        headers: {
          "Content-Type": "application/json",

          ...(token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {}),
        },
      });

      const data = await response.json();

      console.log("VIDEOS STATUS:", response.status);
      console.log("VIDEOS RESPONSE:", data);

      // =================================================
      // TOKEN EXPIRED
      // =================================================

      if (response.status === 401) {
        setError(
          data.message || "Sesi login sudah berakhir. Silakan login kembali.",
        );

        return;
      }

      // =================================================
      // ERROR BACKEND
      // =================================================

      if (!response.ok) {
        throw new Error(data.message || "Gagal mengambil video.");
      }

      // =================================================
      // DATA VIDEO
      // =================================================

      setVideos(Array.isArray(data.videos) ? data.videos : []);
    } catch (error) {
      console.error("VIDEOS ERROR:", error);

      setError(error.message || "Tidak dapat mengambil data video.");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // FORMAT HARGA
  // =====================================================

  const formatPrice = (price) => {
    const value = Number(price || 0);

    if (value <= 0) {
      return "GRATIS";
    }

    return `Rp ${value.toLocaleString("id-ID")}`;
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <>
        <style>{videosStyles}</style>

        <main className="videos-page">
          <div className="videos-container">
            <div className="videos-loading">
              <div className="loading-spinner"></div>

              <h2>Memuat video...</h2>

              <p>Tunggu sebentar, sedang mengambil video.</p>
            </div>
          </div>
        </main>
      </>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error) {
    return (
      <>
        <style>{videosStyles}</style>

        <main className="videos-page">
          <div className="videos-container">
            <div className="videos-empty">
              <div className="empty-icon">⚠️</div>

              <h2>Gagal mengambil video</h2>

              <p>{error}</p>

              <button
                type="button"
                className="retry-button"
                onClick={loadVideos}
              >
                🔄 Coba Lagi
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <>
      <style>{videosStyles}</style>

      <main className="videos-page">
        <div className="videos-container">
          {/* =================================================
              HEADER
          ================================================= */}

          <section className="videos-header">
            <div>
              <span className="videos-label">Colingers</span>

              <h1>Jelajahi Semua Video</h1>

              <p>
                Temukan berbagai video menarik dari para pengguna Colingers.
              </p>
            </div>

            <div className="video-count">
              <strong>{videos.length}</strong>

              <span>Video</span>
            </div>
          </section>

          {/* =================================================
              VIDEO LIST
          ================================================= */}

          {videos.length === 0 ? (
            <div className="videos-empty">
              <div className="empty-icon">🎬</div>

              <h2>Belum ada video</h2>

              <p>Belum ada video yang disetujui oleh admin.</p>

              <Link to="/" className="back-button">
                ← Kembali ke Home
              </Link>
            </div>
          ) : (
            <div className="videos-grid">
              {videos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  formatPrice={formatPrice}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

// =====================================================
// VIDEO CARD
// =====================================================

function VideoCard({ video, formatPrice }) {
  const thumbnail = video.thumbnail
    ? `${API_URL}/uploads/thumbnails/${video.thumbnail}`
    : null;

  const price = Number(video.price || 0);

  return (
    <Link to={`/watch/${video.id}`} className="video-card">
      {/* =================================================
          THUMBNAIL
      ================================================= */}

      <div className="video-thumbnail">
        {thumbnail ? (
          <img src={thumbnail} alt={video.title} loading="lazy" />
        ) : (
          <div className="no-thumbnail">
            <div className="no-thumbnail-icon">▶</div>

            <span>Colingers</span>
          </div>
        )}

        {/* PLAY OVERLAY */}

        <div className="video-overlay">
          <div className="play-button">▶</div>
        </div>

        {/* PRICE */}

        <span className={`video-price ${price > 0 ? "paid" : "free"}`}>
          {formatPrice(price)}
        </span>
      </div>

      {/* =================================================
          VIDEO INFO
      ================================================= */}

      <div className="video-info">
        <h3 title={video.title}>{video.title}</h3>

        {/* USER */}

        <p className="video-owner">
          <span className="user-icon">👤</span>

          {video.username?.toLowerCase() === "admin"
            ? "Colingers"
            : video.username || "User"}
        </p>

        {/* META */}

        <div className="video-meta">
          <span>👁 {video.views || 0}</span>

          <span className="approved">✓ Approved</span>
        </div>
      </div>
    </Link>
  );
}

// =====================================================
// CSS
// =====================================================

const videosStyles = `

/* =====================================================
   GLOBAL
===================================================== */

.videos-page {
  min-height: 100vh;

  padding:
    40px 20px 80px;

  background:
    radial-gradient(
      circle at 10% 0%,
      rgba(37, 99, 235, 0.15),
      transparent 30%
    ),

    radial-gradient(
      circle at 90% 70%,
      rgba(124, 58, 237, 0.12),
      transparent 30%
    ),

    #060a14;

  color: #f8fafc;
}

.videos-container {
  width: 100%;

  max-width: 1400px;

  margin: 0 auto;
}

/* =====================================================
   HEADER
===================================================== */

.videos-header {
  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 30px;

  margin-bottom: 35px;

  padding: 35px;

  border:
    1px solid rgba(255,255,255,0.08);

  border-radius: 24px;

  background:
    linear-gradient(
      135deg,
      rgba(15,23,42,0.96),
      rgba(17,24,39,0.90)
    );

  box-shadow:
    0 20px 60px
    rgba(0,0,0,0.25);
}

.videos-label {
  display: inline-block;

  margin-bottom: 10px;

  color: #38bdf8;

  font-size: 11px;

  font-weight: 800;

  letter-spacing: 3px;
}

.videos-header h1 {
  margin: 0;

  font-size:
    clamp(28px, 4vw, 42px);

  font-weight: 800;

  background:
    linear-gradient(
      90deg,
      #38bdf8,
      #818cf8,
      #a78bfa
    );

  -webkit-background-clip: text;

  -webkit-text-fill-color:
    transparent;
}

.videos-header p {
  margin:
    12px 0 0;

  color: #94a3b8;

  font-size: 14px;

  line-height: 1.7;
}

.video-count {
  min-width: 110px;

  padding: 18px;

  text-align: center;

  border:
    1px solid
    rgba(56,189,248,0.15);

  border-radius: 16px;

  background:
    rgba(37,99,235,0.08);
}

.video-count strong {
  display: block;

  color: #38bdf8;

  font-size: 28px;
}

.video-count span {
  color: #64748b;

  font-size: 12px;
}

/* =====================================================
   GRID
===================================================== */

.videos-grid {
  display: grid;

  grid-template-columns:
    repeat(4, minmax(0, 1fr));

  gap: 20px;
}

/* =====================================================
   CARD
===================================================== */

.video-card {
  display: block;

  overflow: hidden;

  min-width: 0;

  color: inherit;

  text-decoration: none;

  border:
    1px solid
    rgba(255,255,255,0.07);

  border-radius: 18px;

  background: #0d1424;

  box-shadow:
    0 10px 30px
    rgba(0,0,0,0.15);

  transition:
    transform .3s ease,
    border-color .3s ease,
    box-shadow .3s ease;
}

.video-card:hover {
  transform:
    translateY(-6px);

  border-color:
    rgba(56,189,248,0.35);

  box-shadow:
    0 20px 45px
    rgba(0,0,0,0.35);
}

/* =====================================================
   THUMBNAIL
===================================================== */

.video-thumbnail {
  position: relative;

  width: 100%;

  aspect-ratio:
    16 / 9;

  overflow: hidden;

  background:
    #111827;
}

.video-thumbnail img {
  width: 100%;

  height: 100%;

  display: block;

  object-fit: cover;

  transition:
    transform .45s ease;
}

.video-card:hover
.video-thumbnail img {
  transform:
    scale(1.06);
}

/* =====================================================
   NO THUMBNAIL
===================================================== */

.no-thumbnail {
  width: 100%;

  height: 100%;

  display: flex;

  align-items: center;

  justify-content: center;

  flex-direction: column;

  gap: 8px;

  background:
    radial-gradient(
      circle at center,
      #172554,
      #0f172a 65%,
      #080d18
    );
}

.no-thumbnail-icon {
  width: 52px;

  height: 52px;

  display: grid;

  place-items: center;

  border-radius: 50%;

  color: #60a5fa;

  background:
    rgba(37,99,235,0.15);

  font-size: 20px;
}

.no-thumbnail span {
  color: #64748b;

  font-size: 9px;

  font-weight: 800;

  letter-spacing: 3px;
}

/* =====================================================
   OVERLAY
===================================================== */

.video-overlay {
  position: absolute;

  inset: 0;

  display: flex;

  align-items: center;

  justify-content: center;

  background:
    linear-gradient(
      to top,
      rgba(0,0,0,.55),
      transparent 60%
    );

  opacity: 0;

  transition:
    opacity .3s ease;
}

.video-card:hover
.video-overlay {
  opacity: 1;
}

.play-button {
  width: 52px;

  height: 52px;

  display: grid;

  place-items: center;

  padding-left: 3px;

  border-radius: 50%;

  color: white;

  background:
    rgba(37,99,235,.92);

  box-shadow:
    0 10px 30px
    rgba(0,0,0,.4);

  font-size: 18px;
}

/* =====================================================
   PRICE
===================================================== */

.video-price {
  position: absolute;

  right: 10px;

  bottom: 10px;

  z-index: 5;

  padding:
    6px 10px;

  border-radius: 7px;

  color: white;

  background:
    rgba(0,0,0,.8);

  backdrop-filter:
    blur(8px);

  font-size: 11px;

  font-weight: 800;
}

.video-price.free {
  color: #4ade80;
}

.video-price.paid {
  color: #fbbf24;
}

/* =====================================================
   INFO
===================================================== */

.video-info {
  padding: 16px;
}

.video-info h3 {
  margin:
    0 0 10px;

  overflow: hidden;

  color: #f8fafc;

  font-size: 15px;

  line-height: 1.4;

  display: -webkit-box;

  -webkit-line-clamp: 2;

  -webkit-box-orient: vertical;
}

.video-owner {
  display: flex;

  align-items: center;

  gap: 6px;

  margin:
    0 0 13px;

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
    1px solid
    rgba(255,255,255,.05);

  color: #64748b;

  font-size: 11px;
}

.approved {
  color: #4ade80;

  font-weight: 700;
}

/* =====================================================
   EMPTY / ERROR
===================================================== */

.videos-empty,
.videos-loading {
  padding:
    70px 25px;

  text-align: center;

  border:
    1px dashed
    rgba(255,255,255,.12);

  border-radius: 20px;

  background:
    rgba(15,23,42,.5);
}

.empty-icon {
  width: 65px;

  height: 65px;

  display: grid;

  place-items: center;

  margin:
    0 auto 18px;

  border-radius: 18px;

  background:
    rgba(37,99,235,.1);

  font-size: 30px;
}

.videos-empty h2,
.videos-loading h2 {
  margin:
    0 0 10px;

  color: #f8fafc;

  font-size: 20px;
}

.videos-empty p,
.videos-loading p {
  margin:
    0 auto 20px;

  color: #64748b;

  font-size: 13px;
}

.back-button,
.retry-button {
  display: inline-flex;

  align-items: center;

  justify-content: center;

  padding:
    11px 18px;

  border: 0;

  border-radius: 10px;

  color: white;

  text-decoration: none;

  background:
    linear-gradient(
      135deg,
      #2563eb,
      #7c3aed
    );

  font-size: 13px;

  font-weight: 700;

  cursor: pointer;

  transition:
    transform .2s ease,
    box-shadow .2s ease;
}

.back-button:hover,
.retry-button:hover {
  transform:
    translateY(-2px);

  box-shadow:
    0 10px 25px
    rgba(37,99,235,.3);
}

/* =====================================================
   LOADING
===================================================== */

.loading-spinner {
  width: 42px;

  height: 42px;

  margin:
    0 auto 20px;

  border:
    3px solid
    rgba(255,255,255,.08);

  border-top-color:
    #38bdf8;

  border-radius: 50%;

  animation:
    videos-spin .8s linear infinite;
}

@keyframes videos-spin {
  to {
    transform:
      rotate(360deg);
  }
}

/* =====================================================
   RESPONSIVE
===================================================== */

@media (max-width: 1150px) {

  .videos-grid {
    grid-template-columns:
      repeat(3, minmax(0, 1fr));
  }

}

@media (max-width: 900px) {

  .videos-header {
    align-items:
      flex-start;

    flex-direction:
      column;
  }

  .video-count {
    width: 100%;
  }

  .videos-grid {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }

}

@media (max-width: 600px) {

  .videos-page {
    padding:
      20px 12px 50px;
  }

  .videos-header {
    padding:
      24px 20px;

    border-radius:
      18px;
  }

  .videos-header h1 {
    font-size:
      28px;
  }

  .videos-grid {
    grid-template-columns:
      1fr;

    gap: 15px;
  }

}

`;

export default Videos;

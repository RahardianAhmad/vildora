import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function Home() {
  const [videos, setVideos] = useState([]);

  const [loading, setLoading] = useState(true);

  /* =====================================================
     LOAD PUBLIC VIDEOS
  ===================================================== */

  const loadVideos = async () => {
    try {
      const response = await fetch(
        "https://epidermal-unloader-viscous.ngrok-free.dev/api/videos/public",
      );

      const data = await response.json();

      if (response.ok) {
        setVideos(data.videos || []);
      } else {
        console.error(data.message || "Gagal mengambil video");
      }
    } catch (error) {
      console.error("Gagal mengambil video:", error);
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     LOAD SAAT HALAMAN DIBUKA
  ===================================================== */

  useEffect(() => {
    loadVideos();
  }, []);

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="home-page">
      {/* =================================================
          HERO
      ================================================= */}

      <section className="hero">
        <div className="hero-content">
          <span>
            VIDEO PLATFORM <strong>BOKEP</strong>
          </span>

          <h1>
            Temukan Video
            <br />
            Favoritmu
          </h1>

          <p>Upload, temukan, dan nikmati berbagai video Viral Di Colingers.</p>

          <div className="hero-buttons">
            <Link to="/register" className="hero-primary">
              Mulai Sekarang
            </Link>

            <Link to="/login" className="hero-secondary">
              Login
            </Link>
          </div>
        </div>
      </section>

      {/* =================================================
          VIDEO SECTION
      ================================================= */}

      <section className="video-section">
        {/* HEADER */}

        <div className="section-header">
          <div>
            <span>EXPLORE</span>

            <h2>Video Terbaru</h2>
          </div>
        </div>

        {/* =================================================
            LOADING
        ================================================= */}

        {loading && (
          <div className="empty-state">
            <div className="empty-icon">🎬</div>

            <h2>Memuat video...</h2>

            <p>Tunggu sebentar.</p>
          </div>
        )}

        {/* =================================================
            EMPTY
        ================================================= */}

        {!loading && videos.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🎬</div>

            <h2>Belum ada video</h2>

            <p>Video yang sudah diapprove akan muncul di sini.</p>
          </div>
        )}

        {/* =================================================
            VIDEO GRID
        ================================================= */}

        {!loading && videos.length > 0 && (
          <div className="video-grid">
            {videos.map((video) => (
              <Link
                key={video.id}
                to={`/watch/${video.id}`}
                className="video-card"
              >
                {/* THUMBNAIL */}

                <div className="video-thumbnail">
                  {video.thumbnail ? (
                    <img
                      src={`https://epidermal-unloader-viscous.ngrok-free.dev/uploads/thumbnails/${video.thumbnail}`}
                      alt={video.title}
                    />
                  ) : (
                    <div className="thumbnail-placeholder">🎬</div>
                  )}

                  {/* PLAY BUTTON */}

                  <div className="play-overlay">▶</div>
                </div>

                {/* VIDEO CONTENT */}

                <div className="video-card-content">
                  <h3>{video.title}</h3>

                  <p>{video.username || "User"}</p>

                  <div className="video-price">
                    {Number(video.price) === 0
                      ? "Gratis"
                      : `Rp ${Number(video.price).toLocaleString("id-ID")}`}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Home;

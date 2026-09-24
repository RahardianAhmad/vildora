import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = "https://epidermal-unloader-viscous.ngrok-free.dev";

function MyVideos() {
  const navigate = useNavigate();

  const [videos, setVideos] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [deleteLoading, setDeleteLoading] = useState(null);

  // ======================================================
  // USER
  // ======================================================

  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch (error) {
    console.error("User data error:", error);
  }

  // ======================================================
  // TOKEN
  // ======================================================

  const getToken = () => {
    return localStorage.getItem("token");
  };

  // ======================================================
  // LOAD VIDEO
  // ======================================================

  const loadVideos = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      // ================================================
      // CEK LOGIN
      // ================================================

      if (!token) {
        navigate("/login");
        return;
      }

      // ================================================
      // REQUEST
      // ================================================

      const response = await fetch(`${API_URL}/api/videos/my`, {
        method: "GET",

        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      console.log("MY VIDEOS RESPONSE:", data);

      // ================================================
      // TOKEN EXPIRED
      // ================================================

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login");

        return;
      }

      // ================================================
      // ERROR
      // ================================================

      if (!response.ok) {
        throw new Error(data.message || "Gagal mengambil video.");
      }

      // ================================================
      // SET VIDEO
      // ================================================

      setVideos(Array.isArray(data.videos) ? data.videos : []);
    } catch (error) {
      console.error("LOAD MY VIDEOS ERROR:", error);

      setError(error.message || "Tidak dapat terhubung ke server.");
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // LOAD PERTAMA KALI
  // ======================================================

  useEffect(() => {
    loadVideos();
  }, []);

  // ======================================================
  // DELETE VIDEO
  // ======================================================

  const handleDelete = async (videoId) => {
    // ================================================
    // CEK ID
    // ================================================

    if (!videoId) {
      alert("ID video tidak valid.");
      return;
    }

    // ================================================
    // KONFIRMASI
    // ================================================

    const confirmDelete = window.confirm(
      "Apakah kamu yakin ingin menghapus video ini?\n\n" +
        "Video dan thumbnail akan dihapus secara permanen.",
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setDeleteLoading(videoId);

      const token = getToken();

      // ================================================
      // CEK LOGIN
      // ================================================

      if (!token) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login");

        return;
      }

      // ================================================
      // DELETE REQUEST
      // ================================================

      const response = await fetch(`${API_URL}/api/videos/${videoId}`, {
        method: "DELETE",

        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      console.log("DELETE VIDEO RESPONSE:", data);

      // ================================================
      // TOKEN EXPIRED
      // ================================================

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login");

        return;
      }

      // ================================================
      // DELETE ERROR
      // ================================================

      if (!response.ok) {
        throw new Error(data.message || "Gagal menghapus video.");
      }

      // ================================================
      // BERHASIL
      // ================================================

      alert(data.message || "Video berhasil dihapus.");

      // ================================================
      // HAPUS DARI STATE
      // ================================================

      setVideos((currentVideos) =>
        currentVideos.filter((video) => Number(video.id) !== Number(videoId)),
      );
    } catch (error) {
      console.error("DELETE VIDEO ERROR:", error);

      alert(error.message || "Terjadi kesalahan saat menghapus video.");
    } finally {
      setDeleteLoading(null);
    }
  };

  // ======================================================
  // STATUS CLASS
  // ======================================================

  const getStatusClass = (status) => {
    if (status === "approved") {
      return "status-approved";
    }

    if (status === "rejected") {
      return "status-rejected";
    }

    return "status-pending";
  };

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
  // LOADING
  // ======================================================

  if (loading) {
    return (
      <div className="my-videos-page">
        <div className="my-videos-container">
          <div className="empty-state">
            <div className="empty-icon">🎬</div>

            <h2>Memuat video...</h2>

            <p>Tunggu sebentar.</p>
          </div>
        </div>
      </div>
    );
  }

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <div className="my-videos-page">
      <div className="my-videos-container">
        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="my-videos-header">
          <div>
            <span>VIDEO SAYA</span>

            <h1>Koleksi Video Saya</h1>

            <p>Kelola dan lihat status video yang telah kamu upload.</p>
          </div>

          <Link to="/upload" className="dashboard-upload-btn">
            + Upload Video
          </Link>
        </div>

        {/* ==================================================
            ADMIN LINKS
        ================================================== */}

        {user?.role === "admin" && (
          <div className="admin-back-links">
            <Link to="/admin">Dashboard Admin</Link>

            <Link to="/admin/approve">Approve Video</Link>
          </div>
        )}

        {/* ==================================================
            ERROR
        ================================================== */}

        {error && <div className="error-message">{error}</div>}

        {/* ==================================================
            EMPTY
        ================================================== */}

        {!error && videos.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🎬</div>

            <h2>Belum ada video</h2>

            <p>Kamu belum mengupload video.</p>

            <Link to="/upload" className="empty-button">
              Upload Video
            </Link>
          </div>
        )}

        {/* ==================================================
            VIDEO GRID
        ================================================== */}

        {!error && videos.length > 0 && (
          <div className="my-videos-grid">
            {videos.map((video) => (
              <div className="my-video-card" key={video.id}>
                {/* ======================================
                      THUMBNAIL
                  ====================================== */}

                {video.thumbnail ? (
                  <img
                    src={`${API_URL}/uploads/thumbnails/${video.thumbnail}`}
                    alt={video.title}
                  />
                ) : (
                  <div className="video-placeholder">🎬</div>
                )}

                {/* ======================================
                      CONTENT
                  ====================================== */}

                <div className="my-video-content">
                  <h3>{video.title}</h3>

                  <p>{video.description || "Tidak ada deskripsi."}</p>

                  {/* ==================================
                        META
                    ================================== */}

                  <div className="video-meta">
                    <span>{formatPrice(video.price)}</span>

                    <span className={getStatusClass(video.status)}>
                      {video.status}
                    </span>
                  </div>

                  {/* ==================================
                        REJECTION
                    ================================== */}

                  {video.status === "rejected" && video.rejection_reason && (
                    <div className="rejection-reason">
                      <strong>Alasan ditolak:</strong>

                      <p>{video.rejection_reason}</p>
                    </div>
                  )}

                  {/* ==================================
                        ACTION
                    ================================== */}

                  <div className="video-actions">
                    <Link to={`/watch/${video.id}`} className="watch-video-btn">
                      ▶ Tonton
                    </Link>

                    <button
                      type="button"
                      className="delete-video-btn"
                      disabled={deleteLoading === video.id}
                      onClick={() => handleDelete(video.id)}
                    >
                      {deleteLoading === video.id ? "Menghapus..." : "🗑 Hapus"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ==================================================
          STYLE
      ================================================== */}

      <style>{`

        .video-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 16px;
        }

        .watch-video-btn {
          flex: 1;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 10px 14px;

          border-radius: 8px;

          background: #2563eb;

          color: white;

          text-decoration: none;

          font-size: 13px;

          font-weight: 700;

          transition: all 0.2s ease;
        }

        .watch-video-btn:hover {
          background: #3b82f6;

          transform: translateY(-1px);
        }

        .delete-video-btn {
          flex: 1;

          border: none;

          outline: none;

          padding: 10px 14px;

          border-radius: 8px;

          background: rgba(
            239,
            68,
            68,
            0.15
          );

          color: #ff6b6b;

          font-size: 13px;

          font-weight: 700;

          cursor: pointer;

          transition: all 0.2s ease;
        }

        .delete-video-btn:hover {
          background: #ef4444;

          color: white;

          transform: translateY(-1px);
        }

        .delete-video-btn:disabled {
          opacity: 0.6;

          cursor: not-allowed;

          transform: none;
        }

        .error-message {
          margin: 20px 0;

          padding: 14px 18px;

          border-radius: 10px;

          background: rgba(
            239,
            68,
            68,
            0.12
          );

          border: 1px solid rgba(
            239,
            68,
            68,
            0.25
          );

          color: #ff7b7b;
        }

        .video-placeholder {
          width: 100%;

          aspect-ratio: 16 / 9;

          display: flex;

          align-items: center;

          justify-content: center;

          background: #17233a;

          font-size: 42px;
        }

      `}</style>
    </div>
  );
}

export default MyVideos;

import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

function AdminApprove() {
  const token = localStorage.getItem("token");

  const [videos, setVideos] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const loadPendingVideos = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        "https://epidermal-unloader-viscous.ngrok-free.dev/api/videos/admin/pending",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Gagal mengambil video.");

        return;
      }

      setVideos(data.videos || []);
    } catch (error) {
      console.error(error);

      setError("Tidak dapat terhubung ke server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingVideos();
  }, []);

  const approveVideo = async (id) => {
    const yakin = window.confirm("Approve video ini?");

    if (!yakin) return;

    try {
      const response = await fetch(
        `https://epidermal-unloader-viscous.ngrok-free.dev/api/videos/admin/${id}/approve`,
        {
          method: "PUT",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Gagal approve.");

        return;
      }

      alert("Video berhasil di-approve.");

      loadPendingVideos();
    } catch (error) {
      console.error(error);

      alert("Tidak dapat terhubung ke server.");
    }
  };

  const rejectVideo = async (id) => {
    const reason = window.prompt("Masukkan alasan penolakan:");

    if (!reason) return;

    try {
      const response = await fetch(
        `https://epidermal-unloader-viscous.ngrok-free.dev/api/videos/admin/${id}/reject`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",

            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            reason,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Gagal reject.");

        return;
      }

      alert("Video berhasil ditolak.");

      loadPendingVideos();
    } catch (error) {
      console.error(error);

      alert("Tidak dapat terhubung ke server.");
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <span className="admin-label">MODERATION</span>

            <h1>Approve Video</h1>

            <p>Periksa video user sebelum dipublikasikan.</p>
          </div>
        </div>

        <div className="admin-nav">
          <Link to="/admin">Dashboard</Link>

          <Link to="/admin/approve" className="active">
            Approve Video
          </Link>

          <Link to="/upload">Upload Video</Link>

          <Link to="/my-videos">Video Saya</Link>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading && <div className="admin-empty">Memuat video...</div>}

        {!loading && videos.length === 0 && (
          <div className="admin-empty">
            <div className="admin-empty-icon">✓</div>

            <h2>Tidak ada video pending</h2>

            <p>Semua video user sudah diproses.</p>

            <Link to="/upload" className="admin-primary-btn">
              Upload Video Admin
            </Link>
          </div>
        )}

        <div className="pending-video-list">
          {videos.map((video) => (
            <div className="pending-video-card" key={video.id}>
              <div className="pending-thumbnail">
                {video.thumbnail ? (
                  <img
                    src={`https://epidermal-unloader-viscous.ngrok-free.dev/uploads/thumbnails/${video.thumbnail}`}
                    alt={video.title}
                  />
                ) : (
                  <div>🎬</div>
                )}
              </div>

              <div className="pending-info">
                <span className="pending-label">PENDING</span>

                <h2>{video.title}</h2>

                <p>{video.description}</p>

                <div className="pending-meta">
                  <span>👤 {video.username}</span>

                  <span>✉️ {video.email}</span>

                  <span>
                    💰 Rp {Number(video.price).toLocaleString("id-ID")}
                  </span>
                </div>

                <div className="pending-actions">
                  <button
                    className="approve-btn"
                    onClick={() => approveVideo(video.id)}
                  >
                    ✓ Approve
                  </button>

                  <button
                    className="reject-btn"
                    onClick={() => rejectVideo(video.id)}
                  >
                    ✕ Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminApprove;

import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

function AdminDashboard() {
  const token = localStorage.getItem("token");

  const [stats, setStats] = useState({
    totalVideos: 0,
    pendingVideos: 0,
    approvedVideos: 0,
    rejectedVideos: 0,
    totalUsers: 0,
  });

  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      const response = await fetch(
        "http://localhost:3000/api/videos/admin/stats",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (response.ok) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Stats error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <span className="admin-label">ADMIN PANEL</span>

            <h1>Dashboard Admin</h1>

            <p>Kelola video, approval, dan pengguna Colingers.</p>
          </div>
        </div>

        <div className="admin-nav">
          <Link to="/admin" className="active">
            Dashboard
          </Link>

          <Link to="/admin/approve">Approve Video</Link>

          <Link to="/upload">Upload Video</Link>

          <Link to="/my-videos">Video Saya</Link>
        </div>

        <div className="admin-stats">
          <div className="admin-stat-card">
            <div className="admin-stat-icon">🎬</div>

            <div>
              <span>Total Video</span>

              <strong>{loading ? "..." : stats.totalVideos}</strong>
            </div>
          </div>

          <div className="admin-stat-card pending">
            <div className="admin-stat-icon">⏳</div>

            <div>
              <span>Pending</span>

              <strong>{loading ? "..." : stats.pendingVideos}</strong>
            </div>
          </div>

          <div className="admin-stat-card approved">
            <div className="admin-stat-icon">✓</div>

            <div>
              <span>Approved</span>

              <strong>{loading ? "..." : stats.approvedVideos}</strong>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon">👥</div>

            <div>
              <span>Total User</span>

              <strong>{loading ? "..." : stats.totalUsers}</strong>
            </div>
          </div>
        </div>

        <div className="admin-content-grid">
          <div className="admin-panel">
            <div className="panel-header">
              <div>
                <span>MODERATION</span>

                <h2>Video Menunggu Approval</h2>
              </div>

              <Link to="/admin/approve">Lihat Semua →</Link>
            </div>

            <div className="admin-empty">
              {stats.pendingVideos > 0 ? (
                <>
                  <div className="admin-empty-icon">⏳</div>

                  <h3>Ada {stats.pendingVideos} video menunggu approval</h3>

                  <p>Periksa video sebelum dipublikasikan.</p>

                  <Link to="/admin/approve" className="admin-primary-btn">
                    Periksa Video
                  </Link>
                </>
              ) : (
                <>
                  <div className="admin-empty-icon">✓</div>

                  <h3>Tidak ada video pending</h3>

                  <p>Semua video sudah diproses.</p>
                </>
              )}
            </div>
          </div>

          <div className="admin-panel">
            <div className="panel-header">
              <div>
                <span>QUICK ACTION</span>

                <h2>Menu Admin</h2>
              </div>
            </div>

            <div className="admin-actions">
              <Link to="/admin/approve" className="admin-action">
                <span>🛡️</span>

                <div>
                  <strong>Approve Video</strong>

                  <small>Review video user</small>
                </div>
              </Link>

              <Link to="/upload" className="admin-action">
                <span>⬆️</span>

                <div>
                  <strong>Upload Video</strong>

                  <small>Upload tanpa approval</small>
                </div>
              </Link>

              <Link to="/my-videos" className="admin-action">
                <span>🎬</span>

                <div>
                  <strong>Video Saya</strong>

                  <small>Lihat video admin</small>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;

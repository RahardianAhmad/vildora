import { useEffect, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";

const API_URL = "http://localhost:3000";

function Watch() {
  const { id } = useParams();
  const navigate = useNavigate();

  // =====================================================
  // VIDEO REF
  // =====================================================

  const videoRef = useRef(null);

  // Lock preview setelah 5 detik
  const previewLockedRef = useRef(false);

  // Mencegah event seeking berulang
  const forcePositionRef = useRef(false);

  // =====================================================
  // STATE VIDEO
  // =====================================================

  const [video, setVideo] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // =====================================================
  // STATE PURCHASE
  // =====================================================

  const [purchased, setPurchased] = useState(false);

  const [checkingPurchase, setCheckingPurchase] = useState(false);

  const [paymentLoading, setPaymentLoading] = useState(false);

  // Preview sudah selesai
  const [previewEnded, setPreviewEnded] = useState(false);

  // =====================================================
  // TOKEN
  // =====================================================

  const getToken = () => {
    return localStorage.getItem("token");
  };

  // =====================================================
  // LOAD VIDEO
  // =====================================================

  useEffect(() => {
    const loadVideo = async () => {
      try {
        setLoading(true);
        setError("");

        const token = getToken();

        console.log("=================================");
        console.log("LOAD VIDEO");
        console.log("VIDEO ID:", id);
        console.log("=================================");

        const headers = {};

        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}/api/videos/${id}`, {
          method: "GET",
          headers,
        });

        const data = await response.json();

        console.log("VIDEO RESPONSE:", data);

        // =================================================
        // BELUM LOGIN
        // =================================================

        if (response.status === 401) {
          setError("Kamu harus login terlebih dahulu untuk menonton video.");

          return;
        }

        // =================================================
        // VIDEO TIDAK DITEMUKAN
        // =================================================

        if (response.status === 404) {
          setError(
            data.message || "Video tidak ditemukan atau belum diapprove.",
          );

          return;
        }

        // =================================================
        // ERROR LAIN
        // =================================================

        if (!response.ok) {
          throw new Error(data.message || "Gagal mengambil video.");
        }

        // =================================================
        // SET VIDEO
        // =================================================

        setVideo(data.video);

        // Reset preview
        previewLockedRef.current = false;
        forcePositionRef.current = false;

        setPreviewEnded(false);

        setPurchased(false);
      } catch (err) {
        console.error("GET VIDEO ERROR:", err);

        setError(err.message || "Gagal mengambil video.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadVideo();
    }
  }, [id]);

  // =====================================================
  // CHECK PURCHASE SAAT HALAMAN DIBUKA
  // =====================================================

  useEffect(() => {
    if (!id) {
      return;
    }

    checkPurchase();
  }, [id]);

  // =====================================================
  // CHECK PURCHASE
  // =====================================================

  const checkPurchase = async () => {
    const token = getToken();

    if (!token) {
      setPurchased(false);

      return false;
    }

    try {
      setCheckingPurchase(true);

      const response = await fetch(`${API_URL}/api/payments/check/${id}`, {
        method: "GET",

        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      console.log("STATUS PURCHASE:", data);

      if (!response.ok) {
        console.warn("Gagal mengecek purchase:", data.message);

        return false;
      }

      // =================================================
      // SUDAH DIBELI
      // =================================================

      if (data.purchased === true) {
        console.log("VIDEO SUDAH DIBELI");

        previewLockedRef.current = false;

        forcePositionRef.current = false;

        setPurchased(true);

        setPreviewEnded(false);

        return true;
      }

      // =================================================
      // BELUM DIBELI
      // =================================================

      setPurchased(false);

      return false;
    } catch (err) {
      console.error("CHECK PURCHASE ERROR:", err);

      return false;
    } finally {
      setCheckingPurchase(false);
    }
  };

  // =====================================================
  // HANDLE TIME UPDATE
  // =====================================================

  const handleTimeUpdate = (event) => {
    const player = event.currentTarget;

    if (!video) {
      return;
    }

    // =================================================
    // OWNER
    // =================================================

    // Pemilik video boleh menonton full
    if (video.isOwner) {
      return;
    }

    // =================================================
    // HARGA
    // =================================================

    const price = Number(video.price || 0);

    // =================================================
    // VIDEO GRATIS
    // =================================================

    if (price <= 0) {
      return;
    }

    // =================================================
    // SUDAH DIBELI
    // =================================================

    if (purchased) {
      return;
    }

    // =================================================
    // PREVIEW 5 DETIK
    // =================================================

    if (!previewLockedRef.current && player.currentTime >= 5) {
      console.log("=================================");

      console.log("PREVIEW 5 DETIK SELESAI");

      console.log("VIDEO DIKUNCI");

      console.log("=================================");

      // Aktifkan lock
      previewLockedRef.current = true;

      // Pause
      player.pause();

      // Kembali tepat ke 5 detik
      forcePositionRef.current = true;

      player.currentTime = 5;

      setTimeout(() => {
        forcePositionRef.current = false;
      }, 100);

      // Tampilkan overlay
      setPreviewEnded(true);
    }

    // =================================================
    // JIKA SUDAH LOCK
    // =================================================

    if (previewLockedRef.current) {
      if (player.currentTime !== 5) {
        forcePositionRef.current = true;

        player.pause();

        player.currentTime = 5;

        setTimeout(() => {
          forcePositionRef.current = false;
        }, 100);
      }
    }
  };

  // =====================================================
  // HANDLE SEEKING
  // =====================================================

  const handleSeeking = (event) => {
    const player = event.currentTarget;

    if (!video) {
      return;
    }

    // =================================================
    // OWNER
    // =================================================

    if (video.isOwner) {
      return;
    }

    // =================================================
    // HARGA
    // =================================================

    const price = Number(video.price || 0);

    // =================================================
    // GRATIS
    // =================================================

    if (price <= 0) {
      return;
    }

    // =================================================
    // SUDAH BELI
    // =================================================

    if (purchased) {
      return;
    }

    // =================================================
    // SUDAH LOCK
    // =================================================

    if (previewLockedRef.current) {
      console.log("SEEK DITOLAK - VIDEO TERKUNCI");

      forcePositionRef.current = true;

      player.pause();

      if (player.currentTime !== 5) {
        player.currentTime = 5;
      }

      setTimeout(() => {
        forcePositionRef.current = false;
      }, 100);

      return;
    }

    // =================================================
    // BELUM LOCK
    // =================================================

    if (player.currentTime > 5) {
      console.log("USER MENCOBA MELEWATI 5 DETIK");

      forcePositionRef.current = true;

      player.currentTime = 5;

      setTimeout(() => {
        forcePositionRef.current = false;
      }, 100);
    }
  };

  // =====================================================
  // HANDLE PLAY
  // =====================================================

  const handlePlay = (event) => {
    const player = event.currentTarget;

    if (!video) {
      return;
    }

    // =================================================
    // OWNER
    // =================================================

    if (video.isOwner) {
      return;
    }

    // =================================================
    // HARGA
    // =================================================

    const price = Number(video.price || 0);

    // =================================================
    // GRATIS
    // =================================================

    if (price <= 0) {
      return;
    }

    // =================================================
    // SUDAH BELI
    // =================================================

    if (purchased) {
      return;
    }

    // =================================================
    // TERKUNCI
    // =================================================

    if (previewLockedRef.current) {
      console.log("PLAY DITOLAK - VIDEO TERKUNCI");

      player.pause();

      forcePositionRef.current = true;

      player.currentTime = 5;

      setTimeout(() => {
        forcePositionRef.current = false;
      }, 100);
    }
  };

  // =====================================================
  // HANDLE LOADED METADATA
  // =====================================================

  const handleLoadedMetadata = () => {
    const player = videoRef.current;

    if (!player || !video) {
      return;
    }

    // Owner full
    if (video.isOwner) {
      return;
    }

    const price = Number(video.price || 0);

    // Gratis full
    if (price <= 0) {
      return;
    }

    // Sudah beli
    if (purchased) {
      return;
    }

    // Preview mulai dari 0
    if (!previewLockedRef.current) {
      player.currentTime = 0;
    }
  };

  // =====================================================
  // BUAT PEMBAYARAN
  // =====================================================

  const handleBuyVideo = async () => {
    try {
      // =================================================
      // LOGIN
      // =================================================

      const token = getToken();

      if (!token) {
        alert("Silakan login terlebih dahulu untuk membeli video.");

        navigate("/login");

        return;
      }

      // =================================================
      // VIDEO
      // =================================================

      if (!video) {
        alert("Data video belum tersedia.");

        return;
      }

      // =================================================
      // OWNER
      // =================================================

      if (video.isOwner) {
        alert("Kamu adalah pemilik video ini.");

        return;
      }

      // =================================================
      // HARGA
      // =================================================

      const price = Number(video.price || 0);

      if (price <= 0) {
        alert("Video ini gratis.");

        return;
      }

      // =================================================
      // CEK PURCHASE
      // =================================================

      const alreadyPurchased = await checkPurchase();

      if (alreadyPurchased) {
        alert("Video ini sudah kamu beli.");

        return;
      }

      // =================================================
      // PAYMENT LOADING
      // =================================================

      setPaymentLoading(true);

      console.log("=================================");

      console.log("MEMBUAT PEMBAYARAN");

      console.log("VIDEO ID:", video.id);

      console.log("JUDUL:", video.title);

      console.log("HARGA:", price);

      console.log("=================================");

      // =================================================
      // CREATE PAYMENT
      // =================================================

      const response = await fetch(`${API_URL}/api/payments/create`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          video_id: video.id,
        }),
      });

      const data = await response.json();

      console.log("PAYMENT RESPONSE:", data);

      // =================================================
      // ERROR
      // =================================================

      if (!response.ok) {
        if (data.alreadyPaid) {
          previewLockedRef.current = false;

          forcePositionRef.current = false;

          setPurchased(true);

          setPreviewEnded(false);

          alert("Video ini sudah kamu beli.");

          return;
        }

        throw new Error(data.message || "Gagal membuat pembayaran.");
      }

      // =================================================
      // SNAP TOKEN
      // =================================================

      if (!data.snapToken) {
        throw new Error("Snap Token tidak diterima dari server.");
      }

      // =================================================
      // MIDTRANS SNAP
      // =================================================

      if (!window.snap || typeof window.snap.pay !== "function") {
        throw new Error("Midtrans Snap belum dimuat. Periksa index.html.");
      }

      // =================================================
      // OPEN MIDTRANS
      // =================================================

      window.snap.pay(data.snapToken, {
        // =============================================
        // SUCCESS
        // =============================================

        onSuccess: async function (result) {
          console.log("MIDTRANS SUCCESS:", result);

          alert("Pembayaran berhasil. Sistem sedang memverifikasi pembayaran.");

          setTimeout(() => {
            checkPurchaseAfterPayment();
          }, 3000);
        },

        // =============================================
        // PENDING
        // =============================================

        onPending: function (result) {
          console.log("MIDTRANS PENDING:", result);

          alert("Pembayaran masih pending. Silakan selesaikan pembayaran.");
        },

        // =============================================
        // ERROR
        // =============================================

        onError: function (result) {
          console.error("MIDTRANS ERROR:", result);

          alert("Pembayaran gagal.");
        },

        // =============================================
        // CLOSE
        // =============================================

        onClose: function () {
          console.log("Popup pembayaran ditutup.");
        },
      });
    } catch (err) {
      console.error("PAYMENT ERROR:", err);

      alert(err.message || "Gagal menghubungkan pembayaran.");
    } finally {
      setPaymentLoading(false);
    }
  };

  // =====================================================
  // CHECK PURCHASE SETELAH PEMBAYARAN
  // =====================================================

  const checkPurchaseAfterPayment = async () => {
    console.log("Menunggu webhook Midtrans...");

    // =================================================
    // CHECK 1
    // =================================================

    let purchasedResult = await checkPurchase();

    if (purchasedResult) {
      unlockVideo();

      alert("Video berhasil dibuka penuh!");

      return;
    }

    // =================================================
    // TUNGGU 3 DETIK
    // =================================================

    await new Promise((resolve) => setTimeout(resolve, 3000));

    purchasedResult = await checkPurchase();

    if (purchasedResult) {
      unlockVideo();

      alert("Video berhasil dibuka penuh!");

      return;
    }

    // =================================================
    // TUNGGU 5 DETIK
    // =================================================

    await new Promise((resolve) => setTimeout(resolve, 5000));

    purchasedResult = await checkPurchase();

    if (purchasedResult) {
      unlockVideo();

      alert("Video berhasil dibuka penuh!");

      return;
    }

    // =================================================
    // BELUM TERUPDATE
    // =================================================

    alert(
      "Pembayaran sudah diterima oleh Midtrans, tetapi status pembelian belum masuk ke VIDORA. Coba refresh beberapa saat lagi.",
    );
  };

  // =====================================================
  // UNLOCK VIDEO
  // =====================================================

  const unlockVideo = () => {
    console.log("=================================");

    console.log("VIDEO UNLOCK");

    console.log("=================================");

    previewLockedRef.current = false;

    forcePositionRef.current = false;

    setPurchased(true);

    setPreviewEnded(false);

    // Pastikan video bisa dimainkan kembali
    const player = videoRef.current;

    if (player) {
      player.controls = true;
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <main className="watch-page">
        <div className="empty-state">
          <div className="empty-icon">🎬</div>

          <h2>Memuat video...</h2>

          <p>Tunggu sebentar.</p>
        </div>
      </main>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error || !video) {
    const loginRequired = error.includes("harus login");

    return (
      <main className="watch-page">
        <div className="empty-state">
          <div className="empty-icon">{loginRequired ? "🔐" : "❌"}</div>

          <h2>{loginRequired ? "Login diperlukan" : "Video tidak tersedia"}</h2>

          <p>{error || "Video tidak tersedia."}</p>

          <div
            style={{
              display: "flex",
              gap: "10px",
              justifyContent: "center",
              marginTop: "20px",
            }}
          >
            {loginRequired && (
              <Link to="/login" className="hero-primary">
                Login
              </Link>
            )}

            <Link to="/" className="hero-primary">
              Kembali ke Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // =====================================================
  // CLOUDINARY VIDEO URL
  // =====================================================

  const videoUrl = video.video_file;

  const thumbnailUrl = video.thumbnail || undefined;

  // =====================================================
  // HARGA
  // =====================================================

  const price = Number(video.price || 0);

  const isPaidVideo = price > 0;

  const isFreeVideo = price <= 0;

  // =====================================================
  // OWNER
  // =====================================================

  const isOwner = Boolean(video.isOwner);

  // =====================================================
  // FULL ACCESS
  // =====================================================

  const hasFullAccess = isFreeVideo || purchased || isOwner;

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <main className="watch-page">
      <div className="watch-container">
        {/* =================================================
            VIDEO PLAYER
        ================================================= */}

        <div className="watch-player">
          <div className="video-player-wrapper">
            <video
              ref={videoRef}
              controls
              preload="metadata"
              poster={thumbnailUrl}
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              onSeeking={handleSeeking}
              onPlay={handlePlay}
              playsInline
            >
              <source src={videoUrl} type="video/mp4" />
              Browser kamu tidak mendukung pemutar video.
            </video>

            {/* ============================================
                PAYMENT OVERLAY
            ============================================ */}

            {isPaidVideo && !hasFullAccess && previewEnded && (
              <div className="payment-overlay">
                <div className="payment-box">
                  <div className="payment-icon">🔒</div>

                  <h2>Preview Selesai</h2>

                  <p>
                    Video ini berbayar. Silakan beli untuk menonton video
                    lengkap.
                  </p>

                  <div className="payment-price">
                    Rp {price.toLocaleString("id-ID")}
                  </div>

                  <button
                    type="button"
                    className="buy-video-btn"
                    onClick={handleBuyVideo}
                    disabled={paymentLoading}
                  >
                    {paymentLoading ? "Memproses..." : "💳 Beli Video"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* =================================================
            INFORMASI VIDEO
        ================================================= */}

        <div className="watch-info">
          <h1>{video.title}</h1>

          {/* =================================================
              META
          ================================================= */}

          <div className="watch-meta">
            <span>👤 {video.username || "User"}</span>

            <span>👁 {video.views || 0} views</span>

            <span>
              {isPaidVideo ? `Rp ${price.toLocaleString("id-ID")}` : "Gratis"}
            </span>
          </div>

          {/* =================================================
              STATUS
          ================================================= */}

          {video.status !== "approved" && isOwner && (
            <div className="purchase-success">
              ⚠ Video ini masih berstatus <strong>{video.status}</strong>
            </div>
          )}

          {/* =================================================
              SUDAH DIBELI
          ================================================= */}

          {isPaidVideo && purchased && (
            <div className="purchase-success">✓ Video sudah dibeli</div>
          )}

          {/* =================================================
              OWNER
          ================================================= */}

          {isOwner && isPaidVideo && (
            <div className="purchase-success">
              ✓ Kamu adalah pemilik video ini
            </div>
          )}

          {/* =================================================
              GRATIS
          ================================================= */}

          {isFreeVideo && (
            <div className="purchase-success">✓ Video gratis</div>
          )}

          {/* =================================================
              VIDEO BERBAYAR
          ================================================= */}

          {isPaidVideo && !purchased && !isOwner && (
            <div className="watch-buy-section">
              <div className="watch-buy-price">
                Rp {price.toLocaleString("id-ID")}
              </div>

              {!previewEnded && (
                <p className="watch-buy-info">
                  Tonton preview selama 5 detik, kemudian beli untuk membuka
                  video lengkap.
                </p>
              )}

              {previewEnded && (
                <p className="watch-buy-info">
                  🔒 Preview sudah selesai. Beli video untuk membuka akses
                  penuh.
                </p>
              )}

              <button
                type="button"
                className="buy-video-btn"
                onClick={handleBuyVideo}
                disabled={paymentLoading || checkingPurchase}
              >
                {paymentLoading ? "Memproses..." : "💳 Beli Video"}
              </button>
            </div>
          )}

          {/* =================================================
              DESCRIPTION
          ================================================= */}

          {video.description && (
            <div className="watch-description">
              <h3>Deskripsi</h3>

              <p>{video.description}</p>
            </div>
          )}

          {/* =================================================
              BACK
          ================================================= */}

          <div className="watch-back">
            <Link to="/">← Kembali ke video</Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Watch;

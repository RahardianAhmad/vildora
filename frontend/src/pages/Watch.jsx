import { useEffect, useRef, useState } from "react";

import { Link, useParams, useNavigate } from "react-router-dom";

const API_URL = "http://localhost:3000";

function Watch() {
  const { id } = useParams();

  const navigate = useNavigate();

  const videoRef = useRef(null);

  // ======================================================
  // STATE VIDEO
  // ======================================================

  const [video, setVideo] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // ======================================================
  // STATE PURCHASE
  // ======================================================

  const [purchased, setPurchased] = useState(false);

  const [checkingPurchase, setCheckingPurchase] = useState(false);

  const [paymentLoading, setPaymentLoading] = useState(false);

  const [previewEnded, setPreviewEnded] = useState(false);

  // ======================================================
  // TOKEN
  // ======================================================

  const getToken = () => {
    return localStorage.getItem("token");
  };

  // ======================================================
  // USER
  // ======================================================

  const getUser = () => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch (error) {
      console.error("Gagal membaca user:", error);

      return null;
    }
  };

  // ======================================================
  // LOAD VIDEO
  // ======================================================

  useEffect(() => {
    const loadVideo = async () => {
      try {
        setLoading(true);
        setError("");

        const token = getToken();

        console.log("=================================");

        console.log("MENGAMBIL VIDEO");

        console.log("Video ID:", id);

        console.log("Login:", token ? "YA" : "TIDAK");

        console.log("=================================");

        // ==================================================
        // HEADER
        // ==================================================

        const headers = {};

        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        // ==================================================
        // REQUEST
        // ==================================================

        const response = await fetch(`${API_URL}/api/videos/${id}`, {
          method: "GET",
          headers,
        });

        const data = await response.json();

        console.log("VIDEO RESPONSE:", data);

        // ==================================================
        // BELUM LOGIN
        // ==================================================

        if (response.status === 401) {
          setError("Kamu harus login terlebih dahulu untuk menonton video.");

          return;
        }

        // ==================================================
        // TIDAK BOLEH AKSES
        // ==================================================

        if (response.status === 404) {
          setError(
            data.message || "Video tidak ditemukan atau belum diapprove.",
          );

          return;
        }

        // ==================================================
        // ERROR LAIN
        // ==================================================

        if (!response.ok) {
          throw new Error(data.message || "Gagal mengambil video.");
        }

        // ==================================================
        // SET VIDEO
        // ==================================================

        setVideo(data.video);
      } catch (error) {
        console.error("GET VIDEO ERROR:", error);

        setError(error.message || "Gagal mengambil video.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadVideo();
    }
  }, [id]);

  // ======================================================
  // CEK PURCHASE SAAT HALAMAN DIBUKA
  // ======================================================

  useEffect(() => {
    if (!id) {
      return;
    }

    const token = getToken();

    if (!token) {
      setPurchased(false);
      return;
    }

    checkPurchase();
  }, [id]);

  // ======================================================
  // CHECK PURCHASE
  // ======================================================

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

      if (data.purchased === true) {
        setPurchased(true);

        setPreviewEnded(false);

        return true;
      }

      setPurchased(false);

      return false;
    } catch (error) {
      console.error("CHECK PURCHASE ERROR:", error);

      return false;
    } finally {
      setCheckingPurchase(false);
    }
  };

  // ======================================================
  // BATASI VIDEO BERBAYAR 5 DETIK
  // ======================================================

  const handleTimeUpdate = (event) => {
    const player = event.currentTarget;

    if (!video) {
      return;
    }

    // ==================================================
    // CEK OWNER DARI BACKEND
    // ==================================================

    if (video.isOwner) {
      return;
    }

    // ==================================================
    // HARGA
    // ==================================================

    const price = Number(video.price || 0);

    // ==================================================
    // GRATIS
    // ==================================================

    if (price <= 0) {
      return;
    }

    // ==================================================
    // SUDAH BELI
    // ==================================================

    if (purchased) {
      return;
    }

    // ==================================================
    // PREVIEW SUDAH BERAKHIR
    // ==================================================

    if (previewEnded) {
      return;
    }

    // ==================================================
    // BATAS 5 DETIK
    // ==================================================

    if (player.currentTime >= 5) {
      console.log("Preview 5 detik selesai.");

      player.pause();

      player.currentTime = 5;

      setPreviewEnded(true);
    }
  };

  // ======================================================
  // BUAT PEMBAYARAN
  // ======================================================

  const handleBuyVideo = async () => {
    try {
      // ==================================================
      // CEK LOGIN
      // ==================================================

      const token = getToken();

      if (!token) {
        alert("Silakan login terlebih dahulu untuk membeli video.");

        navigate("/login");

        return;
      }

      // ==================================================
      // CEK VIDEO
      // ==================================================

      if (!video) {
        alert("Data video belum tersedia.");

        return;
      }

      // ==================================================
      // OWNER TIDAK PERLU BELI
      // ==================================================

      if (video.isOwner) {
        alert("Kamu adalah pemilik video ini.");

        return;
      }

      // ==================================================
      // CEK HARGA
      // ==================================================

      const price = Number(video.price || 0);

      if (price <= 0) {
        alert("Video ini gratis.");

        return;
      }

      // ==================================================
      // CEK PURCHASE
      // ==================================================

      const alreadyPurchased = await checkPurchase();

      if (alreadyPurchased) {
        alert("Video ini sudah kamu beli.");

        return;
      }

      // ==================================================
      // LOADING
      // ==================================================

      setPaymentLoading(true);

      // ==================================================
      // CREATE PAYMENT
      // ==================================================

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

      console.log("RESPONSE PAYMENT:", data);

      // ==================================================
      // ERROR
      // ==================================================

      if (!response.ok) {
        if (data.alreadyPaid) {
          setPurchased(true);

          setPreviewEnded(false);

          alert("Video ini sudah kamu beli.");

          return;
        }

        throw new Error(data.message || "Gagal membuat pembayaran.");
      }

      // ==================================================
      // SNAP TOKEN
      // ==================================================

      if (!data.snapToken) {
        throw new Error("Snap Token tidak diterima dari server.");
      }

      // ==================================================
      // CEK SNAP
      // ==================================================

      if (!window.snap || typeof window.snap.pay !== "function") {
        throw new Error("Midtrans Snap belum dimuat. Periksa index.html.");
      }

      // ==================================================
      // MIDTRANS
      // ==================================================

      window.snap.pay(data.snapToken, {
        // ==========================================
        // SUCCESS
        // ==========================================

        onSuccess: async function (result) {
          console.log("MIDTRANS SUCCESS:", result);

          alert("Pembayaran berhasil. Sistem sedang memverifikasi pembayaran.");

          setTimeout(() => {
            checkPurchaseAfterPayment();
          }, 3000);
        },

        // ==========================================
        // PENDING
        // ==========================================

        onPending: function (result) {
          console.log("MIDTRANS PENDING:", result);

          alert("Pembayaran masih pending. Silakan selesaikan pembayaran.");
        },

        // ==========================================
        // ERROR
        // ==========================================

        onError: function (result) {
          console.error("MIDTRANS ERROR:", result);

          alert("Pembayaran gagal.");
        },

        // ==========================================
        // CLOSE
        // ==========================================

        onClose: function () {
          console.log("Popup pembayaran ditutup.");
        },
      });
    } catch (error) {
      console.error("PAYMENT ERROR:", error);

      alert(error.message || "Gagal menghubungkan pembayaran.");
    } finally {
      setPaymentLoading(false);
    }
  };

  // ======================================================
  // CEK PURCHASE SETELAH PEMBAYARAN
  // ======================================================

  const checkPurchaseAfterPayment = async () => {
    console.log("Menunggu webhook Midtrans...");

    // ==================================================
    // CEK PERTAMA
    // ==================================================

    let purchasedResult = await checkPurchase();

    if (purchasedResult) {
      alert("Video berhasil dibuka penuh!");

      return;
    }

    // ==================================================
    // TUNGGU 3 DETIK
    // ==================================================

    await new Promise((resolve) => setTimeout(resolve, 3000));

    purchasedResult = await checkPurchase();

    if (purchasedResult) {
      alert("Video berhasil dibuka penuh!");

      return;
    }

    // ==================================================
    // TUNGGU 5 DETIK
    // ==================================================

    await new Promise((resolve) => setTimeout(resolve, 5000));

    purchasedResult = await checkPurchase();

    if (purchasedResult) {
      alert("Video berhasil dibuka penuh!");

      return;
    }

    // ==================================================
    // WEBHOOK BELUM MASUK
    // ==================================================

    alert(
      "Pembayaran sudah diterima oleh Midtrans, tetapi status pembelian belum masuk ke Colingers. Coba refresh beberapa saat lagi.",
    );
  };

  // ======================================================
  // LOADING
  // ======================================================

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

  // ======================================================
  // ERROR
  // ======================================================

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

  // ======================================================
  // URL VIDEO
  // ======================================================

  const videoUrl = `${API_URL}/uploads/videos/${video.video_file}`;

  const thumbnailUrl = video.thumbnail
    ? `${API_URL}/uploads/thumbnails/${video.thumbnail}`
    : undefined;

  // ======================================================
  // HARGA
  // ======================================================

  const price = Number(video.price || 0);

  const isPaidVideo = price > 0;

  const isFreeVideo = price <= 0;

  // ======================================================
  // OWNER
  //
  // PENTING:
  // JANGAN LAGI BERGANTUNG PADA localStorage USER
  //
  // Backend yang menentukan pemilik.
  // ======================================================

  const isOwner = Boolean(video.isOwner);

  // ======================================================
  // FULL ACCESS
  // ======================================================

  const hasFullAccess = isFreeVideo || purchased || isOwner;

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <main className="watch-page">
      <div className="watch-container">
        {/* ==================================================
            VIDEO PLAYER
        ================================================== */}

        <div className="watch-player">
          <div className="video-player-wrapper">
            <video
              ref={videoRef}
              controls
              preload="metadata"
              poster={thumbnailUrl}
              onTimeUpdate={handleTimeUpdate}
              playsInline
            >
              <source src={videoUrl} type="video/mp4" />
              Browser kamu tidak mendukung pemutar video.
            </video>

            {/* ==================================================
                PAYMENT OVERLAY
            ================================================== */}

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

        {/* ==================================================
            INFORMASI VIDEO
        ================================================== */}

        <div className="watch-info">
          <h1>{video.title}</h1>

          <div className="watch-meta">
            <span>👤 {video.username || "User"}</span>

            <span>👁 {video.views || 0} views</span>

            <span>
              {isPaidVideo ? `Rp ${price.toLocaleString("id-ID")}` : "Gratis"}
            </span>
          </div>

          {/* ==================================================
              STATUS
          ================================================== */}

          {video.status !== "approved" && isOwner && (
            <div className="purchase-success">
              ⚠ Video ini masih berstatus <strong>{video.status}</strong>
            </div>
          )}

          {/* ==================================================
              PURCHASE
          ================================================== */}

          {isPaidVideo && purchased && (
            <div className="purchase-success">✓ Video sudah dibeli</div>
          )}

          {/* ==================================================
              OWNER
          ================================================== */}

          {isOwner && isPaidVideo && (
            <div className="purchase-success">
              ✓ Kamu adalah pemilik video ini
            </div>
          )}

          {/* ==================================================
              GRATIS
          ================================================== */}

          {isFreeVideo && (
            <div className="purchase-success">✓ Video gratis</div>
          )}

          {/* ==================================================
              BELUM BELI
          ================================================== */}

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

          {/* ==================================================
              DESCRIPTION
          ================================================== */}

          {video.description && (
            <div className="watch-description">
              <h3>Deskripsi</h3>

              <p>{video.description}</p>
            </div>
          )}

          {/* ==================================================
              KEMBALI
          ================================================== */}

          <div className="watch-back">
            <Link to="/">← Kembali ke video</Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Watch;

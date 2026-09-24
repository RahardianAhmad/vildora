import { useState } from "react";

import { Link, useNavigate } from "react-router-dom";

function Upload() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "null");

  const token = localStorage.getItem("token");

  const [title, setTitle] = useState("");

  const [description, setDescription] = useState("");

  const [price, setPrice] = useState("0");

  const [video, setVideo] = useState(null);

  const [thumbnail, setThumbnail] = useState(null);

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    if (!video) {
      setError("Silakan pilih file video.");

      setLoading(false);

      return;
    }

    try {
      const formData = new FormData();

      formData.append("title", title);

      formData.append("description", description);

      formData.append("price", price || "0");

      formData.append("video", video);

      if (thumbnail) {
        formData.append("thumbnail", thumbnail);
      }

      const response = await fetch(
        "https://epidermal-unloader-viscous.ngrok-free.dev/api/videos/upload",
        {
          method: "POST",

          headers: {
            Authorization: `Bearer ${token}`,
          },

          body: formData,
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Upload gagal.");

        return;
      }

      setMessage(data.message);

      setTitle("");
      setDescription("");
      setPrice("0");
      setVideo(null);
      setThumbnail(null);

      document.getElementById("videoInput").value = "";

      document.getElementById("thumbnailInput").value = "";
    } catch (error) {
      console.error("Upload error:", error);

      setError("Tidak dapat terhubung ke server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-page">
      <div className="upload-container">
        <div className="upload-header">
          <span>VIDEO UPLOAD</span>

          <h1>Upload Video</h1>

          <p>
            {user?.role === "admin"
              ? "Video admin akan langsung dipublikasikan tanpa approval."
              : "Video akan diperiksa admin sebelum dipublikasikan."}
          </p>
        </div>

        {message && <div className="success-message">{message}</div>}

        {error && <div className="error-message">{error}</div>}

        <form className="upload-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Judul Video</label>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Masukkan judul video"
              required
            />
          </div>

          <div className="form-group">
            <label>Deskripsi</label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsi video"
              rows="5"
            />
          </div>

          <div className="form-group">
            <label>Harga Video</label>

            <input
              type="number"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />

            <small>Isi 0 jika video gratis.</small>
          </div>

          <div className="form-group">
            <label>File Video</label>

            <input
              id="videoInput"
              type="file"
              accept="video/mp4,video/webm,video/mpeg,video/quicktime"
              onChange={(e) => setVideo(e.target.files[0])}
              required
            />
          </div>

          <div className="form-group">
            <label>Thumbnail</label>

            <input
              id="thumbnailInput"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setThumbnail(e.target.files[0])}
            />
          </div>

          <button type="submit" className="upload-submit" disabled={loading}>
            {loading ? "Mengupload..." : "Upload Video"}
          </button>
        </form>

        <div className="upload-links">
          {user?.role === "admin" && (
            <Link to="/admin/approve">← Kembali ke Approve Video</Link>
          )}

          <Link to="/my-videos">Lihat Video Saya →</Link>
        </div>
      </div>
    </div>
  );
}

export default Upload;

const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,

  params: async (req, file) => {
    if (file.fieldname === "video") {
      return {
        folder: "vidora/videos",
        resource_type: "video",
        allowed_formats: ["mp4", "mpeg", "webm", "mov"],
        public_id: `video-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
      };
    }

    if (file.fieldname === "thumbnail") {
      return {
        folder: "vidora/thumbnails",
        resource_type: "image",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        public_id: `thumbnail-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
      };
    }

    throw new Error("Field upload tidak dikenal.");
  },
});

const fileFilter = (req, file, cb) => {
  // =========================
  // VIDEO
  // =========================
  if (file.fieldname === "video") {
    const allowedVideo = [
      "video/mp4",
      "video/mpeg",
      "video/webm",
      "video/quicktime",
    ];

    if (!allowedVideo.includes(file.mimetype)) {
      return cb(new Error("Format video tidak didukung."));
    }

    return cb(null, true);
  }

  // =========================
  // THUMBNAIL
  // =========================
  if (file.fieldname === "thumbnail") {
    const allowedImage = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedImage.includes(file.mimetype)) {
      return cb(new Error("Format thumbnail tidak didukung."));
    }

    return cb(null, true);
  }

  return cb(new Error("Field upload tidak dikenal."));
};

const upload = multer({
  storage,
  fileFilter,

  limits: {
    fileSize: 100 * 1024 * 1024,
  },
});

module.exports = upload;

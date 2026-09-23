const multer = require("multer");
const path = require("path");
const fs = require("fs");

const videoPath = path.join(__dirname, "../uploads/videos");
const thumbnailPath = path.join(__dirname, "../uploads/thumbnails");

if (!fs.existsSync(videoPath)) {
  fs.mkdirSync(videoPath, { recursive: true });
}

if (!fs.existsSync(thumbnailPath)) {
  fs.mkdirSync(thumbnailPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === "video") {
      cb(null, videoPath);
    } else if (file.fieldname === "thumbnail") {
      cb(null, thumbnailPath);
    } else {
      cb(new Error("Field upload tidak dikenal."));
    }
  },

  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);

    const name = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;

    cb(null, name);
  },
});

const fileFilter = (req, file, cb) => {
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
  }

  if (file.fieldname === "thumbnail") {
    const allowedImage = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedImage.includes(file.mimetype)) {
      return cb(new Error("Format thumbnail tidak didukung."));
    }
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 500,
  },
});

module.exports = upload;

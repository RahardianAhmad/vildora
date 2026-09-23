const express = require("express");

const router = express.Router();

// ======================================================
// MIDDLEWARE
// ======================================================

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const upload = require("../middleware/uploadMiddleware");

// ======================================================
// CONTROLLER
// ======================================================

const {
  uploadVideo,
  getApprovedVideos,
  getVideoById,
  getMyVideos,
  getDashboardVideos,
  getPendingVideos,
  approveVideo,
  rejectVideo,
  getAdminStats,
  deleteVideo,
} = require("../controllers/videoController");

// ======================================================
// PUBLIC / HOME
//
// GET /api/videos/public
//
// Hanya menampilkan video APPROVED.
// Tidak membutuhkan login.
// ======================================================

router.get("/public", getApprovedVideos);

// ======================================================
// APPROVED VIDEOS
//
// GET /api/videos/approved
//
// Hanya menampilkan video APPROVED.
// Tidak membutuhkan login.
//
// Dipakai halaman:
// "Jelajahi Semua"
// ======================================================

router.get("/approved", getApprovedVideos);

// ======================================================
// UPLOAD VIDEO
//
// POST /api/videos/upload
//
// Wajib login.
//
// USER:
// - video masuk pending
//
// ADMIN:
// - video langsung approved
//
// FORM DATA:
// video     -> file video
// thumbnail -> gambar thumbnail
// title     -> judul
// description -> deskripsi
// price     -> harga
// ======================================================

router.post(
  "/upload",
  authMiddleware,
  upload.fields([
    {
      name: "video",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  uploadVideo,
);

// ======================================================
// DASHBOARD USER
//
// GET /api/videos/dashboard
//
// Wajib login.
//
// Menampilkan:
//
// 1. Semua video APPROVED
// 2. Video milik user sendiri
//
// Video sendiri:
// - pending
// - approved
// - rejected
//
// Video orang lain:
// - approved saja
// ======================================================

router.get("/dashboard", authMiddleware, getDashboardVideos);

// ======================================================
// VIDEO MILIK USER SENDIRI
//
// GET /api/videos/my
//
// Wajib login.
//
// Menampilkan semua video milik user:
//
// - pending
// - approved
// - rejected
// ======================================================

router.get("/my", authMiddleware, getMyVideos);

// ======================================================
// ADMIN STATISTICS
//
// GET /api/videos/admin/stats
//
// Hanya ADMIN.
// ======================================================

router.get("/admin/stats", authMiddleware, adminMiddleware, getAdminStats);

// ======================================================
// ADMIN PENDING
//
// GET /api/videos/admin/pending
//
// Hanya ADMIN.
//
// Menampilkan video yang menunggu approval.
// ======================================================

router.get("/admin/pending", authMiddleware, adminMiddleware, getPendingVideos);

// ======================================================
// ADMIN APPROVE
//
// PUT /api/videos/admin/:id/approve
//
// Hanya ADMIN.
//
// Contoh:
// PUT /api/videos/admin/10/approve
// ======================================================

router.put("/admin/:id/approve", authMiddleware, adminMiddleware, approveVideo);

// ======================================================
// ADMIN REJECT
//
// PUT /api/videos/admin/:id/reject
//
// Hanya ADMIN.
//
// Body:
//
// {
//   "reason": "Konten tidak sesuai"
// }
// ======================================================

router.put("/admin/:id/reject", authMiddleware, adminMiddleware, rejectVideo);

// ======================================================
// DELETE VIDEO
//
// DELETE /api/videos/:id
//
// USER:
// hanya bisa menghapus video miliknya sendiri.
//
// ADMIN:
// bisa menghapus video siapa saja.
//
// Proses delete:
// 1. Cek video
// 2. Cek owner/admin
// 3. Hapus video dari Cloudinary
// 4. Hapus thumbnail dari Cloudinary
// 5. Hapus record dari database
//
// Route DELETE diletakkan sebelum GET /:id
// supaya struktur route tetap jelas.
// ======================================================

router.delete("/:id", authMiddleware, deleteVideo);

// ======================================================
// WATCH VIDEO
//
// GET /api/videos/:id
//
// Wajib login.
//
// PEMILIK:
// - approved  -> boleh
// - pending   -> boleh
// - rejected  -> boleh
//
// USER LAIN:
// - approved  -> boleh
// - pending   -> tidak boleh
// - rejected  -> tidak boleh
//
// Route GET /:id harus PALING BAWAH.
// ======================================================

router.get("/:id", authMiddleware, getVideoById);

// ======================================================
// EXPORT ROUTER
// ======================================================

module.exports = router;

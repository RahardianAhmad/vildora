const db = require("../config/database");
const fs = require("fs");
const path = require("path");

// ======================================================
// UPLOAD VIDEO
// USER  -> pending
// ADMIN -> approved
// ======================================================

exports.uploadVideo = async (req, res) => {
  try {
    const { title, description, price } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Judul video wajib diisi.",
      });
    }

    if (!req.files || !req.files.video || req.files.video.length === 0) {
      return res.status(400).json({
        success: false,
        message: "File video wajib diupload.",
      });
    }

    const videoFile = req.files.video[0].filename;

    let thumbnailFile = null;

    if (req.files.thumbnail && req.files.thumbnail.length > 0) {
      thumbnailFile = req.files.thumbnail[0].filename;
    }

    let videoPrice = 0;

    if (price !== undefined && price !== null && price !== "") {
      const parsedPrice = Number(price);

      if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({
          success: false,
          message: "Harga video tidak valid.",
        });
      }

      videoPrice = parsedPrice;
    }

    // ADMIN -> langsung approved
    // USER  -> pending
    const status = req.user.role === "admin" ? "approved" : "pending";

    const [result] = await db.promise().query(
      `
      INSERT INTO videos
      (
        user_id,
        title,
        description,
        video_file,
        thumbnail,
        price,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        req.user.id,
        title.trim(),
        description || "",
        videoFile,
        thumbnailFile,
        videoPrice,
        status,
      ],
    );

    return res.status(201).json({
      success: true,

      message:
        req.user.role === "admin"
          ? "Video admin berhasil diupload dan langsung approved."
          : "Video berhasil diupload dan menunggu approval admin.",

      video: {
        id: result.insertId,
        title: title.trim(),
        description: description || "",
        video_file: videoFile,
        thumbnail: thumbnailFile,
        price: videoPrice,
        status,
      },
    });
  } catch (error) {
    console.error("Upload video error:", error);

    return res.status(500).json({
      success: false,
      message: "Gagal mengupload video.",
    });
  }
};

// ======================================================
// GET VIDEO APPROVED
// DIPAKAI UNTUK HOME
// HANYA APPROVED
// ======================================================

exports.getApprovedVideos = async (req, res) => {
  try {
    const [videos] = await db.promise().query(
      `
      SELECT
        v.id,
        v.user_id,
        v.title,
        v.description,
        v.video_file,
        v.thumbnail,
        v.price,
        v.status,
        v.views,
        v.created_at,
        u.username
      FROM videos v
      INNER JOIN users u
        ON v.user_id = u.id
      WHERE v.status = 'approved'
      ORDER BY v.created_at DESC
      `,
    );

    return res.json({
      success: true,
      videos,
    });
  } catch (error) {
    console.error("Get approved videos error:", error);

    return res.status(500).json({
      success: false,
      message: "Gagal mengambil video.",
    });
  }
};

// ======================================================
// GET VIDEO BY ID
//
// WAJIB LOGIN
//
// USER LAIN:
// approved saja
//
// PEMILIK:
// approved / pending / rejected
// ======================================================

exports.getVideoById = async (req, res) => {
  try {
    const { id } = req.params;

    const userId = req.user ? Number(req.user.id) : null;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Kamu harus login terlebih dahulu untuk menonton video.",
      });
    }

    const [videos] = await db.promise().query(
      `
      SELECT
        v.id,
        v.user_id,
        v.title,
        v.description,
        v.video_file,
        v.thumbnail,
        v.price,
        v.status,
        v.rejection_reason,
        v.views,
        v.created_at,
        v.updated_at,
        u.username
      FROM videos v
      INNER JOIN users u
        ON v.user_id = u.id
      WHERE
        v.id = ?
        AND
        (
          v.status = 'approved'
          OR v.user_id = ?
        )
      LIMIT 1
      `,
      [id, userId],
    );

    if (videos.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Video tidak ditemukan atau video belum diapprove.",
      });
    }

    const video = videos[0];

    const isOwner = Number(video.user_id) === Number(userId);

    await db.promise().query(
      `
      UPDATE videos
      SET views = views + 1
      WHERE id = ?
      `,
      [id],
    );

    video.views = Number(video.views || 0) + 1;

    return res.json({
      success: true,

      video: {
        ...video,

        isOwner,

        isApproved: video.status === "approved",

        isFree: Number(video.price || 0) <= 0,

        isPaid: Number(video.price || 0) > 0,
      },
    });
  } catch (error) {
    console.error("Get video by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Gagal mengambil video.",
    });
  }
};

// ======================================================
// GET VIDEO MILIK USER
// ======================================================

exports.getMyVideos = async (req, res) => {
  try {
    const [videos] = await db.promise().query(
      `
      SELECT
        id,
        title,
        description,
        video_file,
        thumbnail,
        price,
        status,
        rejection_reason,
        views,
        created_at,
        updated_at
      FROM videos
      WHERE user_id = ?
      ORDER BY created_at DESC
      `,
      [req.user.id],
    );

    return res.json({
      success: true,
      videos,
    });
  } catch (error) {
    console.error("Get my videos error:", error);

    return res.status(500).json({
      success: false,
      message: "Gagal mengambil video.",
    });
  }
};

// ======================================================
// ADMIN - GET PENDING
// ======================================================

exports.getPendingVideos = async (req, res) => {
  try {
    const [videos] = await db.promise().query(
      `
      SELECT
        v.id,
        v.user_id,
        v.title,
        v.description,
        v.video_file,
        v.thumbnail,
        v.price,
        v.status,
        v.rejection_reason,
        v.created_at,
        u.username,
        u.email
      FROM videos v
      INNER JOIN users u
        ON v.user_id = u.id
      WHERE v.status = 'pending'
      ORDER BY v.created_at ASC
      `,
    );

    return res.json({
      success: true,
      videos,
    });
  } catch (error) {
    console.error("Get pending videos error:", error);

    return res.status(500).json({
      success: false,
      message: "Gagal mengambil video pending.",
    });
  }
};

// ======================================================
// ADMIN - APPROVE
// ======================================================

exports.approveVideo = async (req, res) => {
  try {
    const videoId = req.params.id;

    const [videos] = await db.promise().query(
      `
      SELECT
        id,
        status
      FROM videos
      WHERE id = ?
      `,
      [videoId],
    );

    if (videos.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Video tidak ditemukan.",
      });
    }

    await db.promise().query(
      `
      UPDATE videos
      SET
        status = 'approved',
        rejection_reason = NULL
      WHERE id = ?
      `,
      [videoId],
    );

    await db.promise().query(
      `
      INSERT INTO video_approvals
      (
        video_id,
        admin_id,
        action,
        note
      )
      VALUES (?, ?, 'approved', ?)
      `,
      [videoId, req.user.id, "Video disetujui admin."],
    );

    return res.json({
      success: true,
      message: "Video berhasil di-approve.",
    });
  } catch (error) {
    console.error("Approve video error:", error);

    return res.status(500).json({
      success: false,
      message: "Gagal approve video.",
    });
  }
};

// ======================================================
// ADMIN - REJECT
// ======================================================

exports.rejectVideo = async (req, res) => {
  try {
    const videoId = req.params.id;

    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: "Alasan penolakan wajib diisi.",
      });
    }

    const [videos] = await db.promise().query(
      `
      SELECT id
      FROM videos
      WHERE id = ?
      `,
      [videoId],
    );

    if (videos.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Video tidak ditemukan.",
      });
    }

    await db.promise().query(
      `
      UPDATE videos
      SET
        status = 'rejected',
        rejection_reason = ?
      WHERE id = ?
      `,
      [reason.trim(), videoId],
    );

    await db.promise().query(
      `
      INSERT INTO video_approvals
      (
        video_id,
        admin_id,
        action,
        note
      )
      VALUES (?, ?, 'rejected', ?)
      `,
      [videoId, req.user.id, reason.trim()],
    );

    return res.json({
      success: true,
      message: "Video berhasil ditolak.",
    });
  } catch (error) {
    console.error("Reject video error:", error);

    return res.status(500).json({
      success: false,
      message: "Gagal reject video.",
    });
  }
};

// ======================================================
// ADMIN STATISTICS
// ======================================================

exports.getAdminStats = async (req, res) => {
  try {
    const [[total]] = await db.promise().query(
      `
      SELECT COUNT(*) AS total
      FROM videos
      `,
    );

    const [[pending]] = await db.promise().query(
      `
      SELECT COUNT(*) AS total
      FROM videos
      WHERE status = 'pending'
      `,
    );

    const [[approved]] = await db.promise().query(
      `
      SELECT COUNT(*) AS total
      FROM videos
      WHERE status = 'approved'
      `,
    );

    const [[rejected]] = await db.promise().query(
      `
      SELECT COUNT(*) AS total
      FROM videos
      WHERE status = 'rejected'
      `,
    );

    const [[users]] = await db.promise().query(
      `
      SELECT COUNT(*) AS total
      FROM users
      WHERE role = 'user'
      `,
    );

    return res.json({
      success: true,

      stats: {
        totalVideos: total.total,
        pendingVideos: pending.total,
        approvedVideos: approved.total,
        rejectedVideos: rejected.total,
        totalUsers: users.total,
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);

    return res.status(500).json({
      success: false,
      message: "Gagal mengambil statistik admin.",
    });
  }
};

// ======================================================
// DASHBOARD USER
//
// Menampilkan:
// 1. Semua video APPROVED
// 2. Video milik sendiri walaupun pending/rejected
//
// Video milik sendiri yang sudah approved
// tidak akan duplicate.
// ======================================================

exports.getDashboardVideos = async (req, res) => {
  try {
    const userId = Number(req.user.id);

    const [videos] = await db.promise().query(
      `
      SELECT
        v.id,
        v.user_id,
        v.title,
        v.description,
        v.video_file,
        v.thumbnail,
        v.price,
        v.status,
        v.rejection_reason,
        v.views,
        v.created_at,
        v.updated_at,
        u.username
      FROM videos v
      INNER JOIN users u
        ON v.user_id = u.id
      WHERE
        v.status = 'approved'
        OR v.user_id = ?
      ORDER BY
        v.created_at DESC
      `,
      [userId],
    );

    const formattedVideos = videos.map((video) => ({
      ...video,

      isOwner: Number(video.user_id) === userId,

      isFree: Number(video.price || 0) <= 0,

      isPaid: Number(video.price || 0) > 0,
    }));

    const myVideos = formattedVideos.filter((video) => video.isOwner);

    const approvedVideos = formattedVideos.filter(
      (video) => video.status === "approved",
    );

    return res.json({
      success: true,

      videos: formattedVideos,

      stats: {
        myVideos: myVideos.length,
        totalVideos: formattedVideos.length,
        approvedVideos: approvedVideos.length,
      },
    });
  } catch (error) {
    console.error("Dashboard videos error:", error);

    return res.status(500).json({
      success: false,
      message: "Gagal mengambil video dashboard.",
    });
  }
};

// ======================================================
// DELETE VIDEO
//
// USER:
// hanya boleh menghapus video miliknya sendiri
//
// ADMIN:
// boleh menghapus video siapa saja
//
// DATABASE:
// record video dihapus
//
// FILE:
// video + thumbnail ikut dihapus
// ======================================================

exports.deleteVideo = async (req, res) => {
  try {
    const videoId = req.params.id;

    // ==================================================
    // CEK ID
    // ==================================================

    if (!videoId) {
      return res.status(400).json({
        success: false,
        message: "ID video tidak valid.",
      });
    }

    // ==================================================
    // CARI VIDEO
    // ==================================================

    const [videos] = await db.promise().query(
      `
      SELECT
        id,
        user_id,
        title,
        video_file,
        thumbnail
      FROM videos
      WHERE id = ?
      LIMIT 1
      `,
      [videoId],
    );

    if (videos.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Video tidak ditemukan.",
      });
    }

    const video = videos[0];

    // ==================================================
    // CEK USER
    // ==================================================

    const currentUserId = Number(req.user.id);

    const videoOwnerId = Number(video.user_id);

    const isAdmin = req.user.role === "admin";

    const isOwner = currentUserId === videoOwnerId;

    // ==================================================
    // USER BIASA HANYA BOLEH HAPUS VIDEO SENDIRI
    // ADMIN BOLEH HAPUS SEMUA VIDEO
    // ==================================================

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "Kamu tidak memiliki izin untuk menghapus video ini.",
      });
    }

    // ==================================================
    // HAPUS DATABASE
    // ==================================================

    await db.promise().query(
      `
      DELETE FROM videos
      WHERE id = ?
      `,
      [videoId],
    );

    // ==================================================
    // HAPUS FILE VIDEO
    // ==================================================

    if (video.video_file) {
      const videoPath = path.join(
        __dirname,
        "../uploads/videos",
        video.video_file,
      );

      if (fs.existsSync(videoPath)) {
        try {
          fs.unlinkSync(videoPath);

          console.log("Video file dihapus:", videoPath);
        } catch (fileError) {
          console.error("Gagal menghapus video file:", fileError);
        }
      } else {
        console.log("File video tidak ditemukan:", videoPath);
      }
    }

    // ==================================================
    // HAPUS THUMBNAIL
    // ==================================================

    if (video.thumbnail) {
      const thumbnailPath = path.join(
        __dirname,
        "../uploads/thumbnails",
        video.thumbnail,
      );

      if (fs.existsSync(thumbnailPath)) {
        try {
          fs.unlinkSync(thumbnailPath);

          console.log("Thumbnail dihapus:", thumbnailPath);
        } catch (fileError) {
          console.error("Gagal menghapus thumbnail:", fileError);
        }
      } else {
        console.log("Thumbnail tidak ditemukan:", thumbnailPath);
      }
    }

    // ==================================================
    // RESPONSE
    // ==================================================

    return res.json({
      success: true,

      message: isAdmin
        ? "Video berhasil dihapus oleh admin."
        : "Video kamu berhasil dihapus.",
    });
  } catch (error) {
    console.error("Delete video error:", error);

    return res.status(500).json({
      success: false,
      message: "Gagal menghapus video.",
    });
  }
};

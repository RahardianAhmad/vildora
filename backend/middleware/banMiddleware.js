const db = require("../config/database.js");

const banMiddleware = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "User tidak ditemukan.",
      });
    }

    const [users] = await db.query(
      `
      SELECT
        id,
        username,
        email,
        role,
        is_banned,
        banned_until,
        ban_reason
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [req.user.id],
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Akun tidak ditemukan.",
      });
    }

    const user = users[0];

    // ==================================================
    // TIDAK DIBANNED
    // ==================================================

    if (!user.is_banned) {
      return next();
    }

    // ==================================================
    // BAN PERMANEN
    // ==================================================

    if (!user.banned_until) {
      return res.status(403).json({
        success: false,
        banned: true,
        permanent: true,
        message: "Akun kamu telah dibanned secara permanen.",
        reason: user.ban_reason || "Tidak ada alasan.",
      });
    }

    // ==================================================
    // CEK WAKTU BAN
    // ==================================================

    const now = new Date();
    const bannedUntil = new Date(user.banned_until);

    // Ban sudah selesai
    if (now >= bannedUntil) {
      await db.query(
        `
        UPDATE users
        SET
          is_banned = 0,
          banned_until = NULL,
          ban_reason = NULL
        WHERE id = ?
        `,
        [user.id],
      );

      return next();
    }

    // ==================================================
    // MASIH DIBANNED
    // ==================================================

    return res.status(403).json({
      success: false,
      banned: true,
      permanent: false,
      bannedUntil: user.banned_until,
      message: "Akun kamu sedang dibanned.",
      reason: user.ban_reason || "Tidak ada alasan.",
    });
  } catch (error) {
    console.error("BAN MIDDLEWARE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Gagal memeriksa status akun.",
    });
  }
};

module.exports = banMiddleware;

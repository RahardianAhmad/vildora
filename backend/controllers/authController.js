const db = require("../config/database");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ============================
// REGISTER
// ============================

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validasi
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email dan password wajib diisi",
      });
    }

    // Cek email
    const [existingUser] = await db
      .promise()
      .query("SELECT id FROM users WHERE email = ?", [email]);

    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Email sudah terdaftar",
      });
    }

    // Cek username
    const [existingUsername] = await db
      .promise()
      .query("SELECT id FROM users WHERE username = ?", [username]);

    if (existingUsername.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Username sudah digunakan",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Simpan user
    const [result] = await db.promise().query(
      `INSERT INTO users
            (username, email, password, role)
            VALUES (?, ?, ?, 'user')`,
      [username, email, hashedPassword],
    );

    res.status(201).json({
      success: true,
      message: "Registrasi berhasil",
      user: {
        id: result.insertId,
        username,
        email,
        role: "user",
      },
    });
  } catch (error) {
    console.error("Register error:", error);

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server",
    });
  }
};

// ============================
// LOGIN
// ============================

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validasi
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email dan password wajib diisi",
      });
    }

    // Cari user
    const [users] = await db
      .promise()
      .query("SELECT * FROM users WHERE email = ?", [email]);

    // User tidak ditemukan
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Email atau password salah",
      });
    }

    const user = users[0];

    // Cek password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Email atau password salah",
      });
    }

    // Buat JWT
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );

    res.json({
      success: true,

      message: "Login berhasil",

      token,

      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server",
    });
  }
};

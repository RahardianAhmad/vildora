require("dotenv").config();

const db = require("./config/database");
const bcrypt = require("bcryptjs");

async function createAdmin() {
  try {
    const username = "admin";
    const email = "admin@vidora.com";
    const password = "admin123";

    // Cek apakah admin sudah ada
    const [existing] = await db
      .promise()
      .query("SELECT id FROM users WHERE email = ?", [email]);

    if (existing.length > 0) {
      console.log("Admin sudah ada.");
      process.exit();
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert admin
    await db.promise().query(
      `INSERT INTO users
            (username, email, password, role)
            VALUES (?, ?, ?, 'admin')`,
      [username, email, hashedPassword],
    );

    console.log("=================================");
    console.log("ADMIN BERHASIL DIBUAT");
    console.log("Username : admin");
    console.log("Email    : admin@vidora.com");
    console.log("Password : admin123");
    console.log("Role     : admin");
    console.log("=================================");

    process.exit();
  } catch (error) {
    console.error("Gagal membuat admin:", error);

    process.exit(1);
  }
}

createAdmin();

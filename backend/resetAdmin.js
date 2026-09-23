require("dotenv").config();

const db = require("./config/database");
const bcrypt = require("bcryptjs");

async function resetAdmin() {
  try {
    const username = "admin";
    const email = "admin@gmail.com";
    const password = "admin111";

    const hashedPassword = await bcrypt.hash(password, 10);

    // Cari berdasarkan username
    const [users] = await db
      .promise()
      .query("SELECT id FROM users WHERE username = ?", [username]);

    if (users.length === 0) {
      console.log("User admin tidak ditemukan.");
      process.exit(1);
    }

    const adminId = users[0].id;

    // Update akun admin
    await db.promise().query(
      `UPDATE users
             SET email = ?,
                 password = ?,
                 role = 'admin'
             WHERE id = ?`,
      [email, hashedPassword, adminId],
    );

    console.log("================================");
    console.log("ADMIN BERHASIL DI-RESET");
    console.log("================================");
    console.log("Username :", username);
    console.log("Email    :", email);
    console.log("Password :", password);
    console.log("Role     : admin");
    console.log("================================");

    process.exit(0);
  } catch (error) {
    console.error("GAGAL:", error);
    process.exit(1);
  }
}

resetAdmin();

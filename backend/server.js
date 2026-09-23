require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

// ======================================================
// ROUTES
// ======================================================

const authRoutes = require("./routes/authRoutes");
const videoRoutes = require("./routes/videoRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

// ======================================================
// MIDDLEWARE
// ======================================================

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Membaca JSON
app.use(express.json());

// Membaca form-urlencoded
app.use(
  express.urlencoded({
    extended: true,
  }),
);

// ======================================================
// STATIC UPLOADS
// ======================================================

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ======================================================
// API ROUTES
// ======================================================

// Authentication
app.use("/api/auth", authRoutes);

// Video
app.use("/api/videos", videoRoutes);

// Payment / Purchasing
app.use("/api/payments", paymentRoutes);

// ======================================================
// TEST API
// ======================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "VIDORA API berjalan",
  });
});

// ======================================================
// TEST PAYMENT API
// ======================================================

app.get("/api/payment-test", (req, res) => {
  res.json({
    success: true,
    message: "Payment API berjalan",
  });
});

// ======================================================
// 404 HANDLER
// ======================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint tidak ditemukan.",
    path: req.originalUrl,
  });
});

// ======================================================
// ERROR HANDLER
// ======================================================

app.use((err, req, res, next) => {
  console.error("================================");
  console.error("SERVER ERROR");
  console.error(err);
  console.error("================================");

  // Error dari middleware/upload
  if (err.message) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  return res.status(500).json({
    success: false,
    message: "Terjadi kesalahan server.",
  });
});

// ======================================================
// SERVER
// ======================================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("================================");
  console.log("       VIDORA BACKEND");
  console.log("================================");
  console.log(`Server berjalan di port ${PORT}`);
  console.log(`Payment : /api/payments`);
  console.log("================================");
});

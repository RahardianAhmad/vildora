const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  createPayment,
  handleNotification,
  checkPurchase,
  getMyPurchases,
} = require("../controllers/paymentController");

// Membuat pembayaran
router.post("/create", authMiddleware, createPayment);

// Webhook Midtrans
router.post("/notification", handleNotification);

// Cek pembelian
router.get("/check/:videoId", authMiddleware, checkPurchase);

// Pembelian saya
router.get("/my", authMiddleware, getMyPurchases);

module.exports = router;

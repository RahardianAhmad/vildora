const midtransClient = require("midtrans-client");
const crypto = require("crypto");
const db = require("../config/database");

// =====================================================
// MIDTRANS CONFIGURATION
// =====================================================

const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";

const serverKey = process.env.MIDTRANS_SERVER_KEY;
const clientKey = process.env.MIDTRANS_CLIENT_KEY;

// =====================================================
// DEBUG CONFIGURATION
// =====================================================

console.log("================================");
console.log("MIDTRANS CONFIGURATION");
console.log("================================");

console.log("Environment :", isProduction ? "PRODUCTION" : "SANDBOX");

console.log("Server Key  :", serverKey ? "TERISI" : "KOSONG");

console.log("Client Key  :", clientKey ? "TERISI" : "KOSONG");

// Jangan pernah print key lengkap
console.log(
  "Server Prefix:",
  serverKey ? serverKey.substring(0, 10) + "..." : "KOSONG",
);

console.log(
  "Client Prefix:",
  clientKey ? clientKey.substring(0, 10) + "..." : "KOSONG",
);

console.log("Server Length:", serverKey ? serverKey.length : 0);

console.log("Client Length:", clientKey ? clientKey.length : 0);

console.log("================================");

// =====================================================
// MIDTRANS SNAP
// =====================================================

const snap = new midtransClient.Snap({
  isProduction: isProduction,
  serverKey: serverKey,
  clientKey: clientKey,
});

// =====================================================
// CREATE PAYMENT
// POST /api/payments/create
// =====================================================

exports.createPayment = async (req, res) => {
  try {
    // -------------------------------------------------
    // 1. CEK LOGIN
    // -------------------------------------------------

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Kamu harus login terlebih dahulu.",
      });
    }

    const userId = req.user.id;
    const { video_id } = req.body;

    // -------------------------------------------------
    // 2. VALIDASI VIDEO ID
    // -------------------------------------------------

    if (!video_id) {
      return res.status(400).json({
        success: false,
        message: "video_id wajib diisi.",
      });
    }

    // -------------------------------------------------
    // 3. VALIDASI MIDTRANS
    // -------------------------------------------------

    if (!serverKey || !clientKey) {
      console.error("MIDTRANS SERVER KEY / CLIENT KEY KOSONG");

      return res.status(500).json({
        success: false,
        message: "Konfigurasi Midtrans belum lengkap.",
      });
    }

    // -------------------------------------------------
    // 4. AMBIL VIDEO
    // -------------------------------------------------

    const [videos] = await db.promise().query(
      `
        SELECT
          v.id,
          v.user_id,
          v.title,
          v.description,
          v.price,
          v.status,
          u.username,
          u.email
        FROM videos v
        INNER JOIN users u
          ON v.user_id = u.id
        WHERE v.id = ?
          AND v.status = 'approved'
        LIMIT 1
      `,
      [video_id],
    );

    if (videos.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Video tidak ditemukan atau belum diapprove.",
      });
    }

    const video = videos[0];

    // -------------------------------------------------
    // 5. CEK HARGA
    // -------------------------------------------------

    const price = Number(video.price);

    if (!Number.isFinite(price) || price <= 0) {
      return res.status(400).json({
        success: false,
        message: "Video ini gratis dan tidak perlu dibeli.",
      });
    }

    // -------------------------------------------------
    // 6. PEMILIK TIDAK PERLU MEMBELI
    // -------------------------------------------------

    if (Number(video.user_id) === Number(userId)) {
      return res.status(400).json({
        success: false,
        message: "Kamu tidak perlu membeli video milik sendiri.",
      });
    }

    // -------------------------------------------------
    // 7. CEK PURCHASE SEBELUMNYA
    // -------------------------------------------------

    const [existingPurchase] = await db.promise().query(
      `
          SELECT
            id,
            status,
            price
          FROM purchases
          WHERE user_id = ?
            AND video_id = ?
          LIMIT 1
        `,
      [userId, video_id],
    );

    // -------------------------------------------------
    // SUDAH PAID
    // -------------------------------------------------

    if (existingPurchase.length > 0 && existingPurchase[0].status === "paid") {
      return res.status(400).json({
        success: false,
        alreadyPaid: true,
        message: "Video ini sudah kamu beli.",
      });
    }

    // -------------------------------------------------
    // 8. BUAT / UPDATE PURCHASE
    // -------------------------------------------------

    let purchaseId;

    if (existingPurchase.length > 0) {
      purchaseId = existingPurchase[0].id;

      await db.promise().query(
        `
          UPDATE purchases
          SET
            price = ?,
            status = 'pending'
          WHERE id = ?
        `,
        [price, purchaseId],
      );
    } else {
      const [purchaseResult] = await db.promise().query(
        `
            INSERT INTO purchases
            (
              user_id,
              video_id,
              price,
              status
            )
            VALUES (?, ?, ?, 'pending')
          `,
        [userId, video_id, price],
      );

      purchaseId = purchaseResult.insertId;
    }

    // -------------------------------------------------
    // 9. ORDER ID
    // -------------------------------------------------

    const orderId = `VIDORA-${purchaseId}-${Date.now()}`;

    // -------------------------------------------------
    // 10. DATA CUSTOMER
    // -------------------------------------------------

    const customerName = String(video.username || "VIDORA User").substring(
      0,
      50,
    );

    const customerEmail = video.email || "user@vidora.local";

    // -------------------------------------------------
    // 11. PARAMETER MIDTRANS SNAP
    // -------------------------------------------------

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: price,
      },

      // ------------------------------------------------
      // JANGAN MENGISI enabled_payments
      // ------------------------------------------------
      // Dengan tidak mengisi enabled_payments,
      // Midtrans akan menggunakan payment method
      // yang aktif pada Snap Preferences Dashboard.
      //
      // Jadi metode aktif seperti:
      // - GoPay
      // - Virtual Account
      // - Card
      // - ShopeePay
      // - OVO
      // - DANA
      // - QRIS
      // akan mengikuti konfigurasi Sandbox Midtrans.
      // ------------------------------------------------

      item_details: [
        {
          id: String(video.id),
          price: price,
          quantity: 1,
          name: String(video.title || "VIDORA Video").substring(0, 50),
        },
      ],

      customer_details: {
        first_name: customerName,
        email: customerEmail,
      },

      callbacks: {
        finish: `${
          process.env.FRONTEND_URL || "http://localhost:5173"
        }/watch/${video.id}`,
      },
    };

    // -------------------------------------------------
    // 12. LOG TRANSAKSI
    // -------------------------------------------------

    console.log("================================");
    console.log("CREATE MIDTRANS TRANSACTION");
    console.log("================================");

    console.log("Order ID :", orderId);
    console.log("Video ID :", video.id);
    console.log("Price    :", price);
    console.log("Mode     :", isProduction ? "PRODUCTION" : "SANDBOX");

    console.log("Payment  :", "Mengikuti Snap Preferences Midtrans");

    console.log("================================");

    // -------------------------------------------------
    // 13. CREATE SNAP TRANSACTION
    // -------------------------------------------------

    const transaction = await snap.createTransaction(parameter);

    // -------------------------------------------------
    // 14. VALIDASI TOKEN
    // -------------------------------------------------

    if (!transaction) {
      throw new Error("Response Midtrans kosong.");
    }

    if (!transaction.token) {
      console.error("MIDTRANS RESPONSE:", transaction);

      throw new Error("Snap Token tidak diterima dari Midtrans.");
    }

    // -------------------------------------------------
    // 15. SIMPAN PAYMENT
    // -------------------------------------------------

    await db.promise().query(
      `
        INSERT INTO payments
        (
          purchase_id,
          transaction_id,
          payment_method,
          amount,
          status
        )
        VALUES (?, ?, ?, ?, 'pending')
      `,
      [purchaseId, orderId, "midtrans", price],
    );

    // -------------------------------------------------
    // 16. RESPONSE KE FRONTEND
    // -------------------------------------------------

    return res.status(200).json({
      success: true,
      message: "Transaksi berhasil dibuat.",

      purchaseId: purchaseId,

      orderId: orderId,

      snapToken: transaction.token,

      redirectUrl: transaction.redirect_url || null,
    });
  } catch (error) {
    console.error("================================");
    console.error("CREATE PAYMENT ERROR");
    console.error("================================");

    console.error("Name:", error.name);
    console.error("Message:", error.message);
    console.error("Status:", error.httpStatusCode || "-");

    if (error.ApiResponse) {
      console.error("API Response:", error.ApiResponse);
    }

    console.error("================================");

    return res.status(500).json({
      success: false,
      message: "Gagal membuat pembayaran.",

      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// =====================================================
// MIDTRANS NOTIFICATION / WEBHOOK
// POST /api/payments/notification
// =====================================================

exports.handleNotification = async (req, res) => {
  try {
    const notification = req.body;

    console.log("================================");
    console.log("MIDTRANS NOTIFICATION");
    console.log("================================");

    console.log(notification);

    console.log("================================");

    const {
      order_id,
      transaction_status,
      fraud_status,
      status_code,
      gross_amount,
      signature_key,
      transaction_id,
      payment_type,
    } = notification;

    // -------------------------------------------------
    // 1. VALIDASI ORDER ID
    // -------------------------------------------------

    if (!order_id) {
      return res.status(400).json({
        success: false,
        message: "order_id tidak ditemukan.",
      });
    }

    // -------------------------------------------------
    // 2. VALIDASI SIGNATURE
    // -------------------------------------------------

    const notificationServerKey = process.env.MIDTRANS_SERVER_KEY;

    if (!notificationServerKey) {
      console.error("MIDTRANS_SERVER_KEY KOSONG");

      return res.status(500).json({
        success: false,
        message: "MIDTRANS_SERVER_KEY belum dikonfigurasi.",
      });
    }

    const signatureString =
      order_id + status_code + gross_amount + notificationServerKey;

    const calculatedSignature = crypto
      .createHash("sha512")
      .update(signatureString)
      .digest("hex");

    if (!signature_key || calculatedSignature !== signature_key) {
      console.error("INVALID MIDTRANS SIGNATURE");

      return res.status(403).json({
        success: false,
        message: "Signature Midtrans tidak valid.",
      });
    }

    // -------------------------------------------------
    // 3. CARI PAYMENT
    // -------------------------------------------------

    const [payments] = await db.promise().query(
      `
          SELECT
            p.id AS payment_id,
            p.purchase_id,
            p.status AS payment_status,
            p.amount,
            pu.user_id,
            pu.video_id
          FROM payments p
          INNER JOIN purchases pu
            ON p.purchase_id = pu.id
          WHERE p.transaction_id = ?
          LIMIT 1
        `,
      [order_id],
    );

    if (payments.length === 0) {
      console.error("PAYMENT TIDAK DITEMUKAN:", order_id);

      return res.status(404).json({
        success: false,
        message: "Payment tidak ditemukan.",
      });
    }

    const payment = payments[0];

    // -------------------------------------------------
    // 4. VALIDASI JUMLAH PEMBAYARAN
    // -------------------------------------------------

    if (Number(payment.amount) !== Number(gross_amount)) {
      console.error("JUMLAH PEMBAYARAN TIDAK SESUAI");

      return res.status(400).json({
        success: false,
        message: "Jumlah pembayaran tidak sesuai.",
      });
    }

    // =================================================
    // 5. SETTLEMENT / SUCCESS
    // =================================================

    if (
      transaction_status === "settlement" ||
      (transaction_status === "capture" && fraud_status === "accept")
    ) {
      // Purchase -> PAID

      await db.promise().query(
        `
          UPDATE purchases
          SET status = 'paid'
          WHERE id = ?
        `,
        [payment.purchase_id],
      );

      // Payment -> SUCCESS

      await db.promise().query(
        `
          UPDATE payments
          SET
            status = 'success',
            transaction_id = ?,
            payment_method = ?,
            paid_at = NOW()
          WHERE id = ?
        `,
        [
          transaction_id || order_id,
          payment_type || "midtrans",
          payment.payment_id,
        ],
      );

      console.log("================================");
      console.log("PAYMENT SUCCESS");
      console.log("Purchase:", payment.purchase_id);
      console.log("Video:", payment.video_id);
      console.log("Method:", payment_type || "midtrans");
      console.log("================================");
    }

    // =================================================
    // 6. PENDING
    // =================================================
    else if (transaction_status === "pending") {
      await db.promise().query(
        `
          UPDATE purchases
          SET status = 'pending'
          WHERE id = ?
        `,
        [payment.purchase_id],
      );

      await db.promise().query(
        `
          UPDATE payments
          SET
            status = 'pending',
            payment_method = ?
          WHERE id = ?
        `,
        [payment_type || "midtrans", payment.payment_id],
      );

      console.log("PAYMENT PENDING:", payment.purchase_id);

      console.log("METHOD:", payment_type || "midtrans");
    }

    // =================================================
    // 7. EXPIRE
    // =================================================
    else if (transaction_status === "expire") {
      await db.promise().query(
        `
          UPDATE purchases
          SET status = 'cancelled'
          WHERE id = ?
        `,
        [payment.purchase_id],
      );

      await db.promise().query(
        `
          UPDATE payments
          SET status = 'expired'
          WHERE id = ?
        `,
        [payment.payment_id],
      );

      console.log("PAYMENT EXPIRED:", payment.purchase_id);
    }

    // =================================================
    // 8. CANCEL
    // =================================================
    else if (transaction_status === "cancel") {
      await db.promise().query(
        `
          UPDATE purchases
          SET status = 'cancelled'
          WHERE id = ?
        `,
        [payment.purchase_id],
      );

      await db.promise().query(
        `
          UPDATE payments
          SET status = 'failed'
          WHERE id = ?
        `,
        [payment.payment_id],
      );

      console.log("PAYMENT CANCELLED:", payment.purchase_id);
    }

    // =================================================
    // 9. DENY
    // =================================================
    else if (transaction_status === "deny") {
      await db.promise().query(
        `
          UPDATE purchases
          SET status = 'cancelled'
          WHERE id = ?
        `,
        [payment.purchase_id],
      );

      await db.promise().query(
        `
          UPDATE payments
          SET status = 'failed'
          WHERE id = ?
        `,
        [payment.payment_id],
      );

      console.log("PAYMENT DENIED:", payment.purchase_id);
    }

    // -------------------------------------------------
    // 10. RESPONSE MIDTRANS
    // -------------------------------------------------

    return res.status(200).json({
      success: true,
      message: "Notification berhasil diproses.",
    });
  } catch (error) {
    console.error("================================");
    console.error("MIDTRANS NOTIFICATION ERROR");
    console.error("================================");

    console.error(error);

    console.error("================================");

    return res.status(500).json({
      success: false,
      message: "Gagal memproses notification.",
    });
  }
};

// =====================================================
// CHECK PURCHASE
// GET /api/payments/check/:videoId
// =====================================================

exports.checkPurchase = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Kamu harus login terlebih dahulu.",
      });
    }

    const userId = req.user.id;
    const videoId = req.params.videoId;

    const [rows] = await db.promise().query(
      `
          SELECT
            id,
            user_id,
            video_id,
            price,
            status,
            purchased_at
          FROM purchases
          WHERE user_id = ?
            AND video_id = ?
            AND status = 'paid'
          LIMIT 1
        `,
      [userId, videoId],
    );

    return res.json({
      success: true,

      purchased: rows.length > 0,

      purchase: rows.length > 0 ? rows[0] : null,
    });
  } catch (error) {
    console.error("CHECK PURCHASE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Gagal mengecek pembelian.",
    });
  }
};

// =====================================================
// MY PURCHASES
// GET /api/payments/my
// =====================================================

exports.getMyPurchases = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Kamu harus login terlebih dahulu.",
      });
    }

    const userId = req.user.id;

    const [rows] = await db.promise().query(
      `
          SELECT
            p.id AS purchase_id,
            p.price,
            p.status AS purchase_status,
            p.purchased_at,

            v.id AS video_id,
            v.title,
            v.description,
            v.video_file,
            v.thumbnail,
            v.views,

            u.username AS uploader

          FROM purchases p

          INNER JOIN videos v
            ON p.video_id = v.id

          INNER JOIN users u
            ON v.user_id = u.id

          WHERE p.user_id = ?

          ORDER BY
            p.purchased_at DESC
        `,
      [userId],
    );

    return res.json({
      success: true,
      purchases: rows,
    });
  } catch (error) {
    console.error("GET PURCHASES ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Gagal mengambil pembelian.",
    });
  }
};

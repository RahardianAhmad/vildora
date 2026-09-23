require("dotenv").config();

const https = require("https");

const serverKey = process.env.MIDTRANS_SERVER_KEY;

console.log("================================");
console.log("TEST MIDTRANS PRODUCTION");
console.log("================================");
console.log("Environment :", process.env.MIDTRANS_IS_PRODUCTION);
console.log("Server Key  :", serverKey ? "TERISI" : "KOSONG");
console.log(
  "Prefix      :",
  serverKey ? serverKey.substring(0, 10) + "..." : "-",
);
console.log("Length      :", serverKey ? serverKey.length : 0);
console.log("================================");

const auth = Buffer.from(`${serverKey}:`).toString("base64");

const data = JSON.stringify({
  transaction_details: {
    order_id: `TEST-VIDORA-${Date.now()}`,
    gross_amount: 500,
  },
});

const options = {
  hostname: "app.midtrans.com",
  path: "/snap/v1/transactions",
  method: "POST",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Basic ${auth}`,
    "Content-Length": Buffer.byteLength(data),
  },
};

const req = https.request(options, (res) => {
  let body = "";

  res.on("data", (chunk) => {
    body += chunk;
  });

  res.on("end", () => {
    console.log("HTTP STATUS :", res.statusCode);
    console.log("RESPONSE    :", body);
    console.log("================================");
  });
});

req.on("error", (error) => {
  console.error("REQUEST ERROR:", error);
});

req.write(data);
req.end();

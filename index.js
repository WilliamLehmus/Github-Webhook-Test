const express = require("express");
const bodyParser = require("body-parser");
const crypto = require("crypto");
require("dotenv").config();

const app = express();

// Use raw body parser to capture the raw body
app.use(express.raw({ type: "application/json" })); // Changed this line

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
console.log(WEBHOOK_SECRET);

app.post("/webhook", (req, res) => {
  // Verify that webhook secret is configured
  if (!WEBHOOK_SECRET) {
    console.error("WEBHOOK_SECRET is not configured");
    return res.status(500).send("Server is not configured properly");
  }

  // Get signature from header
  const signature = req.headers["x-hub-signature-256"];
  if (!signature) {
    console.error("No signature found in request");
    return res.status(401).send("No signature found");
  }

  // Verify signature
  const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET);
  const calculatedSignature = "sha256=" + hmac.update(req.body).digest("hex");

  try {
    const signatureValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(calculatedSignature)
    );

    if (signatureValid) {
      // Parse the raw body
      const payload = JSON.parse(req.body);
      console.log("Event:", req.headers["x-github-event"]);
      console.log("Payload:", payload);
      res.sendStatus(200);
    } else {
      console.error("Invalid signature");
      res.status(401).send("Invalid signature");
    }
  } catch (err) {
    console.error("Error processing webhook:", err);
    res.status(500).send("Error processing webhook");
  }
});

// Add a basic health check endpoint
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

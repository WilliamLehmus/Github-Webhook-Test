const express = require("express");
const bodyParser = require("body-parser");
const crypto = require("crypto"); // Add this for signature verification

const app = express();
// Use raw body parser to verify signature
app.use(
  bodyParser.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

// Store this securely in environment variables
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

app.post("/webhook", (req, res) => {
  const signature = req.headers["x-hub-signature-256"];
  if (!signature) {
    return res.status(401).send("No signature found");
  }

  // Verify signature
  const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET);
  const calculatedSignature =
    "sha256=" + hmac.update(req.rawBody).digest("hex");

  if (
    crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(calculatedSignature)
    )
  ) {
    // Process the webhook
    console.log("Event:", req.headers["x-github-event"]);
    console.log("Payload:", req.body);
    res.sendStatus(200);
  } else {
    res.status(401).send("Invalid signature");
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

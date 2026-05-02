const express = require("express");
const axios = require("axios");
const router = express.Router();

const PAYMONGO_BASE = "https://api.paymongo.com/v1";

function secretAuthHeader() {
  const key = process.env.PAYMONGO_SECRET_KEY;
  if (!key) throw new Error("PAYMONGO_SECRET_KEY is not set");
  return "Basic " + Buffer.from(key + ":").toString("base64");
}

/**
 * POST /api/payments/create-intent
 * Body: { amount: number (PHP), description: string }
 * Returns: { paymentIntentId, clientKey }
 */
router.post("/create-intent", async (req, res) => {
  try {
    const { amount, description } = req.body;

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const response = await axios.post(
      `${PAYMONGO_BASE}/payment_intents`,
      {
        data: {
          attributes: {
            amount: Math.round(amount * 100), // convert PHP to centavos
            currency: "PHP",
            payment_method_allowed: ["card"],
            payment_method_options: {
              card: { request_three_d_secure: "any" },
            },
            description: description || "DermAI Premium Subscription",
            capture_type: "automatic",
          },
        },
      },
      {
        headers: {
          Authorization: secretAuthHeader(),
          "Content-Type": "application/json",
        },
      }
    );

    const { id, attributes } = response.data.data;
    res.json({ paymentIntentId: id, clientKey: attributes.client_key });
  } catch (err) {
    const detail = err.response?.data?.errors?.[0]?.detail || err.message;
    res.status(500).json({ error: detail });
  }
});

/**
 * POST /api/payments/attach
 * Body: { paymentIntentId, paymentMethodId, clientKey, returnUrl }
 * Returns: PayMongo PaymentIntent object
 */
router.post("/attach", async (req, res) => {
  try {
    const { paymentIntentId, paymentMethodId, clientKey, returnUrl } = req.body;

    if (!paymentIntentId || !paymentMethodId || !clientKey || !returnUrl) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const response = await axios.post(
      `${PAYMONGO_BASE}/payment_intents/${paymentIntentId}/attach`,
      {
        data: {
          attributes: {
            payment_method: paymentMethodId,
            client_key: clientKey,
            return_url: returnUrl,
          },
        },
      },
      {
        headers: {
          Authorization: secretAuthHeader(),
          "Content-Type": "application/json",
        },
      }
    );

    res.json(response.data.data);
  } catch (err) {
    const detail = err.response?.data?.errors?.[0]?.detail || err.message;
    res.status(500).json({ error: detail });
  }
});

/**
 * GET /api/payments/intent/:id?client_key=...
 * Used to check payment status after 3DS redirect
 */
router.get("/intent/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { client_key } = req.query;

    if (!client_key) {
      return res.status(400).json({ error: "client_key is required" });
    }

    const response = await axios.get(
      `${PAYMONGO_BASE}/payment_intents/${id}?client_key=${encodeURIComponent(client_key)}`,
      { headers: { Authorization: secretAuthHeader() } }
    );

    res.json(response.data.data);
  } catch (err) {
    const detail = err.response?.data?.errors?.[0]?.detail || err.message;
    res.status(500).json({ error: detail });
  }
});

/**
 * POST /api/payments/webhook
 * PayMongo sends payment events here.
 * Register this URL in your PayMongo dashboard → Developers → Webhooks
 */
router.post("/webhook", (req, res) => {
  try {
    const signature = req.headers["paymongo-signature"];
    // TODO: Verify signature using PAYMONGO_WEBHOOK_SECRET
    // See: https://developers.paymongo.com/docs/webhook-signature-verification

    const event = JSON.parse(req.body);
    const eventType = event?.data?.attributes?.type;

    if (eventType === "payment.paid") {
      const payment = event.data.attributes.data;
      console.log("[Webhook] Payment confirmed:", payment.id, "Amount:", payment.attributes.amount / 100, "PHP");
      // TODO: Mark subscription active in your database using payment.attributes.description or metadata
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("[Webhook] Error:", err.message);
    res.sendStatus(400);
  }
});

module.exports = router;

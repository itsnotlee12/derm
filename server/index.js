require("dotenv").config();
const express = require("express");
const cors = require("cors");
const paymentsRouter = require("./routes/payments");

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:5173").split(",");

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

// Raw body needed for webhook signature verification — mount before json()
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));
app.use(express.json());

app.use("/api/payments", paymentsRouter);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  console.log(`DermAI server running on port ${PORT}`);
});

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const registrationRoutes = require("./routes/registration");
const adminRoutes = require("./routes/admin");
const publicRoutes = require("./routes/public");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

if (process.env.TRUST_PROXY === "true") app.set("trust proxy", 1);

// Allowed frontend origins: localhost dev ports + CLIENT_URL (comma separated, or "*")
const clientUrls = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map((o) => o.trim()).filter(Boolean)
  : [];
const allowAll = clientUrls.includes("*");
const allowedOrigins = ["http://localhost:5173", "http://localhost:3000", ...clientUrls];

app.use(
  cors({
    origin(origin, callback) {
      // No origin = Postman, curl, server-to-server
      if (!origin || allowAll || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Origin not allowed by CORS"));
    },
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Content-Disposition"],
  })
);

app.use(helmet());
app.use(express.json({ limit: "50kb" }));

app.get("/", (req, res) => {
  res.json({ status: "ok", service: "registration-backend" });
});

app.use("/api/registration", registrationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/public", publicRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;

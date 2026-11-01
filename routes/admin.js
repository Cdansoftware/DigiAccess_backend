const router = require("express").Router();
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

// Very small brute-force guard: 10 wrong passwords per IP, then 15 minutes wait.
const MAX_FAILED = 10;
const WINDOW_MS = 15 * 60 * 1000;
const failed = new Map(); // ip -> { count, resetAt }

// Compares in constant time so the response time never leaks the password
function safeEqual(a, b) {
  const ha = crypto.createHash("sha256").update(String(a)).digest();
  const hb = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

// ADMIN LOGIN  ->  POST /api/admin/login
// Body: { password }   Returns: { token }
router.post("/login", (req, res) => {
  const now = Date.now();
  const entry = failed.get(req.ip);
  const blocked = entry && entry.resetAt > now && entry.count >= MAX_FAILED;

  if (blocked) {
    return res.status(429).json({
      message: "Too many wrong attempts. Please try again after 15 minutes.",
    });
  }

  const { password } = req.body || {};
  const ok =
    typeof password === "string" && safeEqual(password, process.env.ADMIN_PASSWORD);

  if (!ok) {
    const current =
      entry && entry.resetAt > now ? entry : { count: 0, resetAt: now + WINDOW_MS };
    current.count += 1;
    failed.set(req.ip, current);
    return res.status(401).json({ message: "Incorrect admin password" });
  }

  failed.delete(req.ip);

  const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "12h",
  });

  return res.status(200).json({ token });
});

module.exports = router;

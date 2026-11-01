const jwt = require("jsonwebtoken");

// Lets a request through only if it carries a valid admin token:
//   Authorization: Bearer <token>
exports.requireAdmin = (req, res, next) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Admin login required" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
    if (payload.role !== "admin") throw new Error("not an admin token");
    req.admin = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

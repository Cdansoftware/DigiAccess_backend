require("dotenv").config();

const connectDB = require("./config/db");
const Registration = require("./models/Registration");
const app = require("./app");

for (const name of ["MONGO_URI", "ADMIN_PASSWORD", "JWT_SECRET"]) {
  if (!process.env[name]) {
    console.error(`Missing environment variable: ${name}`);
    process.exit(1);
  }
}
if (process.env.JWT_SECRET.length < 16) {
  console.error("JWT_SECRET is too short. Use a long random string (16+ characters).");
  process.exit(1);
}

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await connectDB();
    await Registration.init(); // makes sure the unique schoolEmail index exists
    app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();

const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const apiResponse = require("./helpers/apiResponse");
const cors = require("cors");
const path = require("path");
const script = require("./routes/script");
const tts = require("./routes/tts");
const video = require("./routes/video");
const reelRoutes = require("./routes/reels");
dotenv.config();
// connectDB();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return apiResponse.errorResponse(res, "Invalid JSON format", 400);
  }
  next();
});
app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/api/script", script);
app.use("/api/tts", tts);
app.use("/api/video", video);
app.use("/api/generate", reelRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on ${PORT}`);
});

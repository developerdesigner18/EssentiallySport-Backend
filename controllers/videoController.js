const path = require("path");
const fs = require("fs");
const axios = require("axios");
const fileType = require("file-type");
require("dotenv").config();

const { generateVideo } = require("../utils/ffmpegHelper");
const {
  successResponseWithData,
  errorResponse,
} = require("../helpers/apiResponse");
const uploadToImageKit = require("../utils/uploadToImageKit");

const IMAGE_CACHE_DIR = path.join(__dirname, "../cache/images");
const TEMP_DIR = path.join(__dirname, "../temp");
const FALLBACK_IMAGE = path.join(__dirname, "../public/fallbacks/default.jpg");


const GOOGLE_API_KEY = process.env.GOOGLE_SEARCH_API_KEY;
const GOOGLE_CX = process.env.GOOGLE_CX;


async function fetchGoogleImage(query) {
  const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(
    query
  )}&searchType=image&cx=${GOOGLE_CX}&key=${GOOGLE_API_KEY}&num=1`;

  const response = await axios.get(url, { timeout: 10000 });
  const imageUrl = response.data?.items?.[0]?.link;
  return imageUrl;
}


exports.createVideo = async (req, res) => {
  const { celebrity, ttsUrl } = req.body;

  if (!celebrity || !ttsUrl) {
    return errorResponse(res, "celebrity and ttsUrl are required", 400);
  }

  if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });
  if (!fs.existsSync(IMAGE_CACHE_DIR))
    fs.mkdirSync(IMAGE_CACHE_DIR, { recursive: true });

  const timestamp = Date.now();
  const imageFileName = `${celebrity.replace(/\s+/g, "_").toLowerCase()}.jpg`;
  const cachedImagePath = path.join(IMAGE_CACHE_DIR, imageFileName);
  const tempImagePath = path.join(TEMP_DIR, `image_${timestamp}.jpg`);
  const audioPath = path.join(TEMP_DIR, `audio_${timestamp}.mp3`);
  const videoPath = path.join(TEMP_DIR, `video_${timestamp}.mp4`);

  try {
    try {
      const imageUrl = await fetchGoogleImage(celebrity);

      if (!imageUrl) throw new Error("No image found from Google");

      await downloadImageFile(imageUrl, tempImagePath);

      const downloadedValid = await isValidImage(tempImagePath);
      if (downloadedValid) {
        fs.copyFileSync(tempImagePath, cachedImagePath);
      } else {
        throw new Error("Downloaded image is invalid");
      }
    } catch (err) {
      console.warn("Google image fetch failed. Using fallback.", err.message);
      fs.copyFileSync(FALLBACK_IMAGE, tempImagePath);
    }

    await downloadFile(ttsUrl, audioPath);

    await generateVideo({
      imagePath: tempImagePath,
      audioPath,
      outputPath: videoPath,
    });

    const uploadRes = await uploadToImageKit(
      videoPath,
      path.basename(videoPath),
      "/generated-videos"
    );

    return successResponseWithData(res, "Video generated and uploaded", {
      videoUrl: uploadRes.url,
      fileId: uploadRes.fileId,
    });
  } catch (err) {
    console.error("Video generation error:", err);
    return errorResponse(res, "Failed to create video", 500);
  } finally {
    [audioPath, videoPath].forEach((file) => {
      if (file && fs.existsSync(file)) fs.unlinkSync(file);
    });
    fs.readdirSync(TEMP_DIR)
      .filter((file) => file.startsWith("image_"))
      .forEach((file) => fs.unlinkSync(path.join(TEMP_DIR, file)));
  }
};

async function isValidImage(filePath) {
  if (!fs.existsSync(filePath)) return false;
  try {
    const buffer = fs.readFileSync(filePath);
    const type = await fileType.fromBuffer(buffer);
    return type?.mime?.startsWith("image");
  } catch {
    return false;
  }
}

async function downloadImageFile(url, filePath) {
  const writer = fs.createWriteStream(filePath);
  const response = await axios({
    method: "GET",
    url,
    responseType: "stream",
    timeout: 10000,
  });

  const contentType = response.headers["content-type"];
  if (!contentType?.startsWith("image")) {
    writer.destroy();
    throw new Error(`Invalid content type: ${contentType}`);
  }

  return new Promise((resolve, reject) => {
    response.data.pipe(writer);
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

async function downloadFile(url, filePath) {
  const writer = fs.createWriteStream(filePath);
  const response = await axios({
    method: "GET",
    url,
    responseType: "stream",
    timeout: 10000,
  });

  return new Promise((resolve, reject) => {
    response.data.pipe(writer);
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

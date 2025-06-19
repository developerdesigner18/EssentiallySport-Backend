const path = require("path");
const fs = require("fs");
const axios = require("axios");
const fileType = require("file-type");
const util = require("util");

const togetherClient = require("../utils/togetherClient");
const googleTTSClient = require("../utils/googleTTSClient");
const uploadToImageKit = require("../utils/uploadToImageKit");
const { generateVideo } = require("../utils/ffmpegHelper");
const {
  successResponseWithData,
  errorResponse,
} = require("../helpers/apiResponse");

const IMAGE_CACHE_DIR = path.join(__dirname, "../cache/images");
const TEMP_DIR = path.join(__dirname, "../temp");
const FALLBACK_IMAGE = path.join(__dirname, "../public/fallbacks/default.jpg");

const GOOGLE_API_KEY = process.env.GOOGLE_SEARCH_API_KEY;
const GOOGLE_CX = process.env.GOOGLE_CX;

if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });
if (!fs.existsSync(IMAGE_CACHE_DIR))
  fs.mkdirSync(IMAGE_CACHE_DIR, { recursive: true });

exports.generateReel = async (req, res) => {
  const { celebrity } = req.body;
  if (!celebrity) return errorResponse(res, "celebrity is required", 400);

  const timestamp = Date.now();
  const audioPath = path.join(TEMP_DIR, `audio_${timestamp}.mp3`);
  const videoPath = path.join(TEMP_DIR, `video_${timestamp}.mp4`);
  const imagePaths = [];

  try {
    const prompt = `Create a short, engaging sports history script for ${celebrity}. Keep it under 100 words and in casual tone.`;
    const aiResponse = await togetherClient.generate(prompt);
    const script = aiResponse?.choices?.[0]?.text?.trim();

    if (!script) throw new Error("AI script generation failed");

    const ttsRequest = {
      input: { text: script },
      voice: { languageCode: "en-US", ssmlGender: "NEUTRAL" },
      audioConfig: { audioEncoding: "MP3" },
    };
    const [ttsResponse] = await googleTTSClient.synthesizeSpeech(ttsRequest);
    await util.promisify(fs.writeFile)(audioPath, ttsResponse.audioContent);

    for (let i = 0; i < 3; i++) {
      try {
        const imageUrl = await fetchGoogleImage(`${celebrity} ${i + 1}`);
        const tempImgPath = path.join(TEMP_DIR, `image_${timestamp}_${i}.jpg`);
        await downloadImageFile(imageUrl, tempImgPath);
        const isValid = await isValidImage(tempImgPath);
        if (!isValid) throw new Error("Invalid image");
        imagePaths.push(tempImgPath);
      } catch (err) {
        console.warn(`Image ${i + 1} fetch fallback:`, err.message);
        imagePaths.push(FALLBACK_IMAGE);
      }
    }

    await generateVideo({
      imagePaths,
      audioPath,
      outputPath: videoPath,
    });

    const uploadRes = await uploadToImageKit(
      videoPath,
      path.basename(videoPath),
      "/generated-videos"
    );

    return successResponseWithData(res, "Reel generated", {
      videoUrl: uploadRes.url,
      fileId: uploadRes.fileId,
    });
  } catch (err) {
    console.error("Reel generation error:", err);
    return errorResponse(res, "Failed to generate reel", 500);
  } finally {
    [...imagePaths, audioPath, videoPath].forEach((file) => {
      if (
        file &&
        fs.existsSync(file) &&
        path.resolve(file) !== path.resolve(FALLBACK_IMAGE)
      )
        fs.unlinkSync(file);
    });
    fs.readdirSync(TEMP_DIR)
      .filter((file) => file.startsWith("image_"))
      .forEach((file) => fs.unlinkSync(path.join(TEMP_DIR, file)));
  }
};

async function fetchGoogleImage(query) {
  const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(
    query
  )}&searchType=image&cx=${GOOGLE_CX}&key=${GOOGLE_API_KEY}&num=1`;
  const response = await axios.get(url, { timeout: 10000 });
  return response.data?.items?.[0]?.link;
}

async function isValidImage(filePath) {
  if (!fs.existsSync(filePath)) return false;
  try {
    const buffer = fs.readFileSync(filePath);
    const type = await fileType.fromBuffer(buffer);
    return type?.mime.startsWith("image");
  } catch {
    return false;
  }
}

async function downloadImageFile(url, filePath) {
  const writer = fs.createWriteStream(filePath);
  const response = await axios.get(url, {
    responseType: "stream",
    timeout: 10000,
  });

  const contentType = response.headers["content-type"];
  if (!contentType?.startsWith("image")) {
    writer.destroy();
    throw new Error(`Invalid content-type: ${contentType}`);
  }

  return new Promise((resolve, reject) => {
    response.data.pipe(writer);
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

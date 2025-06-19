const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const ffprobe = require("child_process").execSync;

const generateVideo = async ({ imagePaths, audioPath, outputPath }) => {
  try {
    const probeCmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`;
    const audioDurationStr = ffprobe(probeCmd).toString().trim();
    const audioDuration = parseFloat(audioDurationStr);

    if (!audioDuration || audioDuration <= 0) {
      throw new Error("Invalid audio duration");
    }

    const durationPerImage = audioDuration / imagePaths.length;

    const listFilePath = path.join(
      __dirname,
      `../temp/image_list_${Date.now()}.txt`
    );
    const concatList = imagePaths
      .map((imgPath) => {
        const safePath = imgPath.replace(/'/g, "'\\''");
        return `file '${safePath}'\nduration ${durationPerImage.toFixed(3)}`;
      })
      .join("\n");

    fs.writeFileSync(listFilePath, concatList);

    const cmd = `ffmpeg -y -f concat -safe 0 -i "${listFilePath}" -i "${audioPath}" \
-vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -shortest \
-c:v libx264 -pix_fmt yuv420p -tune stillimage -c:a aac -b:a 192k "${outputPath}"`;

    return new Promise((resolve, reject) => {
      exec(cmd, { maxBuffer: 1024 * 1024 * 10 }, (err, stdout, stderr) => {
        fs.unlinkSync(listFilePath);

        if (err) {
          console.error("FFmpeg error:", stderr);
          return reject(new Error("FFmpeg processing failed"));
        }

        resolve(outputPath);
      });
    });
  } catch (err) {
    console.error("generateVideo error:", err.message);
    throw err;
  }
};

module.exports = {
  generateVideo,
};

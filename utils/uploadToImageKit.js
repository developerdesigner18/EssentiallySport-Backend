const imageKit = require("./imageKitClient");
const fs = require("fs");

const uploadToImageKit = async (filePath, fileName, folder = "/tts-audios") => {
  const fileBuffer = fs.readFileSync(filePath);

  const result = await imageKit.upload({
    file: fileBuffer,
    fileName: fileName,
    folder: folder,
    useUniqueFileName: true,
  });

  return result;
};

module.exports = uploadToImageKit;

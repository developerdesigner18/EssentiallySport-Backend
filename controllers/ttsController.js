const fs = require("fs");
const path = require("path");
const client = require("../utils/googleTTSClient");
const uploadToImageKit = require("../utils/uploadToImageKit");
const apiResponse = require("../helpers/apiResponse");
const util = require("util");


exports.generateTTS = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return apiResponse.validationErrorWithData(res, "Text is required");
    }

    const request = {
      input: { text },
      voice: { languageCode: "en-US", ssmlGender: "NEUTRAL" },
      audioConfig: { audioEncoding: "MP3" },
    };

    const [response] = await client.synthesizeSpeech(request);

    const filename = `tts_${Date.now()}.mp3`;
    const outputPath = path.join(__dirname, `../public/${filename}`);
    const writeFile = util.promisify(fs.writeFile);
    await writeFile(outputPath, response.audioContent);

    const uploadResult = await uploadToImageKit(outputPath, filename);

    fs.unlinkSync(outputPath);

    return apiResponse.successResponseWithData(res, "TTS Audio generated", {
      audioUrl: uploadResult.url,
      fileId: uploadResult.fileId,
    });
  } catch (err) {
    console.error("TTS Error:", err);
    return apiResponse.errorResponse(res, "Failed to generate audio");
  }
};

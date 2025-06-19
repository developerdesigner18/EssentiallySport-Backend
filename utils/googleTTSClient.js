const textToSpeech = require("@google-cloud/text-to-speech");
const path = require("path");

const client = new textToSpeech.TextToSpeechClient({
  keyFilename: path.join(__dirname, "../config/google-tts-key.json"),
});

module.exports = client;

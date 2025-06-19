const togetherClient = require("../utils/togetherClient");
const apiResponse = require("../helpers/apiResponse");

exports.generateAIScript = async (req, res) => {
  const { celebrity } = req.body;

  try {
    const prompt = `Create a short, engaging sports history script for ${celebrity}. Keep it under 100 words and in casual tone.`;

    const aiResponse = await togetherClient.generate(prompt);

    const generatedText = aiResponse?.choices?.[0]?.text?.trim();

    if (!generatedText) {
      return apiResponse.errorResponse(res, "No script generated");
    }

    return apiResponse.successResponseWithData(res, "Script generated", {
      script: generatedText,
    });
  } catch (error) {
    console.error("Script Generation Error:", error.message);
    return apiResponse.errorResponse(res, "Failed to generate script");
  }
};

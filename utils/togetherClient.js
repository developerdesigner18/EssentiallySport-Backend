const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();

const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY;

exports.generate = async (prompt) => {
  const response = await axios.post(
    "https://api.together.xyz/inference",
    {
      model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
      prompt: prompt,
      max_tokens: 300,
      temperature: 0.7,
    },
    {
      headers: {
        Authorization: `Bearer ${TOGETHER_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  const result = response?.data || "No response.";
  return result;
};

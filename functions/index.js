// Force redeploy - 6 June 2025

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();

// โค้ดนี้ถูกเขียนในรูปแบบ 1st Gen โดยเฉพาะ
exports.callGemini = functions.https.onCall(async (data, context) => {
  // ตรวจสอบว่าผู้ใช้ล็อกอินแล้วหรือยัง
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  // ดึงค่า API Key จาก Function Configuration (วิธีแบบ 1st Gen)
  const apiKey = functions.config().gemini.key;
  if (!apiKey) {
      throw new functions.https.HttpsError(
          "internal",
          "Gemini API key is not configured."
      );
  }

  const prompt = data.prompt;
  if (!prompt) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "The function must be called with a 'prompt' argument."
    );
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

  try {
    const response = await axios.post(apiUrl, {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    return {
      text: response.data.candidates[0].content.parts[0].text,
    };
  } catch (error) {
    const errorMessage = error.response ? error.response.data.error.message : error.message;
    console.error("Error calling Gemini API:", errorMessage);
    throw new functions.https.HttpsError(
        "internal", 
        `Failed to call Gemini API. Reason: ${errorMessage}`
    );
  }
});
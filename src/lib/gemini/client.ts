import { GoogleGenAI } from "@google/genai";

let _client: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!_client) {
    // SDK 3.x defaults to v1; TTS (speechMetadata, voices) is documented on v1beta
    _client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY!, apiVersion: "v1beta" });
  }
  return _client;
}

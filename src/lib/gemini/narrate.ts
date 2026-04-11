import { getGeminiClient } from "./client";

function createWavHeader(pcmDataLength: number): Buffer {
  const sampleRate = 24000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const headerSize = 44;

  const header = Buffer.alloc(headerSize);

  // RIFF header
  header.write("RIFF", 0);
  header.writeUInt32LE(pcmDataLength + headerSize - 8, 4);
  header.write("WAVE", 8);

  // fmt sub-chunk
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // sub-chunk size
  header.writeUInt16LE(1, 20); // PCM format
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);

  // data sub-chunk
  header.write("data", 36);
  header.writeUInt32LE(pcmDataLength, 40);

  return header;
}

function extractVoice(ttsScript: string, label: string, fallback: string): string {
  const regex = new RegExp(`${label} Voice:\\s*(\\w+)`);
  const match = ttsScript.match(regex);
  return match ? match[1] : fallback;
}

function extractSection(ttsScript: string, startMarker: string, endMarkers: string[]): string {
  const startIdx = ttsScript.indexOf(startMarker);
  if (startIdx === -1) return "";
  const afterMarker = ttsScript.slice(startIdx + startMarker.length);

  let endIdx = afterMarker.length;
  for (const marker of endMarkers) {
    const idx = afterMarker.indexOf(marker);
    if (idx !== -1 && idx < endIdx) endIdx = idx;
  }
  return afterMarker.slice(0, endIdx).trim();
}

function buildTtsPrompt(ttsScript: string): string {
  const directorsNotes = extractSection(ttsScript, "### DIRECTOR'S NOTES", ["### RECOMMENDED VOICES", "### TRANSCRIPT"]);
  const transcript = extractSection(ttsScript, "### TRANSCRIPT", []);

  // Clean Director's Notes: replace speaker names to avoid confusing multi-speaker labels
  const cleanedNotes = directorsNotes
    .replace(/\bNarrator\b/g, "the storyteller")
    .replace(/\bCharacter\b/g, "the character");

  if (!transcript) return ttsScript;

  return `TTS the following bedtime story with two speakers: Narrator and Character.
IMPORTANT: Narrator and Character MUST sound like completely different people - different pitch, different tone, different energy.
The text contains Hebrew nikud (diacritics/vowel marks) - follow them carefully for correct pronunciation.

Performance directions:
${cleanedNotes}

${transcript}`;
}

export async function narrateStory(params: {
  ttsScript: string;
}): Promise<{ audioBuffer: Buffer; mimeType: string }> {
  const ai = getGeminiClient();
  const narratorVoice = extractVoice(params.ttsScript, "Narrator", "Kore");
  let characterVoice = extractVoice(params.ttsScript, "Character", "Puck");
  // Ensure voices are different - if same, pick a contrasting one
  if (characterVoice === narratorVoice) {
    characterVoice = narratorVoice === "Puck" ? "Kore" : "Puck";
  }

  const ttsPrompt = buildTtsPrompt(params.ttsScript);

  console.log("TTS narrator voice:", narratorVoice);
  console.log("TTS character voice:", characterVoice);
  console.log("TTS prompt (first 500 chars):", ttsPrompt.slice(0, 500));

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: ttsPrompt }] }],
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: [
            {
              speaker: "Narrator",
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: narratorVoice,
                },
              },
            },
            {
              speaker: "Character",
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: characterVoice,
                },
              },
            },
          ],
        },
      },
    },
  });

  const candidate = response.candidates?.[0];
  const audioData = candidate?.content?.parts?.[0]?.inlineData?.data;

  if (!audioData) {
    throw new Error("No audio data received from Gemini TTS");
  }

  const pcmBuffer = Buffer.from(audioData, "base64");
  const wavHeader = createWavHeader(pcmBuffer.length);
  const wavBuffer = Buffer.concat([wavHeader, pcmBuffer]);

  return { audioBuffer: wavBuffer, mimeType: "audio/wav" };
}

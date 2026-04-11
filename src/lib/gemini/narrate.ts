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

function extractRecommendedVoice(ttsScript: string): string | null {
  const match = ttsScript.match(/### RECOMMENDED CHARACTER VOICE[\s\S]*?Voice:\s*(\w+)/);
  return match ? match[1] : null;
}

export async function narrateStory(params: {
  ttsScript: string;
  voiceName?: string;
}): Promise<{ audioBuffer: Buffer; mimeType: string }> {
  const ai = getGeminiClient();
  const narratorVoice = params.voiceName ?? "Kore";
  const characterVoice = extractRecommendedVoice(params.ttsScript) ?? "Puck";

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: params.ttsScript,
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

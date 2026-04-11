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

function extractTranscript(ttsScript: string): string {
  const marker = "### TRANSCRIPT";
  const idx = ttsScript.indexOf(marker);
  if (idx === -1) return ttsScript;
  return ttsScript.slice(idx + marker.length).trim();
}

export async function narrateStory(params: {
  ttsScript: string;
}): Promise<{ audioBuffer: Buffer; mimeType: string }> {
  const ai = getGeminiClient();
  const narratorVoice = extractVoice(params.ttsScript, "Narrator", "Kore");
  const characterVoice = extractVoice(params.ttsScript, "Character", "Puck");

  // Send only the transcript to TTS - the preamble's "Narrator"/"Character"
  // words confuse multi-speaker detection
  const transcript = extractTranscript(params.ttsScript);
  const ttsPrompt = `Tell this bedtime story in a warm, gentle voice. Speak softly and slowly toward the end.\n\n${transcript}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: ttsPrompt,
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

import { getGeminiClient } from "../gemini/client";

function createWavHeader(pcmDataLength: number): Buffer {
  const sampleRate = 24000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const header = Buffer.alloc(44);

  header.write("RIFF", 0);
  header.writeUInt32LE(pcmDataLength + 36, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcmDataLength, 40);

  return header;
}

async function ttsOneChunk(
  text: string,
  voiceName: string
): Promise<Buffer> {
  const ai = getGeminiClient();

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-tts-preview",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  });

  const candidate = response.candidates?.[0];
  const audioData = candidate?.content?.parts?.[0]?.inlineData?.data;

  if (!audioData) {
    throw new Error("No audio data from Gemini TTS");
  }

  // Return raw PCM (no WAV header yet)
  return Buffer.from(audioData, "base64");
}

export async function generateSpeechGemini(params: {
  text: string;
  voiceName: string;
}): Promise<Buffer> {
  // Split into paragraphs to avoid quality degradation in long audio
  const paragraphs = params.text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  console.log(`Gemini TTS: ${paragraphs.length} paragraphs`);

  // Render each paragraph sequentially
  const pcmChunks: Buffer[] = [];
  for (let i = 0; i < paragraphs.length; i++) {
    console.log(`  Paragraph ${i + 1}/${paragraphs.length} (${paragraphs[i].length} chars)`);
    const pcm = await ttsOneChunk(paragraphs[i], params.voiceName);
    pcmChunks.push(pcm);
  }

  // Concatenate all PCM chunks and wrap in single WAV header
  const combinedPcm = Buffer.concat(pcmChunks);
  const wavHeader = createWavHeader(combinedPcm.length);
  return Buffer.concat([wavHeader, combinedPcm]);
}

import {
  GoogleGenAI,
  createUserContent,
  createPartFromUri,
} from '@google/genai';
import mime from 'mime';

/**
 * Summarizes a podcast transcript using Google's Generative AI (Gemini) model.
 * The summary includes key discussion points, notable insights, and contextual relevance.
 *
 * @param {string} apiKey - The API key for Google's Generative AI service
 * @param {string} model - The AI model name to be used for summarization
 * @param {string} content - The podcast transcript content to be summarized
 * @returns {Promise<string>} A formatted summary of the podcast transcript
 * @throws {Error} If there's an issue with the API call or content generation
 *
 * @example
 * const summary = await summarize('your-api-key', 'podcast transcript text');
 * console.log(summary);
 */
export async function summarize(apiKey, model, content) {
  const ai = new GoogleGenAI({ apiKey: apiKey });

  const prompt = `Please analyze this podcast transcript and provide:
  
      1. Key Discussion Points (3-5 main topics)
      - Brief description of each point (2-3 sentences)
      - Why this point matters in the broader context
  
      2. Notable Insights
      - Key quotes or memorable statements
      - Practical takeaways or actionable items
  
      3. Context & Relevance
      - How this discussion connects to current trends/issues
      - Who would find this information most valuable
  
      Format each point concisely but include enough detail to understand the core message and its significance.
  
      Transcript:
      ${content}`;

  const result = await ai.models.generateContent({
    model: model,
    temperature: 0,
    contents: createUserContent([{ text: prompt }]),
  });

  return result.text;
}

/**
 * Retrieves and generates a transcription from an audio file using Google's Generative AI.
 *
 * @async
 * @param {string} apiKey - The API key for Google's Generative AI service
 * @param {string} model - The AI model name to be used for transcription
 * @param {string} filePath - The path to the audio file to be transcribed
 * @param {string} [description] - Optional description of the podcast episode to provide context
 * @returns {Promise<string>} A formatted transcript with timestamps and speaker identification
 * @throws {Error} If there's an issue with file upload or AI processing
 *
 * The transcript is formatted as:
 * [HH:MM:SS] Speaker Name: Dialogue text
 *
 * Speaker names are consistent throughout the transcript and may include:
 * - Actual names (e.g., "John", "Sally")
 * - Roles (e.g., "Host", "Guest")
 * - Generic labels (e.g., "Speaker 1")
 * - "Voiceover" for narration
 */
export async function transcribe(apiKey, model, filePath, description) {
  const mimeType = mime.getType(filePath);

  const ai = new GoogleGenAI({ apiKey: apiKey });
  const myfile = await ai.files.upload({
    file: filePath,
    config: { mimeType: mimeType },
  });

  const prompt = `
      Please transcribe the provided podcast audio.
  
      ${description ? `Consider this episode description while transcribing to help you find the hosts and participants names and context:\n${description}\n` : ''}
  
      Generate the transcript adhering strictly to the following format for every spoken line:
      [HH:MM:SS] Speaker First Name: Dialogue text.
  
      If it's a vvoiceover or narration, use "Voiceover" as the speaker label.
  
      Ensure that:
      1.  An accurate timestamp ([HH:MM:SS]) indicates the start time of each line.
      2.  The speaker is identified at the beginning of the line (e.g., "Speaker 1", "Host", "Guest", "John", "Sally"). Please maintain consistency in speaker labels throughout the transcript.
      3.  The transcribed dialogue text follows the speaker identification.`;
  const result = await ai.models.generateContent({
    model: model,
    temperature: 0,
    contents: createUserContent([
      { text: prompt },
      createPartFromUri(myfile.uri, myfile.mimeType),
    ]),
  });
  return result.text;
}

export async function generateFilename(apiKey, model, content) {
  const prompt = `Based on this podcast content, generate a short filename-friendly title 
  (65 chars max, use only lowercase letters, numbers and hyphens, no spaces). 
  The filename should be descriptive of the podcast's main topic.
  The filename should include the podcast name and episode number if available in the beginning.
  The filename should end with .md for Markdown files.
  Content:

  ${content}`;

  const ai = new GoogleGenAI({ apiKey: apiKey });
  const result = await ai.models.generateContent({
    model: model,
    temperature: 0,
    contents: createUserContent([{ text: prompt }]),
  });
  return result.text;
}

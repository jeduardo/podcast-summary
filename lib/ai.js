import {
  GoogleGenAI,
  createUserContent,
  createPartFromUri,
} from '@google/genai';
import mime from 'mime';

/**
 * Extracts retry delay from error details
 * @param {Object} details - Error details from Gemini API
 * @returns {number|null} Delay in seconds or null if not found
 */
function getRetryDelay(details) {
  const retryInfo = details.find(
    (d) => d['@type'] === 'type.googleapis.com/google.rpc.RetryInfo'
  );
  if (retryInfo?.retryDelay) {
    return parseInt(retryInfo.retryDelay.replace('s', ''));
  }
  return null;
}

/**
 * Logs quota violation information
 * @param {Object} details - Error details from Gemini API
 */
function logQuotaViolations(details) {
  const quotaInfo = details.find(
    (d) => d['@type'] === 'type.googleapis.com/google.rpc.QuotaFailure'
  );
  if (quotaInfo?.violations) {
    console.log('Quota violations:');
    quotaInfo.violations.forEach((v) => {
      console.log(`- Quota ID: ${v.quotaId}, Value: ${v.quotaValue}`);
    });
  }
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - The function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @returns {Promise<any>} The result of the function
 * @throws {Error} If the function fails after maxRetries
 */
async function retryWithBackoff(fn, maxRetries = 5) {
  let attempts = 0;
  while (true) {
    try {
      return await fn();
    } catch (error) {
      attempts++;

      // Get the substring from the first { until the end of the string
      // This is a workaround for the error message containing the full JSON response
      // only after a string error message.
      const errorMessage = error.message.substring(
        error.message.indexOf('{'),
        error.message.lastIndexOf('}') + 1
      );
      const clientError = JSON.parse(errorMessage).error;

      if (clientError?.code === 429) {
        try {
          const details = clientError.details || [];
          const delay = getRetryDelay(details);

          console.log(
            `\nRate limit reached (attempt ${attempts}/${maxRetries})`
          );
          logQuotaViolations(details);

          if (delay) {
            console.log(`Waiting ${delay} seconds before retry...`);
            await new Promise((resolve) => setTimeout(resolve, delay * 1000));
            continue;
          }
        } catch (parseError) {
          console.log('Could not parse rate limit details');
        }
      }

      if (attempts === maxRetries) {
        throw new Error(
          `Failed after ${maxRetries} attempts: ${error.message}`
        );
      }

      // For non-429 errors or if we couldn't parse the retry delay,
      // use exponential backoff
      const backoffDelay = Math.pow(2, attempts) * 1000;
      console.log(
        `Retrying in ${backoffDelay / 1000} seconds... (attempt ${attempts}/${maxRetries})`
      );
      await new Promise((resolve) => setTimeout(resolve, backoffDelay));
    }
  }
}

/**
 * Makes a call to the Gemini API with standard parameters and retry logic
 * @param {string} apiKey - The API key for Google's Generative AI service
 * @param {string} model - The AI model to use
 * @param {Array} contents - The contents array for the API call
 * @returns {Promise<string>} The generated text
 */
async function callGemini(apiKey, model, contents) {
  const ai = new GoogleGenAI({ apiKey: apiKey });
  const result = await retryWithBackoff(() =>
    ai.models.generateContent({
      model: model,
      temperature: 0,
      attempts: 5,
      contents: contents,
    })
  );
  return result.text;
}

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
  
      4. Add a section to the top of the summary containing the following fields, like this:
      ---
      - podcast: The name of the podcast
      - episode: The episode number of the podcast
      - title: The title of the podcast episode
      - date: The date of the podcast episode in the format YYYY-MM-DD if available. It not, omit this field.
      ---

      5. Never add \`\`\` markers to the beginning and end of the summary.

      Format each point concisely but include enough detail to understand the core message and its significance.
      
      Transcript:
      ${content}`;

  return await callGemini(apiKey, model, createUserContent([{ text: prompt }]));
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

      Add a section to the top of the transcript containing the following fields, like this:
      ---
      - podcast: The name of the podcast
      - episode: The episode number of the podcast
      - title: The title of the podcast episode
      - date: The date of the podcast episode in the format YYYY-MM-DD if available. It not, omit this field.
      ---

      Do not add \`\`\` markers to the beginning and end of the summary.
   
      ${description ? `Consider this episode description while transcribing to help you find the hosts and participants names and context:\n${description}\n` : ''}
  
      Generate the transcript adhering strictly to the following format for every spoken line:
      [HH:MM:SS] Speaker First Name: Dialogue text.
  
      If it's a voiceover or narration, use "Voiceover" as the speaker label.

      Ensure that:
      1.  An accurate timestamp ([HH:MM:SS]) indicates the start time of each line.
      2.  The speaker is identified at the beginning of the line (e.g., "Speaker 1", "Host", "Guest", "John", "Sally"). Please maintain consistency in speaker labels throughout the transcript.
      3.  The transcribed dialogue text follows the speaker identification.
      
      `;

  return await callGemini(
    apiKey,
    model,
    createUserContent([
      { text: prompt },
      createPartFromUri(myfile.uri, myfile.mimeType),
    ])
  );
}

export async function generateFilename(apiKey, model, content) {
  const prompt = `Based on this podcast content, generate a short filename-friendly title 
  (65 chars max, use only lowercase letters, numbers and hyphens, no spaces). 
  The filename should be descriptive of the podcast's main topic.
  The filename should include the podcast name and episode number if available in the beginning.
  The filename should end with .md for Markdown files.
  Content:

  ${content}`;

  return await callGemini(apiKey, model, createUserContent([{ text: prompt }]));
}

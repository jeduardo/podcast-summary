import axios from 'axios';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import fs_sync from 'fs';
import path from 'path';

/**
 * Extracts and parses readable content from a given URL using Readability.
 *
 * @param {string} url - The URL from which to extract content
 * @returns {Promise<string>} The extracted text content from the webpage
 * @throws {Error} If the URL cannot be accessed or content cannot be parsed
 * @async
 */
export async function scrape(url) {
  const response = await axios.get(url);
  const dom = new JSDOM(response.data);
  const reader = new Readability(dom.window.document);
  const article = reader.parse();
  return article.textContent.trim();
}

/**
 * Downloads a file from a URL to a local temporary path
 * @param {string} url - The URL to download from
 * @returns {Promise<string>} The path to the downloaded file
 */
export async function download(url) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const extension = path.extname(url);
  const tempPath = `download-${timestamp}${extension}`;

  console.log(`Downloading file from ${url}...`);
  const response = await axios({
    method: 'get',
    url: url,
    responseType: 'stream',
  });

  const writer = fs_sync.createWriteStream(tempPath);
  response.data.pipe(writer);

  await new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });

  return tempPath;
}

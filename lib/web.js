import axios from 'axios';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

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
  return article.textContent;
}

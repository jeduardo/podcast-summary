#!/usr/bin/env node

const axios = require('axios');
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Function to fetch and extract the main content from a URL
async function extractContent(url) {
    const response = await axios.get(url);
    const dom = new JSDOM(response.data);
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    return article.textContent;
}

// Function to summarize content using Google Gemini AI
async function summarizeWithGemini(content, apiKey) {
    const genAI = new GoogleGenerativeAI(apiKey);
    // const model_name = "gemini-1.5-flash";
    const model_name = "gemini-1.5-pro";
    const model = genAI.getGenerativeModel({ model: model_name });

    const prompt = `Summarize the key points of the following podcast transcript:\n\n${content}`;

    const result = await model.generateContent(prompt);

    return result.response.text();
}

// Main function
async function main() {
    const url = process.argv[2];
    if (!url) {
        throw new Error("Please provide a URL as a command-line argument");
    }
    
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is not set");
    }

    console.log(`Extracting content from the website... ${url}`);
    const content = await extractContent(url);

    console.log("Summarizing content with Google Gemini AI...");
    const summary = await summarizeWithGemini(content, apiKey);

    console.log("\nPodcast Summary:");
    console.log(summary);
}

main().catch(console.error);

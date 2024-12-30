# Podcast Summary

This is a simple podcast summarizer using the Gemini API.

## Prerequisites

- Node.js (v22 or later)
- npm (Node Package Manager)

## Installation

1. Clone this repository
2. Run `npm install` to install the dependencies

## Usage

1. Set the GEMINI_API_KEY environment variable:

```shell
export GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
```

2. Run the script with a URL as an argument:

```shell
chmod u+x podcast-summary.js
./podcast-summary.js <url>
```

## Dependencies

- axios: For making HTTP requests
- jsdom: For parsing HTML
- @mozilla/readability: For extracting main content from web pages
- @google-ai/generativelanguage: For interacting with Google's Gemini AI

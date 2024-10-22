# Podcast summarizer

This is a simple podcast summarizer that uses the Gemini API to summarize the podcast.

## Prerequisites

- Node.js (v20 or later)
- npm (Node Package Manager)

## Installation

1. Clone this repository
2. Run `npm install` to install the dependencies

## Usage

1. Set the GEMINI_API_KEY environment variable:

```shell
export GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
```

2. Run the script:

```shell
chmod u+x podcast_summarizer.js
./podcast_summarizer.js <url>
```

## Dependencies

- axios: For making HTTP requests
- jsdom: For parsing HTML
- @mozilla/readability: For extracting main content from web pages
- @google-ai/generativelanguage: For interacting with Google's Gemini AI

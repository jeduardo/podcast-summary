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

2. Run the script with one of the following options:

```shell
# Summarize from a transcription URL
./podcast-summary.js --transcription https://example.com/transcript.html

# Transcribe and summarize an audio file
./podcast-summary.js --audio episode.mp3

# Transcribe with additional metadata
./podcast-summary.js --audio episode.mp3 --metadata https://example.com/meta.html

# Save the summary to a markdown file
./podcast-summary.js --transcription https://example.com/transcript.html --save

# Use a different Gemini model
./podcast-summary.js --transcription https://example.com/transcript.html --model "gemini-2.5-pro"
```

## Options

- `--transcription <url>`: URL of a podcast transcription to be summarized
- `--audio <path>`: Path to an audio file to be transcribed
- `--metadata <url>`: URL for extra metadata to use when transcribing (only valid with --audio)
- `--model <model>`: Model to use for summarization (default: gemini-2.5-flash-preview-04-17)
- `--save`: Save the summary to a markdown file (will be saved as `<podcast-title>-summary.md`)
- `--help`: Display help information

## Dependencies

- axios: For making HTTP requests
- jsdom: For parsing HTML
- @mozilla/readability: For extracting main content from web pages
- @google-ai/genai: For interacting with Google's Gemini AI
- commander: For command-line argument parsing

# Podcast Summarizer

This is a podcast summarizer using the Gemini models from Google. It allows you to summarizing
podcasts out of transcriptions or audio files.

## Prerequisites

- Node.js (v20 or later)
- npm (Node Package Manager)

## Installation

1. Clone this repository
2. Run `npm install` to install the dependencies
3. Run `npm link` to make the binary widely-available for usage

## Usage

1. Set the GEMINI_API_KEY environment variable:

```shell
export GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
```

2. Run the script with one of the following options:

```shell
# Summarize from a transcription URL
podcast-summary --transcription https://example.com/transcript.html

# Transcribe and summarize a local audio file
podcast-summary --audio episode.mp3

# Transcribe and summarize a remote audio file
podcast-summary --audio https://example.com/episode.mp3

# Transcribe with additional metadata
podcast-summary --audio episode.mp3 --metadata https://example.com/meta.html

# Save the summary to a markdown file
podcast-summary --transcription https://example.com/transcript.html --save

# Use a different Gemini model
podcast-summary --transcription https://example.com/transcript.html --model "gemini-2.5-pro"
```

## Options

- `--transcription <url>`: URL of a podcast transcription to be summarized
- `--audio <path>|<url>`: Path or URL to an audio file to be transcribed
- `--metadata <url>`: URL for extra metadata to use when transcribing (only valid with --audio)
- `--model <model>`: Model to use for summarization (default: gemini-2.5-flash-preview-04-17)
- `--save`: Save the summary to a markdown file (will be saved as `<podcast-title>-summary.md`)
- `--help`: Display help information

#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';
import { Command } from 'commander';
import { marked } from 'marked';
import { markedTerminal } from 'marked-terminal';
import { scrape, download } from './lib/web.js';
import { summarize, transcribe, generateFilename } from './lib/ai.js';
import pkg from './package.json' with { type: 'json' };

const DEFAULT_MODEL_NAME = 'gemini-2.5-flash';

marked.use(markedTerminal());

function collectInput() {
  const program = new Command();
  program
    .name('podcast-summary')
    .description('Summarize a podcast out of a transcription or audio file')
    .version(pkg.version)
    .helpOption('-h, --help', 'display help for command')
    .addHelpText(
      'afterAll',
      `
  Examples:
    $ podcast-summary --help
    $ podcast-summary --transcription https://example.com/transcript.json
    $ podcast-summary --audio episode.mp3 --metadata https://example.com/meta.json
  `
    );

  program
    .option(
      '--transcription <url>',
      'URL of a podcast transcription to be summarized'
    )
    .option('--audio <path>', 'Path to an audio file to be transcribed')
    .option(
      '--metadata <url>',
      'URL for extra metadata to use when transcribing (only valid with --audio)'
    )
    .option(
      '--model <model>',
      'Model to use for summarization',
      DEFAULT_MODEL_NAME
    )
    .option('--save', 'Save the transcription and summary to Markdown files');

  if (process.argv.length <= 2) {
    program.outputHelp();
    process.exit(0);
  }
  program.parse(process.argv);

  const opts = program.opts();

  if (!opts.transcription && !opts.audio) {
    console.error('Error: you must pass either --transcription or --audio');
    process.exit(1);
  }
  if (opts.metadata && !opts.audio) {
    console.error(
      'Error: --metadata can only be used when you also pass --audio'
    );
    process.exit(1);
  }

  return opts;
}

async function main() {
  const opts = collectInput();
  let downloadedAudio = false;
  let filename = null;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }

  let content = null;
  let audioPath = opts.audio;

  // If audio is a URL, download it first
  if (
    audioPath &&
    (audioPath.startsWith('http://') || audioPath.startsWith('https://'))
  ) {
    audioPath = await download(audioPath);
    downloadedAudio = true;
    opts.audio = audioPath;
    opts.transcription = null; // Clear transcription option
  }

  if (opts.audio) {
    let metadata = null;
    if (opts.metadata) {
      console.log(`Adding transcription metadata from ${opts.metadata}...`);
      metadata = await scrape(opts.metadata);
    }
    console.log(
      `Transcribing audio file ${opts.audio} with Gemini (${opts.model}), this can take a while...`
    );
    content = await transcribe(apiKey, opts.model, opts.audio, metadata);
  } else if (opts.transcription) {
    console.log(
      `Extracting transcription from the URL... ${opts.transcription}`
    );
    content = await scrape(opts.transcription);
  }

  if (opts.save) {
    filename = await generateFilename(apiKey, opts.model, content);
    await fs.writeFile(filename, content);
    console.log(`Transcription saved to: ${filename}`);
  }

  console.log(
    `Summarizing content with Gemini (${opts.model}), this can take a while...`
  );
  const summary = await summarize(apiKey, opts.model, content);
  console.log('Summary generated successfully!');
  console.log('Summary:');
  console.log(marked(summary));

  if (opts.save) {
    const summaryName = filename.replace(/\.md$/, '-summary.md');
    await fs.writeFile(summaryName, summary);
    console.log(`Summary saved to: ${summaryName}`);

    // If we downloaded an audio file and want to save it, rename it to match our naming scheme
    if (downloadedAudio) {
      const extension = path.extname(opts.audio);
      const audioFilename = filename.replace(/\.md$/, extension);
      await fs.rename(opts.audio, audioFilename);
      console.log(`Audio file saved to: ${audioFilename}`);
    }
  } else if (downloadedAudio) {
    // Clean up any temporary downloaded audio file
    try {
      await fs.unlink(opts.audio);
    } catch (err) {
      console.error(
        `Warning: Could not delete temporary file ${opts.audio}:`,
        err
      );
    }
  }
}

main().catch(console.error);

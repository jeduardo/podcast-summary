#!/usr/bin/env node

import { Command } from 'commander';

import { scrape } from './lib/web.js';
import { summarize, transcribe } from './lib/ai.js';

const DEFAULT_MODEL_NAME = 'gemini-2.5-flash-preview-04-17';

function collectInput() {
  const program = new Command();
  program
    .name('podcast-summary')
    .description('Summarize a podcast out of a transcription or audio file')
    .version('1.0.0')
    .helpOption('-h, --help', 'display help for command')
    .addHelpText(
      'afterAll',
      `
  Examples:
    $ podcast-tool --help
    $ podcast-tool --url https://example.com/transcript.json
    $ podcast-tool --audio episode.mp3 --metadata https://example.com/meta.json
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
    );

  if (process.argv.length <= 2) {
    program.outputHelp();
    process.exit(0);
  }
  program.parse(process.argv);

  const opts = program.opts();

  if (!opts.transcription && !opts.audio) {
    console.error('Error: you must pass either --url or --audio');
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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }

  let content = null;

  if (opts.audio) {
    console.log(
      `Transcribing audio file ${opts.audio} with Gemini (${opts.model}), this can take a while...`
    );
    let metadata = null;
    if (opts.metadata) {
      console.log(`Adding transcription metadata from ${opts.metadata}...`);
      metadata = await scrape(opts.metadata);
    }
    content = await transcribe(apiKey, opts.model, opts.audio, metadata);
  } else if (opts.transcription) {
    console.log(
      `Extracting transcription from the URL... ${opts.transcription}`
    );
    content = await scrape(opts.transcription);
  }

  console.log(
    `Summarizing content with Gemini (${opts.model}), this can take a while...`
  );
  const summary = await summarize(apiKey, opts.model, content);

  console.log(summary);
}

main().catch(console.error);

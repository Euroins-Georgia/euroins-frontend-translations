#!/usr/bin/env node

const { program } = require('commander');
const path = require('path');

program
  .name('euroins-translations')
  .description('Euroins frontend translation editor')
  .version('1.0.0');

program
  .command('editor')
  .description('Start the translation editor server')
  .action(() => {
    const { startEditor } = require(path.join(__dirname, '../dist/index'));
    startEditor();
  });

program
  .command('start')
  .description('Start the translation editor server')
  .action(() => {
    const { startEditor } = require(path.join(__dirname, '../dist/index'));
    startEditor();
  });

program
  .command('extract')
  .description('Extract translations from source code to CSV')
  .action(() => {
    const { runExtract } = require(path.join(__dirname, '../dist/index'));
    runExtract();
  });

program
  .command('import')
  .description('Import translations from CSV to JSON files')
  .action(() => {
    const { runImport } = require(path.join(__dirname, '../dist/index'));
    runImport();
  });

program.parse();

#!/usr/bin/env node

import {StubService} from './services/stub.service';
import {Command} from 'commander';
import {version} from '../package.json';

const program = new Command();

program
  .version(version)
  .option('-f, --folder <name>', 'Path to directory with stub files')
  .option('-p, --port <name>', 'server port', '3001')
  .option('-j, --jhelp', 'output options as json')
  .option(
    '-s, --save-cache',
    'The flag where to save the data written to the cache in the file system, by default in <folder>/.cache, if not set, it is not saved',
  );

(async () => {
  program.parse(process.argv);
  const options = program.opts();
  if (options.jhelp) {
    console.log(options);
  }

  if (!options.folder) {
    throw new Error('Folder is not defined');
  }

  const stubService = new StubService({
    port: options.port,
    folder: options.folder,
    saveCache: options.saveCache,
  });
  await stubService.init();
})();

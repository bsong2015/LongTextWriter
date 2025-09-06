#!/usr/bin/env node
import 'dotenv/config';

import { Command } from 'commander';
import { newCommand } from './commands/new';
import { lsCommand } from './commands/ls';
import { rmCommand } from './commands/rm';
import { outlineCommand } from './commands/outline';
import { runCommand } from './commands/run';
import { publishCommand } from './commands/publish';
import { statusCommand } from './commands/status';
import { createConfigCommand } from './commands/config';

const program = new Command();

program
  .version('0.0.1')
  .description('AI Long Document Generator');

program
  .command('new [type]')
  .description('Create a new document generation project')
  .option('-n, --name <name>', 'Project name')
  .option('-l, --lang <language>', 'Language for the project idea')
  .option('-s, --summary <summary>', 'Summary for the project idea')
  .option('-p, --prompt <prompt>', 'Global prompt for the project idea')
  .option('--sources <sources...>', 'Source files for templated project')
  .option('--template <template>', 'Template file for templated project')
  .action(async (type, options) => {
    await newCommand({ type, ...options });
  });

program
  .command('ls')
  .description('List all existing projects')
  .action(() => {
    lsCommand();
  });

program
  .command('rm <project_name>')
  .description('Remove a specified project')
  .option('-y, --yes', 'Skip confirmation prompt')
  .action(async (projectName: string, options: { yes: boolean }) => {
    await rmCommand(projectName, options);
  });

program
  .command('outline <project_name>')
  .description('Generate an outline for a book or series project')
  .action(async (projectName: string) => {
    await outlineCommand(projectName);
  });

program
  .command('run <project_name>')
  .description('Run the core content generation process')
  .action(async (projectName: string) => {
    await runCommand(projectName);
  });

program
  .command('publish <project_name>')
  .description('Publish the generated content into a final document')
  .action(async (projectName: string) => {
    await publishCommand(projectName);
  });

program
  .command('status <project_name>')
  .description('Show the generation status of a project')
  .action(async (projectName: string) => {
    await statusCommand(projectName);
  });

program
  .command('web')
  .description('Start the web UI server')
  .action(() => {
    require('./server');
  });

program.addCommand(createConfigCommand());

program.parse(process.argv);

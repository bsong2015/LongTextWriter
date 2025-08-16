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

const program = new Command();

program
  .version('0.0.1')
  .description('AI Long Document Generator');

program
  .command('new')
  .description('Create a new document generation project')
  .action(async () => {
    await newCommand();
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
  .action(async (projectName: string) => {
    await rmCommand(projectName);
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

program.parse(process.argv);

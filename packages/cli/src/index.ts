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
import { t } from './utils/i18n';

const { version } = require('../package.json');

const program = new Command();

program
  .version(version)
  .description(t('cli.main.description'));

program
  .command('new [type]')
  .description(t('cli.new.description'))
  .option('-n, --name <name>', t('cli.new.option.name'))
  .option('-l, --lang <language>', t('cli.new.option.lang'))
  .option('-s, --summary <summary>', t('cli.new.option.summary'))
  .option('-p, --prompt <prompt>', t('cli.new.option.prompt'))
  .option('--sources <sources...>', t('cli.new.option.sources'))
  .option('--template <template>', t('cli.new.option.template'))
  .action(async (type, options) => {
    await newCommand({ type, ...options });
  });

program
  .command('ls')
  .description(t('cli.ls.description'))
  .action(() => {
    lsCommand();
  });

program
  .command('rm <project_name>')
  .description(t('cli.rm.description'))
  .option('-y, --yes', t('cli.rm.option.yes'))
  .action(async (projectName: string, options: { yes: boolean }) => {
    await rmCommand(projectName, options);
  });

program
  .command('outline <project_name>')
  .description(t('cli.outline.description'))
  .action(async (projectName: string) => {
    await outlineCommand(projectName);
  });

program
  .command('run <project_name>')
  .description(t('cli.run.description'))
  .action(async (projectName: string) => {
    await runCommand(projectName);
  });

program
  .command('publish <project_name>')
  .description(t('cli.publish.description'))
  .action(async (projectName: string) => {
    await publishCommand(projectName);
  });

program
  .command('status <project_name>')
  .description(t('cli.status.description'))
  .action(async (projectName: string) => {
    await statusCommand(projectName);
  });

program
  .command('web')
  .description(t('cli.web.description'))
  .action(() => {
    require('./server');
  });

program.addCommand(createConfigCommand());

program.parse(process.argv);
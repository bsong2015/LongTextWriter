import { startContentGeneration, ProgressCallback } from '../core/projectManager';
import { t } from '../utils/i18n';
import cliProgress from 'cli-progress';

export async function runCommand(projectName: string) {
  console.log(t('content_generation_start', { projectName: projectName }));

  const progressBar = new cliProgress.SingleBar({
    format: ' {bar} | {percentage}% | {done}/{total} | {title}',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
  });

  let isInitialized = false;

  const onProgress: ProgressCallback = (progress) => {
    if (!isInitialized) {
      progressBar.start(progress.total, progress.done, { title: progress.currentTitle });
      isInitialized = true;
    } else {
      progressBar.update(progress.done, { title: progress.currentTitle });
    }
  };

  try {
    await startContentGeneration(projectName, onProgress);
    progressBar.stop();
    console.log(`\n${t('content_generation_success', { projectName: projectName })}`);
  } catch (error: any) {
    progressBar.stop();
    console.error(`\n${t('content_generation_failed', { projectName: projectName })}: ${error.message}`);
  }
}
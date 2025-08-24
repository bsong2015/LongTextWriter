import * as fs from 'fs';
import * as path from 'path';
import { startContentGeneration } from '../core/projectManager';
import { t } from '../utils/i18n';

const GENDOC_WORKSPACE = path.resolve(process.cwd(), 'gendoc-workspace');
const PROJECTS_DIR = path.resolve(GENDOC_WORKSPACE, 'projects');

export async function runCommand(projectName: string) {
  try {
    console.log(t('content_generation_start', { projectName: projectName }));
    const result = await startContentGeneration(projectName);
    console.log(t('content_generation_success', { projectName: projectName }));
    if (result && typeof result === 'object' && 'message' in result) {
      console.log(result.message);
    }
  } catch (error: any) {
    console.error(`${t('content_generation_failed', { projectName: projectName })}: ${error.message}`);
  }
}
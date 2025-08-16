import * as fs from 'fs';
import * as path from 'path';
import { confirm } from '@inquirer/prompts';
import { t } from '../utils/i18n';
import { deleteProject } from '../core/projectManager';

const GENDOC_WORKSPACE = path.resolve(process.cwd(), 'gendoc-workspace');
const PROJECTS_DIR = path.resolve(GENDOC_WORKSPACE, 'projects');

export async function rmCommand(projectName: string) {
  const projectPath = path.resolve(PROJECTS_DIR, projectName);

  if (!fs.existsSync(projectPath)) {
    console.error(t('project_not_found_error', { projectName: projectName }));
    return;
  }

  const answer = await confirm({
    message: t('confirm_delete_project', { projectName: projectName }), 
    default: false,
  });

  if (answer) {
    try {
      deleteProject(projectName);
      console.log(`✅ ${t('project_deleted_success', { projectName: projectName })}`);
    } catch (error: any) {
      console.error(`❌ ${t('project_delete_error', { projectName: projectName })}: ${error.message}`);
    }
  } else {
    console.log(t('project_delete_cancelled', { projectName: projectName }));
  }
}
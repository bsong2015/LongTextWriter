import { confirm } from '@inquirer/prompts';
import { t } from '../utils/i18n';
import { deleteProject } from '../core/projectManager';

interface RmCommandOptions {
  yes: boolean;
}

export async function rmCommand(projectName: string, options: RmCommandOptions) {
  let answer = false;
  if (options.yes) {
    answer = true;
  } else {
    answer = await confirm({
      message: t('confirm_delete_project', { projectName: projectName }),
      default: false,
    });
  }

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
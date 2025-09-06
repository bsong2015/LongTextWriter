import { select } from '@inquirer/prompts';
import { getProjectDetails, publishProject } from '../core/projectManager';
import { t } from '../utils/i18n';

export async function publishCommand(projectName: string) {
  const project = getProjectDetails(projectName);
  if (!project) {
    // getProjectDetails throws an error if not found, but for safety:
    console.error(t('project_not_found_error', { projectName }));
    return;
  }

  let publishType = 'single-markdown'; // Default for book and templated

  if (project.type === 'series') {
    publishType = await select({
      message: t('publish_series_prompt'),
      choices: [
        {
          name: t('publish_single_markdown_name'),
          value: 'single-markdown',
          description: t('publish_single_markdown_description'),
        },
        {
          name: t('publish_multiple_markdown_zip_name'),
          value: 'multiple-markdown-zip',
          description: t('publish_multiple_markdown_zip_description'),
        },
      ],
    });
  }

  try {
    console.log(t('publish_start_message', { projectName }));
    const result = await publishProject(projectName, publishType);
    console.log(t('publish_success_message', { message: result.message, filePath: result.filePath }));
  } catch (error: any) {
    console.error(t('publish_error_message', { projectName, errorMessage: error.message }));
  }
}

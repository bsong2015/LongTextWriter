import { confirm } from '@inquirer/prompts';
import { t } from '../utils/i18n';
import { generateProjectOutline, getProjectDetails } from '../core/projectManager';

export async function outlineCommand(projectName: string) {
  let overwrite = false;

  try {
    // First, get project details to check for an existing outline
    const project = getProjectDetails(projectName);

    if (project.outline) {
      const shouldOverwrite = await confirm({
        message: t('confirm_overwrite_outline'),
        default: false,
      });

      if (!shouldOverwrite) {
        console.log(t('outline_generation_cancelled'));
        return;
      }
      overwrite = true;
    }

    console.log(t('outline_generation_start', { projectName }));
    const generatedOutline = await generateProjectOutline(projectName, overwrite);

    console.log(`
✅ ${t('outline_generated_success', { projectName: projectName })}
`);
    console.log(JSON.stringify(generatedOutline, null, 2));

  } catch (error: any) {
    console.error(`
❌ ${t('outline_generation_failed', { error: error.message })}
`);
  }
}
import * as fs from 'fs';
import * as path from 'path';
import { confirm } from '@inquirer/prompts';
import { t } from '../utils/i18n';
import { generateProjectOutline } from '../core/projectManager';

const GENDOC_WORKSPACE = path.resolve(process.cwd(), 'gendoc-workspace');
const PROJECTS_DIR = path.resolve(GENDOC_WORKSPACE, 'projects');

export async function outlineCommand(projectName: string) {
  const projectPath = path.resolve(PROJECTS_DIR, projectName);
  const projectJsonPath = path.resolve(projectPath, 'project.json');

  if (!fs.existsSync(projectJsonPath)) {
    console.error(t('project_not_found_error', { projectName: projectName }));
    return;
  }

  let project;
  try {
    const content = fs.readFileSync(projectJsonPath, 'utf-8');
    project = JSON.parse(content);
  } catch (error) {
    console.error(t('error_reading_project_json', { projectName: projectName }));
    return;
  }

  if (project.outline) {
    const overwrite = await confirm({
      message: t('confirm_overwrite_outline'),
      default: false,
    });
    if (!overwrite) {
      console.log(t('outline_generation_cancelled'));
      return;
    }
  }

  try {
    const generatedOutline = await generateProjectOutline(projectName, project.outline ? true : false);
    console.log(`✅ ${t('outline_generated_success', { projectName: projectName })}`);
    console.log('Generated Outline:', JSON.stringify(generatedOutline, null, 2));
  } catch (error: any) {
    console.error(`❌ ${t('outline_generation_failed', { error: error.message })}`);
  }
}
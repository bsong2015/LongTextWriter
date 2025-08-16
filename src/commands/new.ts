import { input, select } from '@inquirer/prompts';
import * as fs from 'fs';
import * as path from 'path';
import { t } from '../utils/i18n';
import { createProject } from '../core/projectManager';

const GENDOC_WORKSPACE = path.resolve(process.cwd(), 'gendoc-workspace');
const PROJECTS_DIR = path.resolve(GENDOC_WORKSPACE, 'projects');

export async function newCommand() {
  console.log(t('new_project_start_message'));

  if (!fs.existsSync(PROJECTS_DIR)) {
    fs.mkdirSync(PROJECTS_DIR, { recursive: true });
    console.log(t('new_project_workspace_created', { path: PROJECTS_DIR }));
  }

  const name = await input({
    message: t('new_project_name_prompt'),
    validate: (value) => {
      if (!value) return t('new_project_name_empty_error');
      const projectDir = path.resolve(PROJECTS_DIR, value);
      if (fs.existsSync(projectDir)) {
        return t('new_project_name_exists_error');
      }
      return true;
    },
  });

  const type = await select({
    message: t('new_project_type_prompt'),
    choices: [
      { name: t('project_type_book'), value: 'book', description: t('project_type_book_description') },
      { name: t('project_type_series'), value: 'series', description: t('project_type_series_description') },
      { name: t('project_type_templated'), value: 'templated', description: t('project_type_templated_description') },
    ],
  });

  let projectData: any = { name, type };

  switch (type) {
    case 'book':
    case 'series':
      projectData.language = await input({ message: t('new_project_language_prompt'), default: 'English' });
      projectData.summary = await input({ message: t('new_project_idea_prompt') });
      projectData.prompt = await input({ message: t('new_project_global_prompt') });
      break;
    case 'templated':
      projectData.sourcePath = await input({ message: t('new_project_templated_source_prompt') });
      projectData.templatePath = await input({ message: t('new_project_templated_template_prompt') });
      break;
    default:
      console.error(t('new_project_invalid_type_error'));
      return;
  }

  try {
    const newProject = createProject(projectData);
    console.log(`\n✅ ${t('project_created_success', { projectName: newProject.name })}`);
    console.log(`${t('project_type_display', { type: newProject.type })}`);
    console.log(`${t('project_path_display', { path: path.resolve(PROJECTS_DIR, newProject.name) })}`);
  } catch (error: any) {
    console.error(`\n❌ ${t('project_creation_failed')}: ${error.message}`);
  }
}
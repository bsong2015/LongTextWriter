import { input, select } from '@inquirer/prompts';
import { t } from '../utils/i18n';
import { createProject, getProjectList } from '../core/projectManager';

interface NewCommandOptions {
  type?: string;
  name?: string;
  lang?: string;
  summary?: string;
  prompt?: string;
  sources?: string[];
  template?: string;
}

export async function newCommand(options: NewCommandOptions = {}) {
  console.log(t('new_project_start_message'));

  try {
    const existingProjects = getProjectList().map(p => p.name);

    const name = options.name ?? await input({
      message: t('new_project_name_prompt'),
      validate: (value) => {
        if (!value) return t('new_project_name_empty_error');
        if (existingProjects.includes(value)) {
          return t('new_project_name_exists_error');
        }
        return true;
      },
    });

    let type = options.type;
    if (!type) {
      type = await select({
        message: t('new_project_type_prompt'),
        choices: [
          { name: t('project_type_book'), value: 'book', description: t('project_type_book_description') },
          { name: t('project_type_series'), value: 'series', description: t('project_type_series_description') },
          { name: t('project_type_templated'), value: 'templated', description: t('project_type_templated_description') },
        ],
      });
    } else if (!['book', 'series', 'templated'].includes(type)) {
      console.error(t('new_project_invalid_type_error'));
      return;
    }

    let projectData: any = { name, type };

    switch (type) {
      case 'book':
      case 'series':
        projectData.idea = {
          language: options.lang ?? await input({ message: t('new_project_language_prompt'), default: 'English' }),
          summary: options.summary ?? await input({ message: t('new_project_idea_prompt') }),
          prompt: options.prompt ?? await input({ message: t('new_project_global_prompt') }),
        };
        break;
      case 'templated':
        projectData.sources = options.sources ?? [await input({ message: t('new_project_templated_source_prompt') })];
        projectData.template = options.template ?? await input({ message: t('new_project_templated_template_prompt') });
        break;
    }

    const newProject = createProject(projectData);
    console.log(`
✅ ${t('project_created_success', { projectName: newProject.name })}`);
    console.log(`${t('project_type_display', { type: newProject.type })}`);

  } catch (error: any) {
    console.error(`
❌ ${t('project_creation_failed')}: ${error.message}`);
  }
}

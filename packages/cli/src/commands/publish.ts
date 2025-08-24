import { select } from '@inquirer/prompts';
import { getProjectDetails, publishProject } from '../core/projectManager';

export async function publishCommand(projectName: string) {
  const project = getProjectDetails(projectName);
  if (!project) {
    // getProjectDetails throws an error if not found, but for safety:
    console.error(`Error: Project '${projectName}' not found.`);
    return;
  }

  let publishType = 'single-markdown'; // Default for book and templated

  if (project.type === 'series') {
    publishType = await select({
      message: 'How would you like to publish this series?',
      choices: [
        {
          name: 'Single Markdown File',
          value: 'single-markdown',
          description: 'A single Markdown file containing all articles.',
        },
        {
          name: 'Multiple Markdown Files (Zipped)',
          value: 'multiple-markdown-zip',
          description: 'A ZIP file containing one Markdown file per article.',
        },
      ],
    });
  }

  try {
    console.log(`Publishing project '${projectName}'...
`);
    const result = await publishProject(projectName, publishType);
    console.log(`
🎉 ${result.message}
   File available at: ${result.filePath}
`);
  } catch (error: any) {
    console.error(`
❌ Error publishing project '${projectName}':
   ${error.message}
`);
  }
}
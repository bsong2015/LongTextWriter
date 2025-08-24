import { getProjectDetails } from '../core/projectManager';
import { t } from '../utils/i18n';

export async function statusCommand(projectName: string) {
  try {
    const details = getProjectDetails(projectName);

    console.log(`
======= ${t('status_project_header', { projectName: details.name })} =======`);
    console.log(`- ${t('status_project_type')}: ${details.type}`);
    const createdAtString = details.createdAt ? new Date(details.createdAt).toLocaleString() : t('status_not_available');
    console.log(`- ${t('status_project_created_at')}: ${createdAtString}`);

    if (details.status.type === 'progress') {
      console.log(`- ${t('status_project_progress')}: ${details.status.percentage}% (${details.status.done}/${details.status.total})`);
    } else {
      console.log(`- ${t('status_project_status')}: ${details.status.value}`);
    }

    if (details.outline) {
        console.log(`
--- ${t('status_outline_details')} ---`);
        console.log(`- ${t('status_outline_title')}: ${details.outline.title}`);
        const totalArticles = details.outline.chapters.reduce((acc, ch) => acc + ch.articles.length, 0);
        console.log(`- ${t('status_outline_structure')}: ${details.outline.chapters.length} ${t('status_outline_chapters')}, ${totalArticles} ${t('status_outline_articles')}`);
    }

    console.log(`
================================================${details.name.split('').map(()=>'=').join('')}========
`);

  } catch (error: any) {
    console.error(`
❌ ${t('status_fetch_error', { projectName, error: error.message })}
`);
  }
}

import { getProjectList } from '../core/projectManager';
import { t } from '../utils/i18n';

export function lsCommand() {
  const projectsData = getProjectList();

  if (projectsData.length === 0) {
    console.log(t('ls_no_projects_found'));
    console.log(t('ls_no_projects_hint'));
    return;
  }

  const formattedProjectsData = projectsData.map(project => ({
    [t('ls_header_project_name')]: project.name,
    [t('ls_header_type')]: project.type,
    [t('ls_header_status')]: project.status,
    [t('ls_header_created_at')]: project.createdAt,
  }));

  console.log(`\n${t('ls_projects_header')}\n`);
  console.table(formattedProjectsData);
}
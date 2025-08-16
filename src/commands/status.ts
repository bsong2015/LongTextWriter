import * as fs from 'fs';
import * as path from 'path';
import { Project, BookProject, SeriesProject, TemplatedProject, GeneratedContentSchema, ProjectSchema, BookOutline, GeneratedContent } from '../types';

const GENDOC_WORKSPACE = path.resolve(process.cwd(), 'gendoc-workspace');
const PROJECTS_DIR = path.resolve(GENDOC_WORKSPACE, 'projects');

// Define types for chapter and article to avoid implicit any
type ChapterOutline = BookOutline['chapters'][0];
type ChapterGenerated = GeneratedContent['chapters'][0];
type ArticleGenerated = ChapterGenerated['articles'][0];

async function loadProject(projectName: string): Promise<Project | null> {
  const projectJsonPath = path.resolve(PROJECTS_DIR, projectName, 'project.json');
  if (!fs.existsSync(projectJsonPath)) {
    console.error(`Error: Project '${projectName}' not found.`);
    return null;
  }
  try {
    const content = fs.readFileSync(projectJsonPath, 'utf-8');
    return ProjectSchema.parse(JSON.parse(content));
  } catch (error) {
    console.error(`Error reading or parsing project.json for '${projectName}':`, error);
    return null;
  }
}

function displayBookOrSeriesStatus(project: BookProject | SeriesProject) {
  console.log(`\n- Type: ${project.type}`);
  console.log(`- Created At: ${project.createdAt ? new Date(project.createdAt).toLocaleString() : 'N/A'}`);
  
  if (!project.outline) {
    console.log('\nStatus: Outline not generated yet.');
    console.log(`Run \`gendoc outline ${project.name}\` to start.`);
    return;
  }

  const totalArticles = project.outline.chapters.reduce((acc: number, ch: ChapterOutline) => acc + ch.articles.length, 0);
  console.log(`\n- Outline: ${project.outline.chapters.length} chapters, ${totalArticles} articles.`);

  const generatedJsonPath = path.resolve(PROJECTS_DIR, project.name, 'generated.json');
  if (!fs.existsSync(generatedJsonPath)) {
    console.log('\nStatus: Content generation has not started yet.');
    console.log(`Run \`gendoc run ${project.name}\` to begin generating content.`);
    return;
  }

  const genContent = GeneratedContentSchema.parse(JSON.parse(fs.readFileSync(generatedJsonPath, 'utf-8')));
  let doneCount = 0;
  let errorCount = 0;

  genContent.chapters.forEach((ch: ChapterGenerated) => {
      ch.articles.forEach((art: ArticleGenerated) => {
          if (art.status === 'done') doneCount++;
          if (art.status === 'error') errorCount++;
      });
  });

  const percentage = totalArticles > 0 ? Math.round((doneCount / totalArticles) * 100) : 0;
  console.log(`\n- Progress: ${percentage}% (${doneCount}/${totalArticles} articles generated)`);
  if (errorCount > 0) {
      console.log(`- Errors: ${errorCount} article(s) failed to generate.`);
  }

  console.log('\n--- Content Details ---');
  for (const chapter of genContent.chapters) {
      console.log(`\nChapter: ${chapter.title}`);
      for (const article of chapter.articles) {
          const statusTag = `[${article.status.toUpperCase()}]`.padEnd(10, ' ');
          console.log(`  ${statusTag} ${article.title}`);
      }
  }
}

function displayTemplatedStatus(project: TemplatedProject) {
    console.log(`\n- Type: ${project.type}`);
    console.log(`- Created At: ${project.createdAt ? new Date(project.createdAt).toLocaleString() : 'N/A'}`);
    console.log(`- Source(s): ${project.sources.join(', ')}`);
    console.log(`- Template: ${project.template}`);

    const outputPath = path.resolve(PROJECTS_DIR, project.name, 'output', `${project.name}.md`);
    if (fs.existsSync(outputPath)) {
        console.log('\nStatus: COMPLETED');
        console.log(`Find the generated document at: ${outputPath}`);
    } else {
        console.log('\nStatus: PENDING');
        console.log(`Run \`gendoc run ${project.name}\` to generate the document.`);
    }
}

export async function statusCommand(projectName: string) {
  const project = await loadProject(projectName);
  if (!project) return;

  console.log(`\n======= Project Status: ${project.name} =======`);

  switch (project.type) {
    case 'book':
    case 'series':
      displayBookOrSeriesStatus(project);
      break;
    case 'templated':
      displayTemplatedStatus(project);
      break;
  }
  console.log(`\n===============================================\n`);
}
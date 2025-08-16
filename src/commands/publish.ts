

import * as fs from 'fs';
import * as path from 'path';
import { select } from '@inquirer/prompts';
import { Project, BookProject, SeriesProject, TemplatedProject, GeneratedContent, GeneratedContentSchema, ProjectSchema } from '../types';

const GENDOC_WORKSPACE = path.resolve(process.cwd(), 'gendoc-workspace');
const PROJECTS_DIR = path.resolve(GENDOC_WORKSPACE, 'projects');

// Define types for chapter and article to avoid implicit any
type ChapterGenerated = GeneratedContent['chapters'][0];
type ArticleGenerated = ChapterGenerated['articles'][0];

// --- UTILITY FUNCTIONS ---

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

function getGeneratedContent(projectName: string): GeneratedContent | null {
    const generatedContentPath = path.resolve(PROJECTS_DIR, projectName, 'generated.json');
    if (!fs.existsSync(generatedContentPath)) {
        console.error(`Error: generated.json not found for project '${projectName}'. Please run the 'run' command first.`);
        return null;
    }
    try {
        const rawContent = fs.readFileSync(generatedContentPath, 'utf-8');
        return GeneratedContentSchema.parse(JSON.parse(rawContent));
    } catch (error) {
        console.error(`Error reading or parsing generated.json:`, error);
        return null;
    }
}

// --- PUBLISHING LOGIC ---

async function publishBookOrSeries(project: BookProject | SeriesProject) {
  console.log(`Publishing ${project.type} '${project.name}'...`);
  const content = getGeneratedContent(project.name);
  if (!content) return;

  // Verify completion
  const allDone = content.chapters.every((ch: ChapterGenerated) => ch.articles.every((art: ArticleGenerated) => art.status === 'done'));
  if (!allDone) {
    console.error("Error: Not all articles have been generated successfully. Please complete the 'run' command first.");
    return;
  }

  const outputDir = path.resolve(PROJECTS_DIR, project.name, 'output');
  fs.mkdirSync(outputDir, { recursive: true });

  let publishType = 'single';
  if (project.type === 'series') {
    publishType = await select({
        message: 'How would you like to publish this series?',
        choices: [
            { name: 'Single File', value: 'single', description: 'A single Markdown file containing all articles.' },
            { name: 'Separate Files', value: 'separate', description: 'One Markdown file per article.' },
        ]
    });
  }

  if (publishType === 'single') {
    const markdownParts = [`# ${content.title}\n`];
    for (const chapter of content.chapters) {
      markdownParts.push(`## ${chapter.title}\n`);
      if(chapter.summary) markdownParts.push(`${chapter.summary}\n`);
      for (const article of chapter.articles) {
        markdownParts.push(`### ${article.title}\n`);
        markdownParts.push(`${article.content}\n`);
      }
    }
    const finalMarkdown = markdownParts.join('\n---\n\n');
    const outputPath = path.resolve(outputDir, `${project.name}.md`);
    fs.writeFileSync(outputPath, finalMarkdown);
    console.log(`\n🎉 Successfully published to a single file:\n   ${outputPath}`);
  } else { // separate files
    for (const chapter of content.chapters) {
        const chapterDir = path.resolve(outputDir, chapter.title.replace(/[^a-z0-9]/gi, '_').toLowerCase());
        fs.mkdirSync(chapterDir, { recursive: true });
        for (const article of chapter.articles) {
            const articleMarkdown = `# ${article.title}\n\n${article.content}`;
            const articlePath = path.resolve(chapterDir, `${article.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`);
            fs.writeFileSync(articlePath, articleMarkdown);
        }
    }
    console.log(`\n🎉 Successfully published to separate files in:\n   ${outputDir}`);
  }
}

async function publishTemplatedDocument(project: TemplatedProject) {
  console.log(`Checking status for templated document '${project.name}'...`);
  const outputPath = path.resolve(PROJECTS_DIR, project.name, 'output', `${project.name}.md`);

  if (fs.existsSync(outputPath)) {
    console.log(`\n✅ Document is already generated and available at:\n   ${outputPath}`);
  } else {
    console.error(`Error: Output file not found. Please run \`gendoc run ${project.name}\` to generate the document first.`);
  }
}

// --- MAIN COMMAND ---

export async function publishCommand(projectName: string) {
  const project = await loadProject(projectName);
  if (!project) return;

  switch (project.type) {
    case 'book':
    case 'series':
      await publishBookOrSeries(project);
      break;
    case 'templated':
      await publishTemplatedDocument(project);
      break;
    default:
      console.error(`Unknown project type.`);
      break;
  }
}

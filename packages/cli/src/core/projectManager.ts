import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Project, GeneratedContentSchema, ProjectSchema, BookOutline, GeneratedContent, BookProjectSchema, SeriesProjectSchema, TemplatedProjectSchema, BookProject, SeriesProject, TemplatedProject, ProjectDetail, PublishResult, ProjectStatus, getProjectsPath, getWorkspacePath } from '@gendoc/shared';
import { t } from '../utils/i18n';
import { generateOutline as llmGenerateOutline, generateArticleContent, summarizeText } from './llmService';
import { BookOutlineSchema } from '@gendoc/shared'; // Explicitly import BookOutlineSchema

const PROJECTS_DIR = getProjectsPath();

type ChapterOutline = BookOutline['chapters'][0];
type ArticleOutline = ChapterOutline['articles'][0];
type ArticleGenerated = GeneratedContent['chapters'][0]['articles'][0];
type ChapterGenerated = GeneratedContent['chapters'][0]; // Ensure this is correctly defined and used

function assertNever(value: never): never {
  throw new Error(`Unhandled discriminated union member: ${JSON.stringify(value)}`);
}

function saveProject(project: Project) {
  const projectJsonPath = path.resolve(PROJECTS_DIR, project.name, 'project.json');
  fs.writeFileSync(projectJsonPath, JSON.stringify(project, null, 2));
}

// --- UTILITY FUNCTIONS ---

function getGeneratedContentPath(projectName: string): string {
  return path.resolve(PROJECTS_DIR, projectName, 'generated.json');
}

function saveGeneratedContent(projectName: string, content: GeneratedContent) {
  const filePath = getGeneratedContentPath(projectName);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
}

function buildContext(project: Project, content: GeneratedContent, currentChapterTitle: string, currentArticleTitle: string): string {
    let context = `The overall goal is to write a ${project.type} titled "${content.title}".\n`;

    if (project.type === 'book' || project.type === 'series') {
        context += `Global idea: ${project.idea.summary}\n`;
        context += `Language: ${project.idea.language}\n`;
    } else if (project.type === 'templated') {
        const projectDir = path.resolve(PROJECTS_DIR, project.name);
        const sourceContent = project.sources.map(src => {
            const srcPath = path.resolve(projectDir, src);
            if (!fs.existsSync(srcPath)) return ''; // Or throw an error
            return fs.readFileSync(srcPath, 'utf-8');
        }).join('\n\n---\n\n');
        context += `Global Context from Source Files:\n${sourceContent}\n`;
    }

    context += `---CONTEXT---\n`;

    for (const chapter of content.chapters) {
        if(chapter.summary) {
            context += `Summary of previous chapter "${chapter.title}": ${chapter.summary}\n`;
        }
        if (chapter.title === currentChapterTitle) {
            for (const article of chapter.articles) {
                if (article.summary && article.title !== currentArticleTitle) {
                    context += `Summary of previous article "${article.title}": ${article.summary}\n`;
                }
            }
            break;
        }
    }

    context += `---TASK---\n`;
    context += `You are now writing the article "${currentArticleTitle}" within the chapter "${currentChapterTitle}".\n`;
    context += `Please write the full content for this article.`;
    return context;
}

// --- CORE FUNCTIONS ---

export function getProjectList() {
  if (!fs.existsSync(PROJECTS_DIR)) {
    return [];
  }

  const projectDirs = fs.readdirSync(PROJECTS_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  const projectsData = projectDirs.map(dirName => {
    const projectJsonPath = path.resolve(PROJECTS_DIR, dirName, 'project.json');
    let project: Project | null = null;
    let status: ProjectStatus = { type: 'text', value: t('status_unknown') };

    if (fs.existsSync(projectJsonPath)) {
      try {
        const content = fs.readFileSync(projectJsonPath, 'utf-8');
        project = ProjectSchema.parse(JSON.parse(content));

        // Determine status based on generationStatus first
        if (project.generationStatus === 'running') {
            const generatedJsonPath = getGeneratedContentPath(dirName);
            if (fs.existsSync(generatedJsonPath)) {
                const genContent = GeneratedContentSchema.parse(JSON.parse(fs.readFileSync(generatedJsonPath, 'utf-8')));
                const totalArticles = project.outline?.chapters.reduce((acc: number, ch: ChapterOutline) => acc + ch.articles.length, 0) || 0;
                const doneArticles = genContent.chapters.reduce((acc: number, ch) => acc + ch.articles.filter((art: ArticleGenerated) => art.status === 'done').length, 0);
                const percentage = totalArticles > 0 ? Math.round((doneArticles / totalArticles) * 100) : 0;
                status = { type: 'progress', percentage, done: doneArticles, total: totalArticles };
            } else {
                // Should not happen if generationStatus is 'running' but no generated.json
                status = { type: 'text', value: t('status_generating_no_progress') };
            }
        } else if (project.generationStatus === 'completed') {
            status = { type: 'icon', value: 'completed' };
        } else if (project.generationStatus === 'error') {
            status = { type: 'icon', value: 'error' };
        } else { // project.generationStatus === 'idle'
            if (project?.type === 'book' || project?.type === 'series' || project?.type === 'templated') {
                const generatedJsonPath = getGeneratedContentPath(dirName);
                if (fs.existsSync(generatedJsonPath)) {
                    const genContent = GeneratedContentSchema.parse(JSON.parse(fs.readFileSync(generatedJsonPath, 'utf-8')));
                    const totalArticles = project.outline?.chapters.reduce((acc: number, ch: ChapterOutline) => acc + ch.articles.length, 0) || 0;
                    const doneArticles = genContent.chapters.reduce((acc: number, ch) => acc + ch.articles.filter((art: ArticleGenerated) => art.status === 'done').length, 0);
                    const percentage = totalArticles > 0 ? Math.round((doneArticles / totalArticles) * 100) : 0;
                    // If idle but has generated content, it's a paused progress
                    status = { type: 'progress', percentage, done: doneArticles, total: totalArticles };
                } else {
                    status = { type: 'text', value: t('status_not_started') };
                }
            }
        }

      } catch (error) {
        status = { type: 'text', value: t('status_invalid_project_json') };
      }
    } 

    return {
      name: project?.name || dirName,
      type: project?.type || t('status_unknown'),
      status: status,
      createdAt: project?.createdAt ? new Date(project.createdAt).toLocaleString() : '-',
    };
  });

  return projectsData;
}

export function getProjectDetails(projectName: string) {
  const projectPath = path.resolve(PROJECTS_DIR, projectName);
  const projectJsonPath = path.resolve(projectPath, 'project.json');

  if (!fs.existsSync(projectJsonPath)) {
    throw new Error(t('project_not_found_error', { projectName: projectName }));
  }

  try {
    const content = fs.readFileSync(projectJsonPath, 'utf-8');
    const project = ProjectSchema.parse(JSON.parse(content));

    let status: ProjectStatus = { type: 'text', value: t('status_unknown') };

    // Determine status based on generationStatus first
    if (project.generationStatus === 'running') {
        const generatedJsonPath = getGeneratedContentPath(projectName);
        if (fs.existsSync(generatedJsonPath)) {
            const genContent = GeneratedContentSchema.parse(JSON.parse(fs.readFileSync(generatedJsonPath, 'utf-8')));
            const totalArticles = project.outline?.chapters.reduce((acc: number, ch: ChapterOutline) => acc + ch.articles.length, 0) || 0;
            const doneArticles = genContent.chapters.reduce((acc: number, ch) => acc + ch.articles.filter((art: ArticleGenerated) => art.status === 'done').length, 0);
            const percentage = totalArticles > 0 ? Math.round((doneArticles / totalArticles) * 100) : 0;
            status = { type: 'progress', percentage, done: doneArticles, total: totalArticles };
        } else {
            // Should not happen if generationStatus is 'running' but no generated.json
            status = { type: 'text', value: t('status_generating_no_progress') };
        }
    } else if (project.generationStatus === 'completed') {
        status = { type: 'icon', value: 'completed' };
    } else if (project.generationStatus === 'error') {
        status = { type: 'icon', value: 'error' };
    } else { // project.generationStatus === 'idle'
        if (project?.type === 'book' || project?.type === 'series' || project?.type === 'templated') {
            const generatedJsonPath = getGeneratedContentPath(projectName);
            if (fs.existsSync(generatedJsonPath)) {
                const genContent = GeneratedContentSchema.parse(JSON.parse(fs.readFileSync(generatedJsonPath, 'utf-8')));
                const totalArticles = project.outline?.chapters.reduce((acc: number, ch: ChapterOutline) => acc + ch.articles.length, 0) || 0;
                const doneArticles = genContent.chapters.reduce((acc: number, ch) => acc + ch.articles.filter((art: ArticleGenerated) => art.status === 'done').length, 0);
                const percentage = totalArticles > 0 ? Math.round((doneArticles / totalArticles) * 100) : 0;
                // If idle but has generated content, it's a paused progress
                status = { type: 'progress', percentage, done: doneArticles, total: totalArticles };
            } else {
                status = { type: 'text', value: t('status_not_started') };
            }
        }
    }

    return { ...project, status };

  } catch (error) {
    console.error('Error reading project details:', error);
    throw new Error(t('error_reading_project_details', { projectName: projectName }));
  }
}

export function getGeneratedProjectContent(projectName: string): GeneratedContent | null {
  const generatedContentPath = getGeneratedContentPath(projectName);
  if (!fs.existsSync(generatedContentPath)) {
    return null; // Return null if generated.json doesn't exist
  }
  try {
    const content = fs.readFileSync(generatedContentPath, 'utf-8');
    return GeneratedContentSchema.parse(JSON.parse(content));
  } catch (error) {
    console.error('Error reading generated project content:', error);
    throw new Error(t('error_reading_generated_project_content', { projectName: projectName }));
  }
}

export function saveGeneratedProjectContent(projectName: string, content: GeneratedContent) {
  try {
    saveGeneratedContent(projectName, content); // Re-use existing internal function
  } catch (error) {
    console.error('Error saving generated project content:', error);
    throw new Error(t('error_saving_generated_project_content', { projectName: projectName }));
  }
}

export function getProjectOutline(projectName: string): BookOutline | undefined {
  const projectPath = path.resolve(PROJECTS_DIR, projectName);
  const projectJsonPath = path.resolve(projectPath, 'project.json');

  if (!fs.existsSync(projectJsonPath)) {
    throw new Error(t('project_not_found_error', { projectName: projectName }));
  }

  let project: Project;
  try {
    const content = fs.readFileSync(projectJsonPath, 'utf-8');
    project = ProjectSchema.parse(JSON.parse(content));
  } catch (error) {
    throw new Error(t('error_reading_project_json', { projectName: projectName }));
  }

  // The outline can exist on any project type that supports it.
  return project.outline;
}

export async function generateProjectOutline(projectName: string, overwrite: boolean = false) {
  const projectPath = path.resolve(PROJECTS_DIR, projectName);
  const projectJsonPath = path.resolve(projectPath, 'project.json');

  if (!fs.existsSync(projectJsonPath)) {
    throw new Error(t('project_not_found_error', { projectName: projectName }));
  }

  let project: Project;
  try {
    const content = fs.readFileSync(projectJsonPath, 'utf-8');
    project = ProjectSchema.parse(JSON.parse(content));
  } catch (error) {
    throw new Error(t('error_reading_project_json', { projectName: projectName }));
  }

  if (project.outline && !overwrite) {
    throw new Error(t('outline_exists_no_overwrite'));
  }

  try {
    const outline = await llmGenerateOutline(project, PROJECTS_DIR);
    project.outline = outline;
    fs.writeFileSync(projectJsonPath, JSON.stringify(project, null, 2));
    return outline; // Return the generated outline
  } catch (error: any) {
    console.error('An error occurred during outline generation:', error);
    throw new Error(t('outline_generation_failed', { error: error.message }));
  }
}

// --- Content Generation ---

export type ProgressPayload = {
  total: number;
  done: number;
  currentTitle: string;
};

export type ProgressCallback = (payload: ProgressPayload) => void;

async function runOutlineBasedGeneration(project: Project, onProgress?: ProgressCallback) {
  if (!project.outline) {
    throw new Error(t('no_outline_found', { projectName: project.name }));
  }

  const generatedContentPath = getGeneratedContentPath(project.name);
  let content: GeneratedContent;

  if (fs.existsSync(generatedContentPath)) {
    const existingContent = JSON.parse(fs.readFileSync(generatedContentPath, 'utf-8'));
    content = GeneratedContentSchema.parse(existingContent);
  } else {
    content = GeneratedContentSchema.parse({
      title: project.outline.title,
      chapters: project.outline.chapters.map((ch: ChapterOutline) => ({
        ...ch,
        articles: ch.articles.map((art: ArticleOutline) => ({ ...art, status: 'pending' })),
      })),
    });
  }

  const totalArticles = content.chapters.reduce((acc, ch) => acc + ch.articles.length, 0);
  let doneArticles = content.chapters.reduce((acc, ch) => acc + ch.articles.filter(art => art.status === 'done').length, 0);

  for (const chapter of content.chapters) {
    for (const article of chapter.articles) {
      if (article.status === 'pending' || article.status === 'error') {
        try {
          article.status = 'writing';
          saveGeneratedContent(project.name, content);
          onProgress?.({ total: totalArticles, done: doneArticles, currentTitle: article.title });

          const context = buildContext(project, content, chapter.title, article.title);
          article.content = await generateArticleContent(context);

          article.summary = await summarizeText(article.content, 'article');

          article.status = 'done';
          doneArticles++;
          saveGeneratedContent(project.name, content);
          onProgress?.({ total: totalArticles, done: doneArticles, currentTitle: article.title });


        } catch (error: any) {
          article.status = 'error';
          saveGeneratedContent(project.name, content);
          throw new Error(t('article_generation_failed', { articleTitle: article.title, error: error.message }));
        }
      }
    }

    if (!chapter.summary) {
        const chapterArticles = chapter.articles.filter((a: ArticleGenerated) => a.status === 'done');
        if (chapterArticles.length === chapter.articles.length) {
            const articlesForSummary = chapterArticles.map((a: ArticleGenerated) => `Article: ${a.title}\nSummary: ${a.summary}`).join('\n\n');
            chapter.summary = await summarizeText(articlesForSummary, 'chapter');
            saveGeneratedContent(project.name, content);
        }
    }
  }

  return content;
}

export async function startContentGeneration(projectName: string, onProgress?: ProgressCallback) {
  const project = getProjectDetails(projectName);
  if (!project) {
    throw new Error(t('project_not_found_error', { projectName: projectName }));
  }

  // Set project status to running before starting generation
  project.generationStatus = 'running';
  saveProject(project);

  try {
    let result;
    switch (project.type) {
      case 'book':
      case 'series':
      case 'templated':
        result = await runOutlineBasedGeneration(project, onProgress);
        break;
      default:
        return assertNever(project as never);
    }
    // Set project status to completed after successful generation
    project.generationStatus = 'completed';
    saveProject(project);
    return result;
  } catch (error) {
    // Set project status to error if generation fails
    project.generationStatus = 'error';
    saveProject(project);
    throw error; // Re-throw the error for the caller to handle
  }
}

export async function saveProjectOutline(projectName: string, outline: BookOutline) {
  const projectPath = path.resolve(PROJECTS_DIR, projectName);
  const projectJsonPath = path.resolve(projectPath, 'project.json');

  if (!fs.existsSync(projectJsonPath)) {
    throw new Error(t('project_not_found_error', { projectName: projectName }));
  }

  let project: Project;
  try {
    const content = fs.readFileSync(projectJsonPath, 'utf-8');
    project = ProjectSchema.parse(JSON.parse(content));
  } catch (error) {
    throw new Error(t('error_reading_project_json', { projectName: projectName }));
  }

  const validationResult = BookOutlineSchema.safeParse(outline);
  if (!validationResult.success) {
    throw new Error(t('outline_schema_mismatch', { errors: JSON.stringify(validationResult.error.errors) }));
  }

  project.outline = validationResult.data;

  try {
    fs.writeFileSync(projectJsonPath, JSON.stringify(project, null, 2));
  } catch (error) {
    console.error('Error saving project outline:', error);
    throw new Error(t('outline_save_failed'));
  }
}

import archiver from 'archiver';

// ... (rest of the file) 

export async function publishProject(projectName: string, publishType: string): Promise<PublishResult> {
  const project = getProjectDetails(projectName);
  if (!project) {
    throw new Error(t('project_not_found_error', { projectName: projectName }));
  }

  const projectDir = path.resolve(PROJECTS_DIR, projectName);
  const outputDir = path.resolve(projectDir, 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let contentToPublish = '';
  let relativePublishedFilePath: string; // Declare once
  let relativeZipFilePath: string; // Declare once

  async function zipDirectory(sourceDir: string, outPath: string): Promise<string> {
  const archive = archiver('zip', { zlib: { level: 9 } });
  const output = fs.createWriteStream(outPath);

  return new Promise((resolve, reject) => {
    output.on('close', () => {
      console.log(`Archiver has been finalized and the output file ${outPath} (${archive.pointer()} bytes) created.`);
      resolve(outPath);
    });
    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        console.warn('Archiver warning:', err);
      } else {
        reject(err);
      }
    });
    archive.on('error', (err) => reject(err));

    archive.pipe(output);
    archive.directory(sourceDir, false); // Append the directory from root of archive
    archive.finalize();
  });
}

// ... (inside publishProject function)

  let publishedFilePath: string;

  switch (project.type) {
    case 'book':
    case 'templated': // Templated also publishes as a single MD file
      const bookGeneratedContentPath = getGeneratedContentPath(projectName);
      if (!fs.existsSync(bookGeneratedContentPath)) {
        throw new Error(t('no_generated_content_found', { projectName: projectName }));
      }
      const bookGeneratedContent = GeneratedContentSchema.parse(JSON.parse(fs.readFileSync(bookGeneratedContentPath, 'utf-8')));
      
      contentToPublish = bookGeneratedContent.chapters.map(chapter => {
        let chapterContent = `## ${chapter.title}\n\n`;
        chapterContent += chapter.articles.map(article => `### ${article.title}\n\n${article.content || ''}`).join('\n\n');
        return chapterContent;
      }).join('\n\n');

      publishedFilePath = path.resolve(outputDir, `${projectName}.md`);
      fs.writeFileSync(publishedFilePath, contentToPublish, 'utf-8');
      relativePublishedFilePath = path.relative(getWorkspacePath(), publishedFilePath);
      return { message: t('project_published_success', { outputPath: publishedFilePath }), filePath: relativePublishedFilePath };

    case 'series':
      const seriesGeneratedContentPath = getGeneratedContentPath(projectName);
      if (!fs.existsSync(seriesGeneratedContentPath)) {
        throw new Error(t('no_generated_content_found', { projectName: projectName }));
      }
      const seriesGeneratedContent = GeneratedContentSchema.parse(JSON.parse(fs.readFileSync(seriesGeneratedContentPath, 'utf-8')));

      if (publishType === 'single-markdown') {
        contentToPublish = seriesGeneratedContent.chapters.map(chapter => {
          let chapterContent = `## ${chapter.title}\n\n`;
          chapterContent += chapter.articles.map(article => `### ${article.title}\n\n${article.content || ''}`).join('\n\n');
          return chapterContent;
        }).join('\n\n');
        publishedFilePath = path.resolve(outputDir, `${projectName}.md`);
        fs.writeFileSync(publishedFilePath, contentToPublish, 'utf-8');
        relativePublishedFilePath = path.relative(getWorkspacePath(), publishedFilePath);
        return { message: t('project_published_success', { outputPath: publishedFilePath }), filePath: relativePublishedFilePath };

      } else if (publishType === 'multiple-markdown-zip') {
        const tempDir = path.resolve(outputDir, 'temp_articles');
        if (fs.existsSync(tempDir)) {
          fs.rmSync(tempDir, { recursive: true, force: true });
        }
        fs.mkdirSync(tempDir, { recursive: true });

        for (const chapter of seriesGeneratedContent.chapters) {
          const chapterDir = path.resolve(tempDir, chapter.title
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9\u4e00-\u9fff-]/g, ''));
          fs.mkdirSync(chapterDir, { recursive: true });
          for (const article of chapter.articles) {
            const articleFileName = `${article.title
              .toLowerCase()
              .replace(/\s+/g, '-')
              .replace(/[^a-z0-9\u4e00-\u9fff-]/g, '')
            }.md`;
            fs.writeFileSync(path.resolve(chapterDir, articleFileName), article.content || '', 'utf-8');
          }
        }
        const zipFilePath = path.resolve(outputDir, `${projectName}.zip`);
        await zipDirectory(tempDir, zipFilePath);
        fs.rmSync(tempDir, { recursive: true, force: true });
        relativeZipFilePath = path.relative(getWorkspacePath(), zipFilePath);
        return { message: t('project_published_success_zip', { outputPath: zipFilePath }), filePath: relativeZipFilePath };

      } else {
        throw new Error(t('unsupported_series_publish_type', { publishType: publishType }));
      }

    default:
      return assertNever(project as never);
  }
}

export function createProject(projectData: any) {
  const PROJECTS_DIR = getProjectsPath();
  if (!fs.existsSync(PROJECTS_DIR)) {
    fs.mkdirSync(PROJECTS_DIR, { recursive: true });
  }

  const name = projectData.name;
  const type: Project['type'] = projectData.type; // Explicitly type 'type'
  const rest = { ...projectData }; // Keep rest of the properties

  const projectDir = path.resolve(PROJECTS_DIR, name);
  if (fs.existsSync(projectDir)) {
    throw new Error(t('new_project_name_exists_error'));
  }

  let validatedData: Project;
  switch (type) {
    case 'book':
      validatedData = BookProjectSchema.parse({
        name,
        type,
        createdAt: new Date().toISOString(),
        idea: { language: rest.idea.language, summary: rest.idea.summary, prompt: rest.idea.prompt },
      });
      break;
    case 'series':
      validatedData = SeriesProjectSchema.parse({
        name,
        type,
        createdAt: new Date().toISOString(),
        idea: { language: rest.idea.language, summary: rest.idea.summary, prompt: rest.idea.prompt },
      });
      break;
    case 'templated':
      validatedData = TemplatedProjectSchema.parse({
        name,
        type: 'templated',
        createdAt: new Date().toISOString(),
        sources: rest.sources,
        template: rest.template,
      });
      break;
    default:
      assertNever(type);
  }

  fs.mkdirSync(projectDir, { recursive: true });
  fs.writeFileSync(path.resolve(projectDir, 'project.json'), JSON.stringify(validatedData, null, 2));

  if (type === 'templated') {
    const sourcesDir = path.resolve(projectDir, 'sources');
    const templatesDir = path.resolve(projectDir, 'templates');
    fs.mkdirSync(sourcesDir, { recursive: true });
    fs.mkdirSync(templatesDir, { recursive: true });
  }

  return validatedData;
}

export function deleteProject(projectName: string) {
  const projectPath = path.resolve(PROJECTS_DIR, projectName);

  if (!fs.existsSync(projectPath)) {
    throw new Error(t('project_not_found_error', { projectName: projectName }));
  }

  try {
    fs.rmSync(projectPath, { recursive: true, force: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    throw new Error(t('project_delete_error', { projectName: projectName }));
  }
}

export function resetStaleGenerationStatuses() {
  const projects = getProjectList(); // Get all projects
  for (const projectSummary of projects) {
    try {
      const project = getProjectDetails(projectSummary.name); // Get full project details
      if (project.generationStatus === 'running') {
        console.warn(`Resetting stale generation status for project: ${project.name}`);
        project.generationStatus = 'idle';
        saveProject(project);
      }
    } catch (error) {
      console.error(`Error resetting stale status for project ${projectSummary.name}:`, error);
    }
  }
}

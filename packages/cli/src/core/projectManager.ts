import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Project, GeneratedContentSchema, ProjectSchema, BookOutline, GeneratedContent, BookProjectSchema, SeriesProjectSchema, TemplatedProjectSchema, BookProject, SeriesProject, TemplatedProject, ProjectDetail, PublishResult, ProjectStatus } from '@gendoc/shared';
import { t } from '../utils/i18n';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { PROMPT_OUTLINE_SYSTEM, PROMPT_OUTLINE_HUMAN, PROMPT_EXTRACT_OUTLINE_SYSTEM, PROMPT_ARTICLE_SYSTEM, PROMPT_SUMMARY_ARTICLE_SYSTEM, PROMPT_SUMMARY_CHAPTER_SYSTEM, PROMPT_TEMPLATED_SYSTEM, PROMPT_TEMPLATED_HUMAN } from '../core/prompts';
import { BookOutlineSchema } from '@gendoc/shared'; // Explicitly import BookOutlineSchema

const isMockLLM = process.env.MOCK_LLM === 'true';

class MockChatOpenAI {
    async invoke(messages: any[]): Promise<AIMessage> {
        console.log("MOCK LLM: Returning dummy response.");

        const messageContent = messages.map(msg => msg.content).join('\n');

        // For outline generation
        if (messageContent.includes('outline')) {
            const mockOutline: BookOutline = {
                title: "Mock Outline Title",
                chapters: [
                    {
                        title: "Mock Chapter 1",
                        articles: [
                            { title: "Mock Article 1.1" },
                            { title: "Mock Article 1.2" }
                        ]
                    },
                    {
                        title: "Mock Chapter 2",
                        articles: [
                            { title: "Mock Article 2.1" }
                        ]
                    }
                ]
            };
            return new AIMessage({
                content: `\
${JSON.stringify(mockOutline, null, 2)}\
`
            });
        }

        // For article generation
        if (messageContent.includes('PROMPT_ARTICLE_SYSTEM')) {
            return new AIMessage({ content: "This is mock generated article content based on the context." });
        }

        // For summary generation
        if (messageContent.includes('PROMPT_SUMMARY_ARTICLE_SYSTEM') || messageContent.includes('PROMPT_SUMMARY_CHAPTER_SYSTEM')) {
            return new AIMessage({ content: "This is a mock summary of the provided content." });
        }

        // For templated generation
        if (messageContent.includes('PROMPT_TEMPLATED_SYSTEM')) {
            return new AIMessage({ content: "This is mock templated content filling a placeholder." });
        }

        // Default fallback
        return new AIMessage({ content: "Default mock response from LLM." });
    }
}


let GENDOC_WORKSPACE: string;

if (process.env.NODE_ENV === 'production') {
  // For installed package, use user's home directory
  GENDOC_WORKSPACE = path.resolve(os.homedir(), '.gendoc-workspace');
} else {
  // For local development, use the project root
  GENDOC_WORKSPACE = path.resolve(__dirname, '..', '..', '..', '..', 'gendoc-workspace');
}

const PROJECTS_DIR = path.resolve(GENDOC_WORKSPACE, 'projects');

type ChapterOutline = BookOutline['chapters'][0];
type ArticleOutline = ChapterOutline['articles'][0];
type ArticleGenerated = GeneratedContent['chapters'][0]['articles'][0];
type ChapterGenerated = GeneratedContent['chapters'][0]; // Ensure this is correctly defined and used

function assertNever(value: never): never {
  throw new Error(`Unhandled discriminated union member: ${JSON.stringify(value)}`);
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

        if (project?.type === 'book' || project?.type === 'series' || project?.type === 'templated') {
            const generatedJsonPath = getGeneratedContentPath(dirName);
            if (fs.existsSync(generatedJsonPath)) {
                const genContent = GeneratedContentSchema.parse(JSON.parse(fs.readFileSync(generatedJsonPath, 'utf-8')));
                const totalArticles = project.outline?.chapters.reduce((acc: number, ch: ChapterOutline) => acc + ch.articles.length, 0) || 0;
                const doneArticles = genContent.chapters.reduce((acc: number, ch) => acc + ch.articles.filter((art: ArticleGenerated) => art.status === 'done').length, 0);
                const percentage = totalArticles > 0 ? Math.round((doneArticles / totalArticles) * 100) : 0;
                status = { type: 'progress', percentage, done: doneArticles, total: totalArticles };
            } else {
                status = { type: 'text', value: t('status_not_started') };
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

    if (project?.type === 'book' || project?.type === 'series' || project?.type === 'templated') {
        const generatedJsonPath = getGeneratedContentPath(projectName);
        if (fs.existsSync(generatedJsonPath)) {
            const genContent = GeneratedContentSchema.parse(JSON.parse(fs.readFileSync(generatedJsonPath, 'utf-8')));
            const totalArticles = project.outline?.chapters.reduce((acc: number, ch: ChapterOutline) => acc + ch.articles.length, 0) || 0;
            const doneArticles = genContent.chapters.reduce((acc: number, ch) => acc + ch.articles.filter((art: ArticleGenerated) => art.status === 'done').length, 0);
            const percentage = totalArticles > 0 ? Math.round((doneArticles / totalArticles) * 100) : 0;
            status = { type: 'progress', percentage, done: doneArticles, total: totalArticles };
        } else {
            status = { type: 'text', value: t('status_not_started') };
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

  // Check for existing outline and overwrite flag
  if (project.outline && !overwrite) {
    throw new Error(t('outline_exists_no_overwrite'));
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error(t('openai_api_key_not_set'));
  }

  const chat = isMockLLM
    ? new MockChatOpenAI()
    : new ChatOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        temperature: 0.7,
        configuration: { 
          baseURL: process.env.OPENAI_API_BASE,
        },
      });

  const jsonSchema = zodToJsonSchema(BookOutlineSchema, "BookOutline");
  const zodSchemaString = JSON.stringify(jsonSchema);
  let promptMessages: (SystemMessage | HumanMessage)[] = [];

  // --- Logic Branching based on Project Type ---
  if (project.type === 'book' || project.type === 'series') {
    const bookOrSeriesProject = project as BookProject | SeriesProject;
    promptMessages = [
      new SystemMessage(PROMPT_OUTLINE_SYSTEM(bookOrSeriesProject.type, zodSchemaString)),
      new HumanMessage(PROMPT_OUTLINE_HUMAN(
        bookOrSeriesProject.idea.language,
        bookOrSeriesProject.idea.summary,
        bookOrSeriesProject.idea.prompt,
        bookOrSeriesProject.type
      )),
    ];
  } else if (project.type === 'templated') {
    const templatedProject = project as TemplatedProject;
    if (!templatedProject.template) {
      throw new Error(t('no_template_file_configured', { projectName }));
    }
    const templatePath = path.resolve(PROJECTS_DIR, projectName, templatedProject.template);
    if (!fs.existsSync(templatePath)) {
      throw new Error(t('template_file_not_found', { path: templatePath }));
    }
    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    promptMessages = [
      new SystemMessage(PROMPT_EXTRACT_OUTLINE_SYSTEM(zodSchemaString)),
      new HumanMessage(templateContent),
    ];
  } else {
    assertNever(project as never);
  }

  // --- Common Logic for LLM call, validation, and saving ---
  try {
    const response = await chat.invoke(promptMessages);
    const content = response.content.toString();
    const cleanedContent = content.replace(/```json/g, '').replace(/```/g, '').trim();

    let outlineJson;
    try {
      outlineJson = JSON.parse(cleanedContent);
    } catch (parseError) {
      throw new Error(t('ai_response_parse_error'));
    }

    const validationResult = BookOutlineSchema.safeParse(outlineJson);

    if (!validationResult.success) {
      throw new Error(t('outline_schema_mismatch', { errors: JSON.stringify(validationResult.error.errors) }));
    }

    project.outline = validationResult.data;
    fs.writeFileSync(projectJsonPath, JSON.stringify(project, null, 2));

    return validationResult.data; // Return the generated outline

  } catch (error: any) {
    console.error('An error occurred during outline generation:', error);
    throw new Error(t('outline_generation_failed', { error: error.message }));
  }
}

// --- Content Generation ---

async function runOutlineBasedGeneration(project: Project) {
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

  if (!process.env.OPENAI_API_KEY) {
    throw new Error(t('openai_api_key_not_set'));
  }

  const chat = isMockLLM
    ? new MockChatOpenAI()
    : new ChatOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        temperature: 0.7,
        configuration: { // Support for custom endpoints
          baseURL: process.env.OPENAI_API_BASE,
        },
      });

  for (const chapter of content.chapters) {
    for (const article of chapter.articles) {
      if (article.status === 'pending' || article.status === 'error') {
        try {
          article.status = 'writing';
          saveGeneratedContent(project.name, content);

          const context = buildContext(project, content, chapter.title, article.title);
          const articlePrompt = [
            new SystemMessage(PROMPT_ARTICLE_SYSTEM),
            new HumanMessage(context),
          ];
          const articleResponse = await chat.invoke(articlePrompt);
          article.content = articleResponse.content.toString();

          const summaryPrompt = [
            new SystemMessage(PROMPT_SUMMARY_ARTICLE_SYSTEM),
            new HumanMessage(article.content),
          ];
          const summaryResponse = await chat.invoke(summaryPrompt);
          article.summary = summaryResponse.content.toString();

          article.status = 'done';
          saveGeneratedContent(project.name, content);

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
            const chapterSummaryPrompt = [
                new SystemMessage(PROMPT_SUMMARY_CHAPTER_SYSTEM),
                new HumanMessage(articlesForSummary)
            ];
            const chapterSummaryResponse = await chat.invoke(chapterSummaryPrompt);
            chapter.summary = chapterSummaryResponse.content.toString();
            saveGeneratedContent(project.name, content);
        }
    }
  }

  return content;
}

export async function startContentGeneration(projectName: string) {
  const project = getProjectDetails(projectName);
  if (!project) {
    throw new Error(t('project_not_found_error', { projectName: projectName }));
  }

  switch (project.type) {
    case 'book':
    case 'series':
    case 'templated':
      return await runOutlineBasedGeneration(project);
    default:
      return assertNever(project as never);
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
      relativePublishedFilePath = path.relative(GENDOC_WORKSPACE, publishedFilePath);
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
        relativePublishedFilePath = path.relative(GENDOC_WORKSPACE, publishedFilePath);
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
        relativeZipFilePath = path.relative(GENDOC_WORKSPACE, zipFilePath);
        return { message: t('project_published_success_zip', { outputPath: zipFilePath }), filePath: relativeZipFilePath };

      } else {
        throw new Error(t('unsupported_series_publish_type', { publishType: publishType }));
      }

    default:
      return assertNever(project as never);
  }
}

export function createProject(projectData: any) {
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

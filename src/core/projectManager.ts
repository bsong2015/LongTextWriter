import * as fs from 'fs';
import * as path from 'path';
import { Project, GeneratedContentSchema, ProjectSchema, BookOutline, GeneratedContent, BookProjectSchema, SeriesProjectSchema, TemplatedProjectSchema, BookProject, SeriesProject, TemplatedProject, ProjectDetail, PublishResult, ProjectStatus } from '../types';
import { t } from '../utils/i18n';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { PROMPT_OUTLINE_SYSTEM, PROMPT_OUTLINE_HUMAN, PROMPT_ARTICLE_SYSTEM, PROMPT_SUMMARY_ARTICLE_SYSTEM, PROMPT_SUMMARY_CHAPTER_SYSTEM, PROMPT_TEMPLATED_SYSTEM, PROMPT_TEMPLATED_HUMAN } from '../core/prompts';
import { BookOutlineSchema } from '../types'; // Explicitly import BookOutlineSchema

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

const GENDOC_WORKSPACE = path.resolve(process.cwd(), 'gendoc-workspace');
const PROJECTS_DIR = path.resolve(GENDOC_WORKSPACE, 'projects');

type ChapterOutline = BookOutline['chapters'][0];
type ArticleOutline = ChapterOutline['articles'][0];
type ArticleGenerated = GeneratedContent['chapters'][0]['articles'][0];
type ChapterGenerated = GeneratedContent['chapters'][0]; // Ensure this is correctly defined and used

// --- UTILITY FUNCTIONS ---

function getGeneratedContentPath(projectName: string): string {
  return path.resolve(PROJECTS_DIR, projectName, 'generated.json');
}

function saveGeneratedContent(projectName: string, content: GeneratedContent) {
  const filePath = getGeneratedContentPath(projectName);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
}

function buildContext(project: BookProject | SeriesProject, content: GeneratedContent, currentChapterTitle: string, currentArticleTitle: string): string {
    let context = `The overall goal is to write a ${project.type} titled "${content.title}".\n`;
    context += `Global idea: ${project.idea.summary}\n`;
    context += `Language: ${project.idea.language}\n`;
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

        if (project?.type === 'book' || project?.type === 'series') {
            const generatedJsonPath = getGeneratedContentPath(dirName);
            if (fs.existsSync(generatedJsonPath)) {
                const genContent = GeneratedContentSchema.parse(JSON.parse(fs.readFileSync(generatedJsonPath, 'utf-8')));
                const totalArticles = project.outline?.chapters.reduce((acc: number, ch: ChapterOutline) => acc + ch.articles.length, 0) || 0;
                const doneArticles = genContent.chapters.reduce((acc: number, ch) => acc + ch.articles.filter((art: ArticleGenerated) => art.status === 'done').length, 0); // Removed explicit ChapterGenerated type
                const percentage = totalArticles > 0 ? Math.round((doneArticles / totalArticles) * 100) : 0;
                status = { type: 'progress', percentage, done: doneArticles, total: totalArticles };
            } else {
                status = { type: 'text', value: t('status_not_started') };
            }
        } else if (project?.type === 'templated') {
            const outputPath = path.resolve(PROJECTS_DIR, dirName, 'output', `${dirName}.md`);
            status = { type: 'icon', value: fs.existsSync(outputPath) ? 'completed' : 'pending' };
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

    if (project?.type === 'book' || project?.type === 'series') {
        const generatedJsonPath = getGeneratedContentPath(projectName);
        if (fs.existsSync(generatedJsonPath)) {
            const genContent = GeneratedContentSchema.parse(JSON.parse(fs.readFileSync(generatedJsonPath, 'utf-8')));
            const totalArticles = project.outline?.chapters.reduce((acc: number, ch: ChapterOutline) => acc + ch.articles.length, 0) || 0;
            const doneArticles = genContent.chapters.reduce((acc: number, ch) => acc + ch.articles.filter((art: ArticleGenerated) => art.status === 'done').length, 0); // Removed explicit ChapterGenerated type
            const percentage = totalArticles > 0 ? Math.round((doneArticles / totalArticles) * 100) : 0;
            status = { type: 'progress', percentage, done: doneArticles, total: totalArticles };
        } else {
            status = { type: 'text', value: t('status_not_started') };
        }
    } else if (project?.type === 'templated') {
        const outputPath = path.resolve(PROJECTS_DIR, projectName, 'output', `${projectName}.md`);
        status = { type: 'icon', value: fs.existsSync(outputPath) ? 'completed' : 'pending' };
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

  if (project.type !== 'book' && project.type !== 'series') {
    throw new Error(t('outline_unsupported_project_type', { projectType: project.type }));
  }

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
    project = JSON.parse(content);
  } catch (error) {
    throw new Error(t('error_reading_project_json', { projectName: projectName }));
  }

  if (project.type !== 'book' && project.type !== 'series') {
    throw new Error(t('outline_unsupported_project_type', { projectType: project.type }));
  }

  const schema = project.type === 'book' ? BookProjectSchema : SeriesProjectSchema;
  try {
    schema.parse(project);
  } catch (error) {
    throw new Error(t('project_json_invalid', { projectName: projectName }));
  }

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
        configuration: { // Support for custom endpoints
          baseURL: process.env.OPENAI_API_BASE,
        },
      });

  const jsonSchema = zodToJsonSchema(BookOutlineSchema, "BookOutline");
  const zodSchemaString = JSON.stringify(jsonSchema);

  const promptMessages = [
    new SystemMessage(PROMPT_OUTLINE_SYSTEM(project.type, zodSchemaString)),
    new HumanMessage(PROMPT_OUTLINE_HUMAN(
      project.idea.language,
      project.idea.summary,
      project.idea.prompt,
      project.type
    )),
  ];

  try {
    const response = await chat.invoke(promptMessages);
    const content = response.content.toString();
    
    // Clean the response content to ensure it is a valid JSON
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

// --- BOOK/SERIES GENERATION ---

async function runBookOrSeriesGeneration(project: BookProject | SeriesProject) {
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
          // console.log(`---\nWriting article: ${chapter.title} - ${article.title}`);
          article.status = 'writing';
          saveGeneratedContent(project.name, content);

          // Generate Article Content
          const context = buildContext(project, content, chapter.title, article.title);
          const articlePrompt = [
            new SystemMessage(PROMPT_ARTICLE_SYSTEM),
            new HumanMessage(context),
          ];
          const articleResponse = await chat.invoke(articlePrompt);
          article.content = articleResponse.content.toString();

          // Generate Article Summary
          const summaryPrompt = [
            new SystemMessage(PROMPT_SUMMARY_ARTICLE_SYSTEM),
            new HumanMessage(article.content),
          ];
          const summaryResponse = await chat.invoke(summaryPrompt);
          article.summary = summaryResponse.content.toString();

          article.status = 'done';
          saveGeneratedContent(project.name, content);
          // console.log(`✅ Finished: ${article.title}`);

        } catch (error: any) {
          // console.error(`Error generating content for article '${article.title}':`, error);
          article.status = 'error';
          saveGeneratedContent(project.name, content);
          throw new Error(t('article_generation_failed', { articleTitle: article.title, error: error.message }));
        }
      }
    }

    // Generate Chapter Summary
    if (!chapter.summary) {
        const chapterArticles = chapter.articles.filter((a: ArticleGenerated) => a.status === 'done');
        if (chapterArticles.length === chapter.articles.length) {
            // console.log(`---\nSummarizing chapter: ${chapter.title}`);
            const articlesForSummary = chapterArticles.map((a: ArticleGenerated) => `Article: ${a.title}\nSummary: ${a.summary}`).join('\n\n');
            const chapterSummaryPrompt = [
                new SystemMessage(PROMPT_SUMMARY_CHAPTER_SYSTEM),
                new HumanMessage(articlesForSummary)
            ];
            const chapterSummaryResponse = await chat.invoke(chapterSummaryPrompt);
            chapter.summary = chapterSummaryResponse.content.toString();
            saveGeneratedContent(project.name, content);
            // console.log(`✅ Finished summarizing chapter: ${chapter.title}`);
        }
    }
  }

  // console.log('\n🎉 All content has been generated successfully!');
  return content;
}

// --- TEMPLATED GENERATION ---

async function runTemplatedGeneration(project: TemplatedProject) {
  const projectDir = path.resolve(PROJECTS_DIR, project.name);

  try {
    const sourceContent = project.sources.map(src => {
      const srcPath = path.resolve(projectDir, src);
      if (!fs.existsSync(srcPath)) throw new Error(t('source_file_not_found', { path: srcPath }));
      return fs.readFileSync(srcPath, 'utf-8');
    }).join('\n\n---\n\n');

    const templatePath = path.resolve(projectDir, project.template);
    if (!fs.existsSync(templatePath)) throw new Error(t('template_file_not_found', { path: templatePath }));
    let templateContent = fs.readFileSync(templatePath, 'utf-8');

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

    const placeholders = [...templateContent.matchAll(/<AI_FILL:\s*(.*?)\s*>/g)];
    if (placeholders.length === 0) {
        return { message: t('no_ai_fill_placeholders') };
    }

    for (const placeholder of placeholders) {
      const instruction = placeholder[1];
      // console.log(`---\nGenerating section for: "${instruction}"`);

      const prompt = [
        new SystemMessage(PROMPT_TEMPLATED_SYSTEM),
        new HumanMessage(PROMPT_TEMPLATED_HUMAN(sourceContent, instruction)),
      ];

      const response = await chat.invoke(prompt);
      templateContent = templateContent.replace(placeholder[0], response.content.toString());
    }

    const outputPath = path.resolve(projectDir, 'output');
    if (!fs.existsSync(outputPath)) fs.mkdirSync(outputPath, { recursive: true });
    const outputFilePath = path.resolve(outputPath, `${project.name}.md`);
    fs.writeFileSync(outputFilePath, templateContent);

    return { message: t('templated_generation_success', { outputFilePath: outputFilePath }) };

  } catch (error: any) {
    // console.error('An error occurred during templated generation:', error);
    throw new Error(t('templated_generation_failed', { error: error.message }));
  }
}

export async function startContentGeneration(projectName: string) {
  const project = getProjectDetails(projectName); // Use getProjectDetails to load project
  if (!project) {
    throw new Error(t('project_not_found_error', { projectName: projectName }));
  }

  // Explicitly cast project to Project type to help TypeScript with type narrowing
  const typedProject: Project = project;

  switch (typedProject.type) {
    case 'book':
    case 'series':
      return await runBookOrSeriesGeneration(typedProject as BookProject | SeriesProject);
    case 'templated':
      return await runTemplatedGeneration(typedProject as TemplatedProject);
    default:
      // If we reach here, it means typedProject.type is not one of the expected types.
      // This indicates a data inconsistency or a missing case in the switch.
      // We can simply throw an error with the value directly.
      throw new Error(t('unsupported_generation_type', { projectType: (typedProject as Project).type }));
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
    project = JSON.parse(content);
  } catch (error) {
    throw new Error(t('error_reading_project_json', { projectName: projectName }));
  }

  // Validate the incoming outline against the schema
  const validationResult = BookOutlineSchema.safeParse(outline);
  if (!validationResult.success) {
    throw new Error(t('outline_schema_mismatch', { errors: JSON.stringify(validationResult.error.errors) }));
  }

   // **关键修改：在赋值前进行类型检查**
  // 检查 project 的类型是否支持 outline 属性
  if (project.type === 'book' || project.type === 'series') {
    // 在这个 if 代码块内部, TypeScript 知道 project 的类型是 BookProject 或 SeriesProject
    project.outline = validationResult.data;
  } else {
    // 如果项目类型是 'templated' 或其他不支持 outline 的类型，则抛出错误或进行相应处理
    // 这是一个好的实践，可以防止意外地给不支持的类型添加 outline
    throw new Error(t('project_type_does_not_support_outline', { 
      projectName: projectName, 
      projectType: project.type 
    }));
  }

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
      // Change to relative path
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
        // Change to relative path
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
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/[^a-z0-9\u4e00-\u9fff-]/g, '')); // Allow alphanumeric, Chinese, and hyphens
          fs.mkdirSync(chapterDir, { recursive: true });
          for (const article of chapter.articles) {
            const articleFileName = `${article.title
              .toLowerCase()
              .replace(/\s+/g, '-') // Replace spaces with hyphens
              .replace(/[^a-z0-9\u4e00-\u9fff-]/g, '') // Allow alphanumeric, Chinese, and hyphens
            }.md`;
            fs.writeFileSync(path.resolve(chapterDir, articleFileName), article.content || '', 'utf-8');
          }
        }
        const zipFilePath = path.resolve(outputDir, `${projectName}.zip`);
        await zipDirectory(tempDir, zipFilePath);
        fs.rmSync(tempDir, { recursive: true, force: true }); // Clean up temp directory
        // Change to relative path
        relativeZipFilePath = path.relative(GENDOC_WORKSPACE, zipFilePath);
        return { message: t('project_published_success_zip', { outputPath: zipFilePath }), filePath: relativeZipFilePath };

      } else {
        throw new Error(t('unsupported_series_publish_type', { publishType: publishType }));
      }

    case 'templated':
      const templatedOutputPath = path.resolve(projectDir, 'output', `${projectName}.md`);
      if (!fs.existsSync(templatedOutputPath)) {
        throw new Error(t('no_templated_output_found', { projectName: projectName }));
      }
      contentToPublish = fs.readFileSync(templatedOutputPath, 'utf-8');
      publishedFilePath = path.resolve(outputDir, `${projectName}.md`);
      fs.writeFileSync(publishedFilePath, contentToPublish, 'utf-8');
      // Change to relative path
      relativePublishedFilePath = path.relative(GENDOC_WORKSPACE, publishedFilePath);
      return { message: t('project_published_success', { outputPath: publishedFilePath }), filePath: relativePublishedFilePath };

    default:
      throw new Error(t('unsupported_publish_type', { projectType: (project as Project).type }));
  }
}

export function createProject(projectData: any) {
  if (!fs.existsSync(PROJECTS_DIR)) {
    fs.mkdirSync(PROJECTS_DIR, { recursive: true });
  }

  const { name, type, ...rest } = projectData;

  const projectDir = path.resolve(PROJECTS_DIR, name);
  if (fs.existsSync(projectDir)) {
    throw new Error(t('new_project_name_exists_error'));
  }

  let validatedData: any;
  switch (type) {
    case 'book':
    case 'series':
      validatedData = (type === 'book' ? BookProjectSchema : SeriesProjectSchema).parse({
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
      throw new Error(t('new_project_invalid_type_error'));
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

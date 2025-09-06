import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import { zodToJsonSchema } from 'zod-to-json-schema';
import {
  PROMPT_OUTLINE_SYSTEM,
  PROMPT_OUTLINE_HUMAN,
  PROMPT_EXTRACT_OUTLINE_SYSTEM,
  PROMPT_ARTICLE_SYSTEM,
  PROMPT_SUMMARY_ARTICLE_SYSTEM,
  PROMPT_SUMMARY_CHAPTER_SYSTEM,
} from './prompts';
import {
  BookOutlineSchema,
  Project,
  BookProject,
  SeriesProject,
  TemplatedProject,
  BookOutline,
} from '@gendoc/shared';
import { t } from '../utils/i18n';
import * as fs from 'fs';
import * as path from 'path';
import { setGlobalDispatcher, ProxyAgent } from 'undici'; // Added import
import { getConfig } from './configManager';

// --- LLM Client Initialization ---

let isClientInfoLogged = false;

// Mock class for testing without hitting the API
class MockChatOpenAI {
    async invoke(messages: any[]): Promise<AIMessage> {
        // In mock mode, we also log the prompt for consistency
        console.log(t('llm_mock_prompt_log_header'));
        console.log(JSON.stringify(messages, null, 2));
        console.log(t('llm_mock_prompt_log_footer'));

        console.log(t('llm_mock_returning_dummy_response'));
        const messageContent = messages.map(msg => msg.content).join('\n');

        if (messageContent.includes('outline')) {
            const mockOutline: BookOutline = {
                title: "Mock Outline Title",
                chapters: [
                    { title: "Mock Chapter 1", articles: [{ title: "Mock Article 1.1" }, { title: "Mock Article 1.2" }] },
                    { title: "Mock Chapter 2", articles: [{ title: "Mock Article 2.1" }] }
                ]
            };
            return new AIMessage({ content: JSON.stringify(mockOutline, null, 2) });
        }
        if (messageContent.includes(PROMPT_ARTICLE_SYSTEM)) {
            return new AIMessage({ content: "This is mock generated article content based on the context." });
        }
        if (messageContent.includes(PROMPT_SUMMARY_ARTICLE_SYSTEM) || messageContent.includes(PROMPT_SUMMARY_CHAPTER_SYSTEM)) {
            return new AIMessage({ content: "This is a mock summary of the provided content." });
        }
        return new AIMessage({ content: t('llm_default_mock_response') });
    }
}

function getChatClient() {
  const config = getConfig();
  const isMockLLM = config.app.mock;
  if (!config.llm.apiKey && !isMockLLM) {
    throw new Error(t('openai_api_key_not_set'));
  }

  if (!isClientInfoLogged) {
    console.log(t('llm_client_info_header'));
    console.log(t('llm_client_info_mock_llm', { isMockLLM: String(isMockLLM) }));
    if (!isMockLLM) {
        console.log(t('llm_client_info_model', { model: config.llm.model || 'gpt-4o' }));
        const apiBaseUrl = config.llm.baseUrl;
        if (apiBaseUrl) {
            console.log(t('llm_client_info_api_base', { apiBaseUrl }));
        }
        const proxyUrl = config.llm.proxy;
        if (proxyUrl) {
            console.log(t('llm_client_info_proxy_yes', { proxyUrl }));
            // Set global dispatcher for undici
            setGlobalDispatcher(new ProxyAgent(proxyUrl)); // Added this line
        } else {
            console.log(t('llm_client_info_proxy_no'));
        }
    }
    console.log(t('llm_client_info_footer'));
    isClientInfoLogged = true;
  }

  return isMockLLM
    ? new MockChatOpenAI()
    : new ChatOpenAI({
        apiKey: config.llm.apiKey === null ? undefined : config.llm.apiKey,
        model: config.llm.model || 'gpt-4o',
        temperature: 0.7,
		verbose: false,
        configuration: {
           baseURL: config.llm.baseUrl === null ? undefined : config.llm.baseUrl,
        },
      });
}


// --- Core LLM Service Functions ---

export async function generateOutline(project: Project, projectsDir: string): Promise<BookOutline> {
  const chat = getChatClient();
  const jsonSchema = zodToJsonSchema(BookOutlineSchema, "BookOutline");
  const zodSchemaString = JSON.stringify(jsonSchema);
  let promptMessages: (SystemMessage | HumanMessage)[] = [];

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
      throw new Error(t('no_template_file_configured', { projectName: project.name }));
    }
    const templatePath = path.resolve(projectsDir, project.name, templatedProject.template);
    if (!fs.existsSync(templatePath)) {
      throw new Error(t('template_file_not_found', { path: templatePath }));
    }
    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    promptMessages = [
      new SystemMessage(PROMPT_EXTRACT_OUTLINE_SYSTEM(zodSchemaString)),
      new HumanMessage(templateContent),
    ];
  }

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
    return validationResult.data;
  } catch (error: any) {
    console.error(t('llm_error_generating_outline'), error);
    throw new Error(t('outline_generation_failed', { error: error.message }));
  }
}

export async function generateArticleContent(context: string): Promise<string> {
    const chat = getChatClient();
    const articlePrompt = [
        new SystemMessage(PROMPT_ARTICLE_SYSTEM),
        new HumanMessage(context),
    ];

    const response = await chat.invoke(articlePrompt);
    return response.content.toString();
}

export async function summarizeText(text: string, type: 'article' | 'chapter'): Promise<string> {
    const chat = getChatClient();
    const prompt = type === 'article' ? PROMPT_SUMMARY_ARTICLE_SYSTEM : PROMPT_SUMMARY_CHAPTER_SYSTEM;
    const summaryPrompt = [
        new SystemMessage(prompt),
        new HumanMessage(text),
    ];

    const response = await chat.invoke(summaryPrompt);
    return response.content.toString();
}

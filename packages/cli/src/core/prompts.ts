// src/core/prompts.ts

export const PROMPT_OUTLINE_SYSTEM = (
  projectType: string,
  zodSchemaString: string
) =>
  `You are an expert outline generator. Based on the provided idea, create a detailed outline for a ${projectType}. ` +
  `The outline should be structured with chapters and articles within each chapter. ` +
  `Provide the output as a JSON object that strictly follows this JSON schema: \n${zodSchemaString}\n` +
  `Do not include any other text or explanations in your response, only the raw JSON object.`
;

export const PROMPT_OUTLINE_HUMAN = (
  language: string,
  summary: string,
  prompt: string,
  projectType: string
) =>
  `Here is the idea for the ${projectType}:\n` +
  `Language: ${language}\n` +
  `Summary: ${summary}\n` +
  `Global Requirements: ${prompt}`
;

export const PROMPT_EXTRACT_OUTLINE_SYSTEM = (
  zodSchemaString: string
) => 
  `You are an expert document parser. Analyze the provided text and identify its structure. ` +
  `Extract the main sections (chapters) and subsections (articles) based on the headings. ` +
  `Provide the output as a JSON object that strictly follows this JSON schema: \n${zodSchemaString}\n` +
  `Do not include any other text or explanations in your response, only the raw JSON object. Typically, ## headings are chapters and ### headings are articles.`
;

export const PROMPT_ARTICLE_SYSTEM = 
  'You are an expert author. Write the full, detailed content for the following article based on the provided context. Focus only on the article content, not the title or summary.';

export const PROMPT_SUMMARY_ARTICLE_SYSTEM = 
  'You are an expert summarizer. Summarize the following text in one or two paragraphs.';

export const PROMPT_SUMMARY_CHAPTER_SYSTEM = 
  'You are an expert summarizer. Based on the following article summaries, write a concise summary for the entire chapter.';

export const PROMPT_TEMPLATED_SYSTEM = 
  'You are an AI assistant that fills in document sections based on source material and an instruction.';

export const PROMPT_TEMPLATED_HUMAN = (
  sourceContent: string,
  instruction: string
) =>
  `Source Material:\n${sourceContent}\n\nTemplate Instruction: \"${instruction}\"\n\nGenerate the content for this section. Output only the text to be inserted, without any extra formatting or explanation. `;

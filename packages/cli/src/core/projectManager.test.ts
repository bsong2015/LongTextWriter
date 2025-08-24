import * as fs from 'fs';
import * as path from 'path';
import { createProject, deleteProject, getProjectList, getProjectDetails, getProjectOutline, generateProjectOutline, saveProjectOutline, getGeneratedProjectContent, saveGeneratedProjectContent, startContentGeneration, publishProject } from './projectManager';
import { t } from '../utils/i18n';
import { BookOutline, GeneratedContent } from '@gendoc/shared';
import { ChatOpenAI } from '@langchain/openai'; // Import ChatOpenAI for typing
import archiver from 'archiver'; // Import archiver for mocking

// Define shared paths
const GENDOC_WORKSPACE = path.resolve(__dirname, '..', '..', '..', '..', 'gendoc-workspace');
const PROJECTS_DIR = path.resolve(GENDOC_WORKSPACE, 'projects');

// Mock the archiver library
jest.mock('archiver', () => {
  return jest.fn().mockImplementation(() => {
    let pipedStream: any;
    const mock = {
      pipe: jest.fn(stream => {
        pipedStream = stream;
        return stream;
      }),
      directory: jest.fn(),
      finalize: jest.fn(() => {
        if (pipedStream && pipedStream.end) {
          pipedStream.end();
        }
      }),
      on: jest.fn(),
      pointer: jest.fn(() => 12345),
    };
    return mock;
  });
});

// Mock the file system module
jest.mock('fs', () => {
  const actualFs = jest.requireActual('fs');
  return {
    ...actualFs,
    existsSync: jest.fn(),
    mkdirSync: jest.fn(),
    writeFileSync: jest.fn(),
    rmSync: jest.fn(), // Also mock rmSync for deleteProject tests later
    readdirSync: jest.fn(),
    readFileSync: jest.fn(),
    createWriteStream: jest.fn((path) => {
      let closeCallback: () => void;
      return {
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            closeCallback = callback;
          }
        }),
        write: jest.fn(),
        end: jest.fn(() => {
          if (closeCallback) {
            // Making this async to better mimic real I/O and avoid potential jest race conditions.
            setTimeout(closeCallback, 0);
          }
        }),
      };
    }),
  };
});

// Mock the i18n translation function
jest.mock('../utils/i18n', () => ({
  t: jest.fn((key, params) => {
    // Simple mock translation for testing purposes
    if (key === 'new_project_name_exists_error') return 'Project name already exists.';
    if (key === 'new_project_invalid_type_error') return 'Invalid project type.';
    if (key === 'project_not_found_error') return `Project ${params?.projectName} not found.`;
    if (key === 'project_delete_error') return `Error deleting project ${params?.projectName}.`;
    if (key === 'status_unknown') return 'Unknown status';
    if (key === 'status_invalid_project_json') return 'Invalid project JSON';
    if (key === 'status_not_started') return 'Not started';
    if (key === 'error_reading_project_details') return `Error reading details for project ${params?.projectName}.`;
    if (key === 'error_reading_project_json') return `Error reading project JSON for ${params?.projectName}.`;
    if (key === 'outline_unsupported_project_type') return `Outline not supported for project type ${params?.projectType}.`;
    if (key === 'outline_exists_no_overwrite') return 'Outline already exists. Use --overwrite to force.';
    if (key === 'openai_api_key_not_set') return 'OpenAI API key not set.';
    if (key === 'ai_response_parse_error') return 'AI response could not be parsed.';
    if (key === 'outline_schema_mismatch') return `Generated outline does not match schema: ${params?.errors}.`;
    if (key === 'outline_generation_failed') return `Outline generation failed: ${params?.error}.`;
    if (key === 'project_type_does_not_support_outline') return `Project ${params?.projectName} of type ${params?.projectType} does not support outlines.`;
    if (key === 'outline_save_failed') return 'Failed to save outline.';
    if (key === 'error_reading_generated_project_content') return `Error reading generated project content for ${params?.projectName}.`;
    if (key === 'error_saving_generated_project_content') return `Error saving generated project content for ${params?.projectName}.`;
    if (key === 'no_outline_found') return `No outline found for project ${params?.projectName}.`;
    if (key === 'unsupported_generation_type') return `Unsupported generation type: ${params?.projectType}.`;
    if (key === 'source_file_not_found') return `Source file not found: ${params?.path}.`;
    if (key === 'template_file_not_found') return `Template file not found: ${params?.path}.`;
    if (key === 'no_ai_fill_placeholders') return 'No AI_FILL placeholders found in template.';
    if (key === 'templated_generation_success') return `Templated generation successful. Output: ${params?.outputFilePath}.`;
    if (key === 'templated_generation_failed') return `Templated generation failed: ${params?.error}.`;
    if (key === 'article_generation_failed') return `Article generation failed for ${params?.articleTitle}: ${params?.error}.`;
    if (key === 'no_generated_content_found') return `No generated content found for project ${params?.projectName}.`;
    if (key === 'no_templated_output_found') return `No templated output found for project ${params?.projectName}.`;
    if (key === 'unsupported_publish_type') return `Unsupported publish type: ${params?.projectType}.`;
    if (key === 'project_published_success') return `Project published successfully to ${params?.outputPath}.`;
    if (key === 'project_publish_error') return `Error publishing project to ${params?.outputPath}: ${params?.error}.`;
    if (key === 'unsupported_series_publish_type') return `Unsupported series publish type: ${params?.publishType}.`;
    if (key === 'project_published_success_zip') return `Project published successfully to ${params?.outputPath} (ZIP).`;
    return `${key}${params ? JSON.stringify(params) : ''}`;
  }),
}));

// Mock the LLM for outline generation tests
jest.mock('@langchain/openai', () => ({
  ChatOpenAI: jest.fn().mockImplementation(() => ({
    invoke: jest.fn(async (messages: any[]) => {
      const messageContent = messages.map((msg: any) => msg.content).join('\n');

      // For outline generation
      if (messageContent.includes('outline')) {
        return { content: JSON.stringify({
          title: "Mock Generated Outline",
          chapters: [
            { title: "Intro", articles: [{ title: "Article 1" }] },
            { title: "Conclusion", articles: [{ title: "Article 2" }] },
          ]
        }) };
      }

      // For article generation
      if (messageContent.includes('You are an expert author')) {
        return { content: "This is mock generated article content based on the context." };
      }

      // For summary generation
      if (messageContent.includes('You are an expert summarizer')) {
        return { content: "This is a mock summary of the provided content." };
      }

      // For templated generation
      if (messageContent.includes('PROMPT_TEMPLATED_SYSTEM')) {
        return { content: "This is mock templated content filling a placeholder." };
      }

      // Default fallback
      return { content: "Default mock response from LLM." };
    }),
    })),
}));

describe('createProject', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    // Default mock for existsSync: assume directories don't exist unless specified
    (fs.existsSync as jest.Mock).mockReturnValue(false);
  });

  it('should create a new book project successfully', () => {
    const projectName = 'test-book-project';
    const projectData = {
      name: projectName,
      type: 'book',
      idea: { language: 'en', summary: 'A summary of the book.', prompt: 'A prompt for the book.' },
    };

    const expectedProjectPath = path.resolve(PROJECTS_DIR, projectName);
    const expectedProjectJsonPath = path.resolve(expectedProjectPath, 'project.json');

    const result = createProject(projectData);

    expect(fs.mkdirSync).toHaveBeenCalledWith(PROJECTS_DIR, { recursive: true });
    expect(fs.mkdirSync).toHaveBeenCalledWith(expectedProjectPath, { recursive: true });

    // Get the arguments passed to writeFileSync
    const writeFileSyncCalls = (fs.writeFileSync as jest.Mock).mock.calls;
    expect(writeFileSyncCalls.length).toBe(1);
    expect(writeFileSyncCalls[0][0]).toBe(expectedProjectJsonPath);

    const writtenContent = JSON.parse(writeFileSyncCalls[0][1]);
    expect(writtenContent).toMatchObject({
      name: projectName,
      type: 'book',
      idea: { language: 'en', summary: 'A summary of the book.', prompt: 'A prompt for the book.' },
    });
    expect(writtenContent).toHaveProperty('createdAt');

    expect(result).toMatchObject({
      name: projectName,
      type: 'book',
      idea: { language: 'en', summary: 'A summary of the book.', prompt: 'A prompt for the book.' },
    });
    expect(result).toHaveProperty('createdAt');
  });

  it('should create a new series project successfully', () => {
    const projectName = 'test-series-project';
    const projectData = {
      name: projectName,
      type: 'series',
      idea: { language: 'zh', summary: 'A summary of the series.', prompt: 'A prompt for the series.' }
    };

    const expectedProjectPath = path.resolve(PROJECTS_DIR, projectName);
    const expectedProjectJsonPath = path.resolve(expectedProjectPath, 'project.json');

    const result = createProject(projectData);

    expect(fs.mkdirSync).toHaveBeenCalledWith(PROJECTS_DIR, { recursive: true });
    expect(fs.mkdirSync).toHaveBeenCalledWith(expectedProjectPath, { recursive: true });

    const writeFileSyncCalls = (fs.writeFileSync as jest.Mock).mock.calls;
    expect(writeFileSyncCalls.length).toBe(1);
    expect(writeFileSyncCalls[0][0]).toBe(expectedProjectJsonPath);

    const writtenContent = JSON.parse(writeFileSyncCalls[0][1]);
    expect(writtenContent).toMatchObject({
      name: projectName,
      type: 'series',
      idea: { language: 'zh', summary: 'A summary of the series.', prompt: 'A prompt for the series.' },
    });
    expect(writtenContent).toHaveProperty('createdAt');

    expect(result).toMatchObject({
      name: projectName,
      type: 'series',
      idea: { language: 'zh', summary: 'A summary of the series.', prompt: 'A prompt for the series.' },
    });
    expect(result).toHaveProperty('createdAt');
  });

  it('should create a new templated project successfully', () => {
    const projectName = 'test-templated-project';
    const projectData = {
      name: projectName,
      type: 'templated',
      sources: ['src/data.txt'],
      template: 'templates/template.md',
    };

    const expectedProjectPath = path.resolve(PROJECTS_DIR, projectName);
    const expectedProjectJsonPath = path.resolve(expectedProjectPath, 'project.json');
    const expectedSourcesDir = path.resolve(expectedProjectPath, 'sources');
    const expectedTemplatesDir = path.resolve(expectedProjectPath, 'templates');

    const result = createProject(projectData);

    expect(fs.mkdirSync).toHaveBeenCalledWith(PROJECTS_DIR, { recursive: true });
    expect(fs.mkdirSync).toHaveBeenCalledWith(expectedProjectPath, { recursive: true });
    expect(fs.mkdirSync).toHaveBeenCalledWith(expectedSourcesDir, { recursive: true });
    expect(fs.mkdirSync).toHaveBeenCalledWith(expectedTemplatesDir, { recursive: true });

    const writeFileSyncCalls = (fs.writeFileSync as jest.Mock).mock.calls;
    expect(writeFileSyncCalls.length).toBe(1);
    expect(writeFileSyncCalls[0][0]).toBe(expectedProjectJsonPath);

    const writtenContent = JSON.parse(writeFileSyncCalls[0][1]);
    expect(writtenContent).toMatchObject({
      name: projectName,
      type: 'templated',
      sources: ['src/data.txt'],
      template: 'templates/template.md',
    });
    expect(writtenContent).toHaveProperty('createdAt');

    expect(result).toMatchObject({
      name: projectName,
      type: 'templated',
      sources: ['src/data.txt'],
      template: 'templates/template.md',
    });
    expect(result).toHaveProperty('createdAt');
  });

  it('should throw an error if project name already exists', () => {
    const projectName = 'existing-project';
    const projectData = {
      name: projectName,
      type: 'book',
      idea: { language: 'en', summary: 'A summary of the book.', prompt: 'A prompt for the book.' },
    };

    (fs.existsSync as jest.Mock).mockImplementation((p) => {
      // Mock that the specific project directory already exists
      return p === path.resolve(PROJECTS_DIR, projectName);
    });

    expect(() => createProject(projectData)).toThrow('Project name already exists.');
    // Only PROJECTS_DIR should be created, not the specific project directory
    expect(fs.mkdirSync).toHaveBeenCalledWith(PROJECTS_DIR, { recursive: true });
    expect(fs.mkdirSync).toHaveBeenCalledTimes(1); // Only one mkdirSync call for PROJECTS_DIR
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  it('should throw an error for an invalid project type', () => {
    const projectData = {
      name: 'invalid-type-project',
      type: 'unsupported-type', // Invalid type
      idea: { language: 'en', summary: 'A summary.', prompt: 'A prompt.' },
    };

    // Using a generic `toThrow` because assertNever throws a generic error, not a specific one.
    expect(() => createProject(projectData)).toThrow();
    // PROJECTS_DIR is created unconditionally, so expect one call
    expect(fs.mkdirSync).toHaveBeenCalledWith(PROJECTS_DIR, { recursive: true });
    expect(fs.mkdirSync).toHaveBeenCalledTimes(1);
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });
});

describe('deleteProject', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockReturnValue(false);
  });

  it('should delete a project successfully', () => {
    const projectName = 'project-to-delete';
    const projectPath = path.resolve(PROJECTS_DIR, projectName);

    (fs.existsSync as jest.Mock).mockImplementation((p) => p === projectPath);

    expect(() => deleteProject(projectName)).not.toThrow();
    expect(fs.rmSync).toHaveBeenCalledWith(projectPath, { recursive: true, force: true });
  });

  it('should throw an error if the project to delete is not found', () => {
    const projectName = 'non-existent-project';
    const projectPath = path.resolve(PROJECTS_DIR, projectName);

    (fs.existsSync as jest.Mock).mockImplementation((p) => p !== projectPath);

    expect(() => deleteProject(projectName)).toThrow(`Project ${projectName} not found.`);
    expect(fs.rmSync).not.toHaveBeenCalled();
  });

  it('should throw an error if rmSync fails', () => {
    const projectName = 'project-to-fail-delete';
    const projectPath = path.resolve(PROJECTS_DIR, projectName);

    (fs.existsSync as jest.Mock).mockImplementation((p) => p === projectPath);
    (fs.rmSync as jest.Mock).mockImplementation(() => {
      throw new Error('Permission denied');
    });

    expect(() => deleteProject(projectName)).toThrow(`Error deleting project ${projectName}.`);
    expect(fs.rmSync).toHaveBeenCalledWith(projectPath, { recursive: true, force: true });
  });
});

describe('getProjectList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    (fs.readdirSync as jest.Mock).mockReturnValue([]);
    (fs.readFileSync as jest.Mock).mockReturnValue('');
  });

  it('should return an empty array if PROJECTS_DIR does not exist', () => {
    (fs.existsSync as jest.Mock).mockImplementation((p) => p !== PROJECTS_DIR);
    expect(getProjectList()).toEqual([]);
    expect(fs.readdirSync).not.toHaveBeenCalled();
  });

  it('should return an empty array if PROJECTS_DIR exists but is empty', () => {
    (fs.existsSync as jest.Mock).mockImplementation((p) => p === PROJECTS_DIR);
    (fs.readdirSync as jest.Mock).mockReturnValue([]);
    expect(getProjectList()).toEqual([]);
  });

  it('should list all project types with correct status', () => {
    const bookProjectName = 'my-book';
    const seriesProjectName = 'my-series';
    const templatedProjectName = 'my-templated';

    const bookProjectPath = path.resolve(PROJECTS_DIR, bookProjectName);
    const seriesProjectPath = path.resolve(PROJECTS_DIR, seriesProjectName);
    const templatedProjectPath = path.resolve(PROJECTS_DIR, templatedProjectName);

    const bookProjectJsonPath = path.resolve(bookProjectPath, 'project.json');
    const bookGeneratedJsonPath = path.resolve(bookProjectPath, 'generated.json');

    const seriesProjectJsonPath = path.resolve(seriesProjectPath, 'project.json');
    const seriesGeneratedJsonPath = path.resolve(seriesProjectPath, 'generated.json');

    const templatedProjectJsonPath = path.resolve(templatedProjectPath, 'project.json');
    const templatedGeneratedJsonPath = path.resolve(templatedProjectPath, 'generated.json');


    (fs.existsSync as jest.Mock).mockImplementation((p) => {
      const existingPaths = [
        PROJECTS_DIR,
        bookProjectPath, seriesProjectPath, templatedProjectPath,
        bookProjectJsonPath, bookGeneratedJsonPath,
        seriesProjectJsonPath,
        templatedProjectJsonPath,
      ];
      return existingPaths.includes(p);
    });

    (fs.readdirSync as jest.Mock).mockReturnValueOnce([
      { name: bookProjectName, isDirectory: () => true },
      { name: seriesProjectName, isDirectory: () => true },
      { name: templatedProjectName, isDirectory: () => true },
    ]);

    (fs.readFileSync as jest.Mock).mockImplementation((p) => {
      if (p === bookProjectJsonPath) {
        return JSON.stringify({
          name: bookProjectName, type: 'book', createdAt: new Date().toISOString(),
          idea: { language: 'en', summary: 'Book summary', prompt: 'Book prompt' },
          outline: { title: 'Book Outline', chapters: [{ title: 'C1', articles: [{ title: 'a1' }, { title: 'a2' }] }, { title: 'C2', articles: [{ title: 'a3' }] }] },
        });
      }
      if (p === bookGeneratedJsonPath) {
        return JSON.stringify({
          title: 'My Book', chapters: [
            { title: 'C1', articles: [{ title: 'a1', status: 'done' }, { title: 'a2', status: 'pending' }] },
            { title: 'C2', articles: [{ title: 'a3', status: 'done' }] },
          ],
        });
      }
      if (p === seriesProjectJsonPath) {
        return JSON.stringify({
          name: seriesProjectName, type: 'series', createdAt: new Date().toISOString(),
          idea: { language: 'en', summary: 'Series summary', prompt: 'Series prompt' },
          outline: { title: 'Series Outline', chapters: [{ title: 'P1', articles: [{ title: 's1' }] }] },
        });
      }
      if (p === templatedProjectJsonPath) {
        return JSON.stringify({
          name: templatedProjectName, type: 'templated', createdAt: new Date().toISOString(),
          sources: ['src/data.txt'], template: 'templates/template.md',
          // No outline, so status should be "Not started"
        });
      }
      return '';
    });

    const projectList = getProjectList();

    expect(projectList).toHaveLength(3);

    const bookProject = projectList.find(p => p.name === bookProjectName);
    expect(bookProject?.type).toBe('book');
    expect(bookProject?.status).toEqual({ type: 'progress', percentage: 67, done: 2, total: 3 });

    const seriesProject = projectList.find(p => p.name === seriesProjectName);
    expect(seriesProject?.type).toBe('series');
    expect(seriesProject?.status).toEqual({ type: 'text', value: 'Not started' });

    const templatedProject = projectList.find(p => p.name === templatedProjectName);
    expect(templatedProject?.type).toBe('templated');
    // Since generated.json does not exist for it, it should be "Not started"
    expect(templatedProject?.status).toEqual({ type: 'text', value: 'Not started' });
  });

  it('should handle invalid project.json files gracefully', () => {
    const invalidProjectName = 'invalid-json-project';
    const invalidProjectPath = path.resolve(PROJECTS_DIR, invalidProjectName);
    const invalidProjectJsonPath = path.resolve(invalidProjectPath, 'project.json');

    (fs.existsSync as jest.Mock).mockImplementation((p) => {
      if (p === PROJECTS_DIR) return true;
      if (p === invalidProjectPath) return true;
      if (p === invalidProjectJsonPath) return true;
      return false;
    });

    (fs.readdirSync as jest.Mock).mockReturnValueOnce([
      { name: invalidProjectName, isDirectory: () => true },
    ]);

    (fs.readFileSync as jest.Mock).mockImplementation((p) => {
      if (p === invalidProjectJsonPath) {
        return 'this is not valid json';
      }
      return '';
    });

    const projectList = getProjectList();

    expect(projectList).toHaveLength(1);
    const invalidProject = projectList.find(p => p.name === invalidProjectName);
    expect(invalidProject).toBeDefined();
    expect(invalidProject?.name).toBe(invalidProjectName);
    expect(invalidProject?.type).toBe('Unknown status'); // Default type when project.json is invalid
    expect(invalidProject?.status).toEqual({ type: 'text', value: 'Invalid project JSON' });
  });
});

describe('getProjectDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    (fs.readFileSync as jest.Mock).mockReturnValue('');
  });

  it('should return details for a book project with progress status', () => {
    const projectName = 'detailed-book-project';
    const projectPath = path.resolve(PROJECTS_DIR, projectName);
    const projectJsonPath = path.resolve(projectPath, 'project.json');
    const generatedJsonPath = path.resolve(projectPath, 'generated.json');

    (fs.existsSync as jest.Mock).mockImplementation((p) => {
      if (p === projectJsonPath) return true;
      if (p === generatedJsonPath) return true;
      return false;
    });

    (fs.readFileSync as jest.Mock).mockImplementation((p) => {
      if (p === projectJsonPath) {
        return JSON.stringify({
          name: projectName,
          type: 'book',
          createdAt: new Date().toISOString(),
          idea: { language: 'en', summary: 'Book summary', prompt: 'Book prompt' },
          outline: {
            title: 'Book Outline',
            chapters: [
              { title: 'Chapter 1', articles: [{ title: 'ch1-art1' }, { title: 'ch1-art2' }] },
              { title: 'Chapter 2', articles: [{ title: 'ch2-art1' }] },
            ],
          },
        });
      }
      if (p === generatedJsonPath) {
        return JSON.stringify({
          title: 'Detailed Book',
          chapters: [
            {
              title: 'Chapter 1',
              articles: [
                { title: 'ch1-art1', status: 'done' },
                { title: 'ch1-art2', status: 'pending' },
              ],
            },
            {
              title: 'Chapter 2',
              articles: [
                { title: 'ch2-art1', status: 'done' },
              ],
            },
          ],
        });
      }
      return '';
    });

    const details = getProjectDetails(projectName);
    expect(details).toBeDefined();
    expect(details.name).toBe(projectName);
    expect(details.type).toBe('book');
    expect(details.status).toEqual({ type: 'progress', percentage: 67, done: 2, total: 3 });
    expect(details).toHaveProperty('createdAt');
    expect(details).toHaveProperty('outline');
  });

  it('should return details for a templated project with "Not started" status', () => {
    const projectName = 'detailed-templated-project';
    const projectPath = path.resolve(PROJECTS_DIR, projectName);
    const projectJsonPath = path.resolve(projectPath, 'project.json');
    const generatedJsonPath = path.resolve(projectPath, 'generated.json');

    (fs.existsSync as jest.Mock).mockImplementation((p) => {
      if (p === projectJsonPath) return true;
      if (p === generatedJsonPath) return false; // generated.json does not exist
      return false;
    });

    (fs.readFileSync as jest.Mock).mockImplementation((p) => {
      if (p === projectJsonPath) {
        return JSON.stringify({
          name: projectName,
          type: 'templated',
          createdAt: new Date().toISOString(),
          sources: ['src/data.txt'],
          template: 'templates/template.md',
          outline: { // Outline exists
            title: 'Templated Outline',
            chapters: [{ title: 'Section 1', articles: [{ title: 's1' }] }],
          },
        });
      }
      return '';
    });

    const details = getProjectDetails(projectName);
    expect(details).toBeDefined();
    expect(details.name).toBe(projectName);
    expect(details.type).toBe('templated');
    expect(details.status).toEqual({ type: 'text', value: 'Not started' });
    expect(details).toHaveProperty('createdAt');
  });

  it('should throw an error if the project details are not found', () => {
    const projectName = 'non-existent-details';
    const projectPath = path.resolve(PROJECTS_DIR, projectName);
    const projectJsonPath = path.resolve(projectPath, 'project.json');

    (fs.existsSync as jest.Mock).mockImplementation((p) => p !== projectJsonPath);

    expect(() => getProjectDetails(projectName)).toThrow(`Project ${projectName} not found.`);
  });

  it('should throw an error if project.json is invalid', () => {
    const projectName = 'invalid-json-details';
    const projectPath = path.resolve(PROJECTS_DIR, projectName);
    const projectJsonPath = path.resolve(projectPath, 'project.json');

    (fs.existsSync as jest.Mock).mockImplementation((p) => p === projectJsonPath);
    (fs.readFileSync as jest.Mock).mockImplementation((p) => {
      if (p === projectJsonPath) return 'not valid json';
      return '';
    });

    expect(() => getProjectDetails(projectName)).toThrow(`Error reading details for project ${projectName}.`);
  });
});

describe('getProjectOutline', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    (fs.readFileSync as jest.Mock).mockReturnValue('');
  });

  it('should return the outline for any project type that has one', () => {
    const projectName = 'templated-with-outline';
    const projectPath = path.resolve(PROJECTS_DIR, projectName);
    const projectJsonPath = path.resolve(projectPath, 'project.json');
    const mockOutline: BookOutline = {
      title: 'My Templated Outline',
      chapters: [{ title: 'Section 1', articles: [{ title: 'Topic 1.1' }] }],
    };

    (fs.existsSync as jest.Mock).mockImplementation((p) => p === projectJsonPath);
    (fs.readFileSync as jest.Mock).mockImplementation((p) => {
      if (p === projectJsonPath) {
        return JSON.stringify({
          name: projectName,
          type: 'templated',
          createdAt: new Date().toISOString(),
          sources: [],
          template: 'template.md',
          outline: mockOutline,
        });
      }
      return '';
    });

    const outline = getProjectOutline(projectName);
    expect(outline).toEqual(mockOutline);
  });

  it('should return undefined if a project has no outline', () => {
    const projectName = 'book-without-outline';
    const projectPath = path.resolve(PROJECTS_DIR, projectName);
    const projectJsonPath = path.resolve(projectPath, 'project.json');

    (fs.existsSync as jest.Mock).mockImplementation((p) => p === projectJsonPath);
    (fs.readFileSync as jest.Mock).mockImplementation((p) => {
      if (p === projectJsonPath) {
        return JSON.stringify({
          name: projectName,
          type: 'book',
          createdAt: new Date().toISOString(),
          idea: { language: 'en', summary: 'summary', prompt: 'prompt' },
        });
      }
      return '';
    });

    const outline = getProjectOutline(projectName);
    expect(outline).toBeUndefined();
  });

  it('should throw an error if project is not found', () => {
    const projectName = 'non-existent-outline-project';
    expect(() => getProjectOutline(projectName)).toThrow(`Project ${projectName} not found.`);
  });

  it('should throw an error if project.json is invalid', () => {
    const projectName = 'invalid-json-outline-project';
    const projectPath = path.resolve(PROJECTS_DIR, projectName);
    const projectJsonPath = path.resolve(projectPath, 'project.json');

    (fs.existsSync as jest.Mock).mockImplementation((p) => p === projectJsonPath);
    (fs.readFileSync as jest.Mock).mockImplementation((p) => {
      if (p === projectJsonPath) return 'not valid json';
      return '';
    });

    expect(() => getProjectOutline(projectName)).toThrow(`Error reading project JSON for ${projectName}.`);
  });
});

describe('generateProjectOutline', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    (fs.readFileSync as jest.Mock).mockReturnValue('');
    process.env.OPENAI_API_KEY = 'test-api-key';
    process.env.MOCK_LLM = 'true';
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.MOCK_LLM;
  });

  it('should generate and save a new outline for a book project', async () => {
    const projectName = 'book-to-generate-outline';
    const projectPath = path.resolve(PROJECTS_DIR, projectName);
    const projectJsonPath = path.resolve(projectPath, 'project.json');

    (fs.existsSync as jest.Mock).mockImplementation((p) => p === projectJsonPath);
    (fs.readFileSync as jest.Mock).mockImplementation((p) => {
      if (p === projectJsonPath) {
        return JSON.stringify({
          name: projectName,
          type: 'book',
          createdAt: new Date().toISOString(),
          idea: { language: 'en', summary: 'summary', prompt: 'prompt' },
        });
      }
      return '';
    });

    const result = await generateProjectOutline(projectName);
    expect(result.title).toBe('Mock Generated Outline');

    const writeFileSyncCalls = (fs.writeFileSync as jest.Mock).mock.calls;
    expect(writeFileSyncCalls.length).toBe(1);
    expect(writeFileSyncCalls[0][0]).toBe(projectJsonPath);
    const writtenContent = JSON.parse(writeFileSyncCalls[0][1]);
    expect(writtenContent.outline.title).toBe('Mock Generated Outline');
  });

  it('should generate an outline for a templated project from a template file', async () => {
    const projectName = 'templated-project-generate-outline';
    const projectPath = path.resolve(PROJECTS_DIR, projectName);
    const projectJsonPath = path.resolve(projectPath, 'project.json');
    const templatePath = path.resolve(projectPath, 'template.md');

    (fs.existsSync as jest.Mock).mockImplementation((p) => [projectJsonPath, templatePath].includes(p));
    (fs.readFileSync as jest.Mock).mockImplementation((p) => {
      if (p === projectJsonPath) {
        return JSON.stringify({
          name: projectName,
          type: 'templated',
          createdAt: new Date().toISOString(),
          sources: [],
          template: 'template.md',
        });
      }
      if (p === templatePath) {
        return 'This is the template content to extract an outline from.';
      }
      return '';
    });

    const result = await generateProjectOutline(projectName);
    expect(result.title).toBe('Mock Generated Outline');

    const writeFileSyncCalls = (fs.writeFileSync as jest.Mock).mock.calls;
    expect(writeFileSyncCalls.length).toBe(1);
    const writtenContent = JSON.parse(writeFileSyncCalls[0][1]);
    expect(writtenContent.outline.title).toBe('Mock Generated Outline');
  });


  it('should throw an error if outline already exists and overwrite is false', async () => {
    const projectName = 'book-with-existing-outline';
    const projectPath = path.resolve(PROJECTS_DIR, projectName);
    const projectJsonPath = path.resolve(projectPath, 'project.json');
    const existingOutline: BookOutline = {
      title: 'Existing Outline',
      chapters: [{ title: 'Existing Chapter', articles: [{ title: 'Existing Article' }] }],
    };

    (fs.existsSync as jest.Mock).mockImplementation((p) => p === projectJsonPath);
    (fs.readFileSync as jest.Mock).mockImplementation((p) => {
      if (p === projectJsonPath) {
        return JSON.stringify({
          name: projectName,
          type: 'book',
          createdAt: new Date().toISOString(),
          idea: { language: 'en', summary: 'summary', prompt: 'prompt' },
          outline: existingOutline,
        });
      }
      return '';
    });

    await expect(generateProjectOutline(projectName, false)).rejects.toThrow('Outline already exists. Use --overwrite to force.');
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  it('should throw an error if project is not found', async () => {
    const projectName = 'non-existent-generate-outline-project';
    await expect(generateProjectOutline(projectName)).rejects.toThrow(`Project ${projectName} not found.`);
  });

  it('should throw an error if OPENAI_API_KEY is not set', async () => {
    const projectName = 'book-no-api-key';
    const projectPath = path.resolve(PROJECTS_DIR, projectName);
    const projectJsonPath = path.resolve(projectPath, 'project.json');

    (fs.existsSync as jest.Mock).mockImplementation((p) => p === projectJsonPath);
    (fs.readFileSync as jest.Mock).mockImplementation((p) => {
      if (p === projectJsonPath) {
        return JSON.stringify({
          name: projectName,
          type: 'book',
          createdAt: new Date().toISOString(),
          idea: { language: 'en', summary: 'summary', prompt: 'prompt' },
        });
      }
      return '';
    });

    delete process.env.OPENAI_API_KEY; // Unset API key

    await expect(generateProjectOutline(projectName)).rejects.toThrow('OpenAI API key not set.');
  });
});

describe('saveProjectOutline', () => {
  const mockOutline: BookOutline = {
    title: "New Saved Outline",
    chapters: [
      { title: "Chapter A", articles: [{ title: "Article A.1" }] },
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    (fs.readFileSync as jest.Mock).mockReturnValue('');
    (fs.writeFileSync as jest.Mock).mockReturnValue(undefined); // Default successful write
  });

  it('should save a new outline for any supported project type (e.g., templated)', async () => {
    const projectName = 'templated-to-save-outline';
    const projectPath = path.resolve(PROJECTS_DIR, projectName);
    const projectJsonPath = path.resolve(projectPath, 'project.json');

    (fs.existsSync as jest.Mock).mockImplementation((p) => p === projectJsonPath);
    (fs.readFileSync as jest.Mock).mockImplementation((p) => {
      if (p === projectJsonPath) {
        return JSON.stringify({
          name: projectName,
          type: 'templated',
          createdAt: new Date().toISOString(),
          sources: [],
          template: 'template.md',
        });
      }
      return '';
    });

    await expect(saveProjectOutline(projectName, mockOutline)).resolves.toBeUndefined();

    const writeFileSyncCalls = (fs.writeFileSync as jest.Mock).mock.calls;
    expect(writeFileSyncCalls.length).toBe(1);
    expect(writeFileSyncCalls[0][0]).toBe(projectJsonPath);
    const writtenContent = JSON.parse(writeFileSyncCalls[0][1]);
    expect(writtenContent.outline).toEqual(mockOutline);
  });

  it('should throw an error if project is not found', async () => {
    const projectName = 'non-existent-save-outline-project';
    await expect(saveProjectOutline(projectName, mockOutline)).rejects.toThrow(`Project ${projectName} not found.`);
  });

  it('should throw an error if outline schema is invalid', async () => {
    const projectName = 'book-invalid-save-outline';
    const projectPath = path.resolve(PROJECTS_DIR, projectName);
    const projectJsonPath = path.resolve(projectPath, 'project.json');

    (fs.existsSync as jest.Mock).mockImplementation((p) => p === projectJsonPath);
    (fs.readFileSync as jest.Mock).mockImplementation((p) => {
      if (p === projectJsonPath) {
        return JSON.stringify({
          name: projectName,
          type: 'book',
          createdAt: new Date().toISOString(),
          idea: { language: 'en', summary: 'summary', prompt: 'prompt' },
        });
      }
      return '';
    });

    const invalidOutline: any = { title: "Invalid", chapters: "not an array" };
    await expect(saveProjectOutline(projectName, invalidOutline)).rejects.toThrow(/Generated outline does not match schema/);
  });

  it('should throw an error if writing file fails', async () => {
    const projectName = 'book-save-outline-fail';
    const projectPath = path.resolve(PROJECTS_DIR, projectName);
    const projectJsonPath = path.resolve(projectPath, 'project.json');

    (fs.existsSync as jest.Mock).mockImplementation((p) => p === projectJsonPath);
    (fs.readFileSync as jest.Mock).mockImplementation((p) => {
      if (p === projectJsonPath) {
        return JSON.stringify({
          name: projectName,
          type: 'book',
          createdAt: new Date().toISOString(),
          idea: { language: 'en', summary: 'summary', prompt: 'prompt' },
        });
      }
      return '';
    });
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {
      throw new Error('Disk full');
    });

    await expect(saveProjectOutline(projectName, mockOutline)).rejects.toThrow('Failed to save outline.');
  });
});

describe('getGeneratedProjectContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    (fs.readFileSync as jest.Mock).mockReturnValue('');
  });

  it('should return generated content if generated.json exists and is valid', () => {
    const projectName = 'project-with-generated-content';
    const generatedJsonPath = path.resolve(PROJECTS_DIR, projectName, 'generated.json');
    const mockGeneratedContent = {
      title: 'Generated Book',
      chapters: [
        {
          title: 'Chapter 1',
          articles: [
            { title: 'Article 1.1', content: 'Content 1.1', status: 'done' },
          ],
        },
      ],
    };

    (fs.existsSync as jest.Mock).mockImplementation((p) => p === generatedJsonPath);
    (fs.readFileSync as jest.Mock).mockImplementation((p) => {
      if (p === generatedJsonPath) {
        return JSON.stringify(mockGeneratedContent);
      }
      return '';
    });

    const content = getGeneratedProjectContent(projectName);
    expect(content).toEqual(mockGeneratedContent);
  });

  it('should return null if generated.json does not exist', () => {
    const projectName = 'project-without-generated-content';
    // existsSync will return false by default due to beforeEach

    const content = getGeneratedProjectContent(projectName);
    expect(content).toBeNull();
  });

  it('should throw an error if generated.json is invalid JSON', () => {
    const projectName = 'project-with-invalid-json';
    const generatedJsonPath = path.resolve(PROJECTS_DIR, projectName, 'generated.json');

    (fs.existsSync as jest.Mock).mockImplementation((p) => p === generatedJsonPath);
    (fs.readFileSync as jest.Mock).mockImplementation((p) => {
      if (p === generatedJsonPath) {
        return 'this is not valid json';
      }
      return '';
    });

    expect(() => getGeneratedProjectContent(projectName)).toThrow(`Error reading generated project content for ${projectName}.`);
  });

  it('should throw an error if generated.json does not match schema', () => {
    const projectName = 'project-with-schema-mismatch';
    const generatedJsonPath = path.resolve(PROJECTS_DIR, projectName, 'generated.json');
    const invalidGeneratedContent = {
      title: 'Invalid Content',
      chapters: 'not an array', // Should be an array of chapters
    };

    (fs.existsSync as jest.Mock).mockImplementation((p) => p === generatedJsonPath);
    (fs.readFileSync as jest.Mock).mockImplementation((p) => {
      if (p === generatedJsonPath) {
        return JSON.stringify(invalidGeneratedContent);
      }
      return '';
    });

    expect(() => getGeneratedProjectContent(projectName)).toThrow(`Error reading generated project content for ${projectName}.`);
  });

  it('should throw an error if readFileSync fails', () => {
    const projectName = 'project-read-fail';
    const generatedJsonPath = path.resolve(PROJECTS_DIR, projectName, 'generated.json');

    (fs.existsSync as jest.Mock).mockImplementation((p) => p === generatedJsonPath);
    (fs.readFileSync as jest.Mock).mockImplementation(() => {
      throw new Error('Permission denied');
    });

    expect(() => getGeneratedProjectContent(projectName)).toThrow(`Error reading generated project content for ${projectName}.`);
  });
});

describe('saveGeneratedProjectContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    (fs.readFileSync as jest.Mock).mockReturnValue('');
    (fs.writeFileSync as jest.Mock).mockReturnValue(undefined); // Default successful write
  });

  it('should successfully save generated content', () => {
    const projectName = 'project-to-save';
    const generatedJsonPath = path.resolve(PROJECTS_DIR, projectName, 'generated.json');
    const mockContent: GeneratedContent = {
      title: 'My Generated Book',
      chapters: [
        {
          title: 'Intro',
          articles: [{ title: 'Article 1', content: 'Content of article 1', status: 'done' }],
        },
      ],
    };

    saveGeneratedProjectContent(projectName, mockContent);

    expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      generatedJsonPath,
      JSON.stringify(mockContent, null, 2)
    );
  });

  it('should throw an error if writing the file fails', () => {
    const projectName = 'project-save-fail';
    const mockContent: GeneratedContent = {
      title: 'My Generated Book',
      chapters: [
        {
          title: 'Intro',
          articles: [{ title: 'Article 1', content: 'Content of article 1', status: 'done' }],
        },
      ],
    };

    (fs.writeFileSync as jest.Mock).mockImplementation(() => {
      throw new Error('Disk full error');
    });

    expect(() => saveGeneratedProjectContent(projectName, mockContent)).toThrow(`Error saving generated project content for ${projectName}.`);
    expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
  });
});

describe('startContentGeneration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    (fs.readFileSync as jest.Mock).mockReturnValue('');
    (fs.writeFileSync as jest.Mock).mockReturnValue(undefined); // Default successful write
    process.env.OPENAI_API_KEY = 'test-api-key';
    process.env.MOCK_LLM = 'true';
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.MOCK_LLM;
  });

  it('should successfully generate content for any outline-based project (e.g. templated)', async () => {
    const projectName = 'templated-project-generate';
    const projectPath = path.resolve(PROJECTS_DIR, projectName);
    const projectJsonPath = path.resolve(projectPath, 'project.json');
    const generatedJsonPath = path.resolve(projectPath, 'generated.json');

    const mockProjectJson = {
      name: projectName,
      type: 'templated',
      createdAt: new Date().toISOString(),
      sources: [],
      template: 'template.md',
      outline: {
        title: 'My Templated Outline',
        chapters: [
          { title: 'Section 1', articles: [{ title: 'Topic 1.1' }] },
        ],
      },
    };

    (fs.existsSync as jest.Mock).mockImplementation((p) => {
      if (p === projectJsonPath) return true;
      if (p === generatedJsonPath) return false;
      return false;
    });
    (fs.readFileSync as jest.Mock).mockImplementation((p) => {
      if (p === projectJsonPath) {
        return JSON.stringify(mockProjectJson);
      }
      return '';
    });

    await startContentGeneration(projectName);

    const writeFileSyncCalls = (fs.writeFileSync as jest.Mock).mock.calls;
    expect(writeFileSyncCalls.length).toBeGreaterThan(0);

    const finalGeneratedContentCall = writeFileSyncCalls[writeFileSyncCalls.length - 1];
    expect(finalGeneratedContentCall[0]).toBe(generatedJsonPath);
    const finalContent = JSON.parse(finalGeneratedContentCall[1]);
    expect(finalContent.chapters[0].articles[0].status).toBe('done');
    expect(finalContent.chapters[0].articles[0].content).toBe("This is mock generated article content based on the context.");
  });

  it('should throw an error if project is not found', async () => {
    const projectName = 'non-existent-project';
    await expect(startContentGeneration(projectName)).rejects.toThrow(`Project ${projectName} not found.`);
  });

  it('should throw an error if project has no outline', async () => {
    const projectName = 'book-no-outline';
    const projectPath = path.resolve(PROJECTS_DIR, projectName);
    const projectJsonPath = path.resolve(projectPath, 'project.json');

    const mockProjectJson = {
      name: projectName,
      type: 'book',
      createdAt: new Date().toISOString(),
      idea: { language: 'en', summary: 'summary', prompt: 'prompt' },
      // No outline property
    };

    (fs.existsSync as jest.Mock).mockImplementation((p) => p === projectJsonPath);
    (fs.readFileSync as jest.Mock).mockImplementation((p) => {
      if (p === projectJsonPath) {
        return JSON.stringify(mockProjectJson);
      }
      return '';
    });

    await expect(startContentGeneration(projectName)).rejects.toThrow(`No outline found for project ${projectName}.`);
  });

  it('should throw an error if OpenAI API key is not set for non-mocked LLM', async () => {
    const projectName = 'book-no-api-key';
    const projectPath = path.resolve(PROJECTS_DIR, projectName);
    const projectJsonPath = path.resolve(projectPath, 'project.json');

    const mockProjectJson = {
      name: projectName,
      type: 'book',
      createdAt: new Date().toISOString(),
      idea: { language: 'en', summary: 'summary', prompt: 'prompt' },
      outline: {
        title: 'My Book Outline',
        chapters: [
          { title: 'Chapter 1', articles: [{ title: 'Article 1.1' }] },
        ],
      },
    };

    (fs.existsSync as jest.Mock).mockImplementation((p) => p === projectJsonPath);
    (fs.readFileSync as jest.Mock).mockImplementation((p) => {
      if (p === projectJsonPath) {
        return JSON.stringify(mockProjectJson);
      }
      return '';
    });

    delete process.env.OPENAI_API_KEY; // Unset API key
    process.env.MOCK_LLM = 'false'; // Ensure MOCK_LLM is false to trigger API key check

    await expect(startContentGeneration(projectName)).rejects.toThrow('OpenAI API key not set.');
  });
});

describe('publishProject', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    (fs.readFileSync as jest.Mock).mockReturnValue('');
    (fs.writeFileSync as jest.Mock).mockReturnValue(undefined);
    (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);
    (fs.rmSync as jest.Mock).mockReturnValue(undefined);
  });

  it('should successfully publish a book project', async () => {
    const projectName = 'book-to-publish';
    const projectPath = path.resolve(PROJECTS_DIR, projectName);
    const projectJsonPath = path.resolve(projectPath, 'project.json');
    const generatedJsonPath = path.resolve(projectPath, 'generated.json');
    const expectedOutputPath = path.resolve(projectPath, 'output', `${projectName}.md`);

    const mockProjectJson = {
      name: projectName,
      type: 'book',
      createdAt: new Date().toISOString(),
      idea: { language: 'en', summary: 'Book summary', prompt: 'Book prompt' },
      outline: {
        title: 'My Book Outline',
        chapters: [
          { title: 'Chapter 1', articles: [{ title: 'Article 1.1' }, { title: 'Article 1.2' }] },
          { title: 'Chapter 2', articles: [{ title: 'Article 2.1' }] },
        ],
      },
    };

    (fs.existsSync as jest.Mock).mockImplementation((p) => {
      if (p === projectJsonPath) return true;
      if (p === generatedJsonPath) return true;
      if (p === path.dirname(expectedOutputPath)) return false; // Ensure mkdirSync is called
      return false;
    });
    (fs.readFileSync as jest.Mock).mockImplementation((p) => {
      if (p === projectJsonPath) {
        return JSON.stringify(mockProjectJson);
      }
      if (p === generatedJsonPath) {
        return JSON.stringify({
          title: 'My Book',
          chapters: [
            {
              title: 'Chapter 1',
              articles: [
                { title: 'Article 1.1', content: 'Content of Article 1.1', status: 'done' },
                { title: 'Article 1.2', content: 'Content of Article 1.2', status: 'done' },
              ],
            },
            {
              title: 'Chapter 2',
              articles: [
                { title: 'Article 2.1', content: 'Content of Article 2.1', status: 'done' },
              ],
            },
          ],
        });
      }
      return '';
    });

    const result = await publishProject(projectName, 'single-markdown');
    expect(result).toEqual({ message: `Project published successfully to ${expectedOutputPath}.`, filePath: path.relative(GENDOC_WORKSPACE, expectedOutputPath) });
    expect(fs.mkdirSync).toHaveBeenCalledWith(path.dirname(expectedOutputPath), { recursive: true });
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expectedOutputPath,
      '## Chapter 1\n\n### Article 1.1\n\nContent of Article 1.1\n\n### Article 1.2\n\nContent of Article 1.2\n\n## Chapter 2\n\n### Article 2.1\n\nContent of Article 2.1',
      'utf-8'
    );
  });

  it('should successfully publish a series project (multiple-markdown-zip)', async () => {
    const projectName = 'series-to-publish-zip';
    const projectPath = path.resolve(PROJECTS_DIR, projectName);
    const projectJsonPath = path.resolve(projectPath, 'project.json');
    const generatedJsonPath = path.resolve(projectPath, 'generated.json');
    const expectedZipPath = path.resolve(projectPath, 'output', `${projectName}.zip`);

    const mockProjectJson = {
      name: projectName,
      type: 'series',
      createdAt: new Date().toISOString(),
      idea: { language: 'en', summary: 'Series summary', prompt: 'Series prompt' },
      outline: {
        title: 'My Series Outline',
        chapters: [
          { title: 'Part 1', articles: [{ title: 'Episode 1.1' }] },
        ],
      },
    };

    (fs.existsSync as jest.Mock).mockImplementation((p) => {
      if (p === projectJsonPath) return true;
      if (p === generatedJsonPath) return true;
      if (p === path.dirname(expectedZipPath)) return false; // Ensure mkdirSync is called
      return false;
    });
    (fs.readFileSync as jest.Mock).mockImplementation((p) => {
      if (p === projectJsonPath) {
        return JSON.stringify(mockProjectJson);
      }
      if (p === generatedJsonPath) {
        return JSON.stringify({
          title: 'My Series',
          chapters: [
            {
              title: 'Part 1',
              articles: [
                { title: 'Episode 1.1', content: 'Content of Episode 1.1', status: 'done' },
              ],
            },
          ],
        });
      }
      return '';
    });

    const result = await publishProject(projectName, 'multiple-markdown-zip');
    expect(result).toEqual({ message: `Project published successfully to ${expectedZipPath} (ZIP).`, filePath: path.relative(GENDOC_WORKSPACE, expectedZipPath) });
    expect(fs.mkdirSync).toHaveBeenCalledWith(path.dirname(expectedZipPath), { recursive: true });
    expect(archiver).toHaveBeenCalledWith('zip', { zlib: { level: 9 } });
    // Expect fs.rmSync to be called for temp directory cleanup
    expect(fs.rmSync).toHaveBeenCalledWith(expect.stringContaining('temp_articles'), { recursive: true, force: true });
  });

  it('should successfully publish a templated project from its generated.json', async () => {
    const projectName = 'templated-to-publish';
    const projectPath = path.resolve(PROJECTS_DIR, projectName);
    const projectJsonPath = path.resolve(projectPath, 'project.json');
    const generatedJsonPath = path.resolve(projectPath, 'generated.json');
    const expectedOutputPath = path.resolve(projectPath, 'output', `${projectName}.md`);

    const mockProjectJson = {
      name: projectName,
      type: 'templated',
      createdAt: new Date().toISOString(),
      sources: ['src/data.txt'],
      template: 'templates/template.md',
      outline: { title: 'My Templated Outline', chapters: [{ title: 'Section 1', articles: [{ title: 'Topic 1' }] }] },
    };

    (fs.existsSync as jest.Mock).mockImplementation((p) => {
      if (p === projectJsonPath) return true;
      if (p === generatedJsonPath) return true; // The generated content exists
      return false;
    });
    (fs.readFileSync as jest.Mock).mockImplementation((p) => {
      if (p === projectJsonPath) {
        return JSON.stringify(mockProjectJson);
      }
      if (p === generatedJsonPath) {
        return JSON.stringify({
          title: 'My Templated Outline',
          chapters: [
            {
              title: 'Section 1',
              articles: [
                { title: 'Topic 1', content: 'Content for templated topic 1.', status: 'done' },
              ],
            },
          ],
        });
      }
      return '';
    });

    const result = await publishProject(projectName, 'single-markdown');
    expect(result).toEqual({ message: `Project published successfully to ${expectedOutputPath}.`, filePath: path.relative(GENDOC_WORKSPACE, expectedOutputPath) });
    expect(fs.mkdirSync).toHaveBeenCalledWith(path.dirname(expectedOutputPath), { recursive: true });
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expectedOutputPath,
      '## Section 1\n\n### Topic 1\n\nContent for templated topic 1.',
      'utf-8'
    );
  });

  it('should throw an error if project is not found', async () => {
    const projectName = 'non-existent-publish-project';
    const projectPath = path.resolve(PROJECTS_DIR, projectName);
    const projectJsonPath = path.resolve(projectPath, 'project.json');

    // Ensure project.json does NOT exist
    (fs.existsSync as jest.Mock).mockImplementation((p) => p !== projectJsonPath);

    await expect(publishProject(projectName, 'single-markdown')).rejects.toThrow(`Project ${projectName} not found.`);
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  it('should throw an error if no generated content found for any project type', async () => {
    const projectName = 'book-no-generated-content';
    const projectPath = path.resolve(PROJECTS_DIR, projectName);
    const projectJsonPath = path.resolve(projectPath, 'project.json');

    const mockProjectJson = {
      name: projectName,
      type: 'book',
      createdAt: new Date().toISOString(),
      idea: { language: 'en', summary: 'Outline summary', prompt: 'Outline prompt' },
      outline: { title: 'Outline', chapters: [] },
    };

    (fs.existsSync as jest.Mock).mockImplementation((p) => p === projectJsonPath); // generated.json does not exist
    (fs.readFileSync as jest.Mock).mockImplementation((p) => {
      if (p === projectJsonPath) {
        return JSON.stringify(mockProjectJson);
      }
      return '';
    });

    await expect(publishProject(projectName, 'single-markdown')).rejects.toThrow(`No generated content found for project ${projectName}.`);
  });

  it('should throw an error if writeFileSync fails during publication', async () => {
    const projectName = 'book-publish-write-fail';
    const projectPath = path.resolve(PROJECTS_DIR, projectName);
    const projectJsonPath = path.resolve(projectPath, 'project.json');
    const generatedJsonPath = path.resolve(projectPath, 'generated.json');

    const mockProjectJson = {
      name: projectName,
      type: 'book',
      createdAt: new Date().toISOString(),
      idea: { language: 'en', summary: 'Outline summary', prompt: 'Outline prompt' },
      outline: { title: 'Outline', chapters: [] },
    };

    (fs.existsSync as jest.Mock).mockImplementation((p) => p === projectJsonPath || p === generatedJsonPath);
    (fs.readFileSync as jest.Mock).mockImplementation((p) => {
      if (p === projectJsonPath) return JSON.stringify(mockProjectJson);
      if (p === generatedJsonPath) return JSON.stringify({ title: 'My Book', chapters: [] });
      return '';
    });
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {
      throw new Error('Disk full error');
    });

    await expect(publishProject(projectName, 'single-markdown')).rejects.toThrow(`Disk full error`);
  });
});
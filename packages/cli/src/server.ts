import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
import express from 'express';
import * as fs from 'fs';
import multer from 'multer';
import { Buffer } from 'node:buffer';

import { getProjectList, createProject, deleteProject, getProjectDetails, getGeneratedProjectContent, saveGeneratedProjectContent,generateProjectOutline, startContentGeneration, saveProjectOutline, publishProject, resetStaleGenerationStatuses } from './core/projectManager';
import { getConfig, writeGlobalConfig, reloadConfig } from './core/configManager';
import { AppConfig, ProjectSchema, getWorkspacePath } from '@gendoc/shared'; // Import ProjectSchema from types.ts
import { z } from 'zod';

export const app = express();
const port = 3000;

// Multer setup for file uploads
const uploadDir = path.resolve(getWorkspacePath(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Attempt to re-encode originalname to ensure UTF-8
    const originalnameBuffer = Buffer.from(file.originalname, 'latin1');
    const utf8Originalname = originalnameBuffer.toString('utf8');
    cb(null, `${Date.now()}-${utf8Originalname}`);
  },
});
const upload = multer({ storage: storage });

app.use(express.json()); // Middleware to parse JSON request bodies
app.use(express.static(path.join(__dirname, '../public')));

// API endpoint for file uploads
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }
  // Return the path relative to the workspace directory
  const relativeToWorkspacePath = path.relative(getWorkspacePath(), req.file.path);
  res.status(200).json({ filePath: relativeToWorkspacePath, fileName: req.file.filename });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/api/projects', (req, res) => {
  try {
    const projects = getProjectList();
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Error fetching projects' });
  }
});

app.post('/api/projects', (req, res) => {
  try {
    const parsedProject = ProjectSchema.parse(req.body); // Validate incoming data
    const newProject = createProject(parsedProject); // Pass validated data
    res.status(201).json(newProject);
  } catch (error: any) {
    console.error('Error creating project:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation Error', errors: error.errors });
    }
    res.status(400).json({ message: error.message });
  }
});

app.delete('/api/projects/:name', (req, res) => {
  try {
    const projectName = req.params.name;
    deleteProject(projectName);
    res.status(200).json({ message: `Project '${projectName}' deleted successfully.` });
  } catch (error: any) {
    console.error('Error deleting project:', error);
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/locales/:lang', (req, res) => {
  const lang = req.params.lang;
  // Locales are copied to the dist/locales directory during build, so the path should be relative to __dirname
  const localeFilePath = path.resolve(__dirname, 'locales', `${lang}.json`);

  fs.readFile(localeFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error(`Error reading locale file for ${lang}:`, err);
      return res.status(404).json({ message: 'Locale file not found' });
    }
    try {
      const localeData = JSON.parse(data);
      res.json(localeData);
    } catch (parseError) {
      console.error(`Error parsing locale file for ${lang}:`, parseError);
      res.status(500).json({ message: 'Error parsing locale file' });
    }
  });
});

app.get('/api/config', (req, res) => {
  try {
    const config = getConfig();
    res.json(config);
  } catch (error) {
    console.error('Error fetching config:', error);
    res.status(500).json({ message: 'Error fetching config' });
  }
});

app.put('/api/config', (req, res) => {
  try {
    const config: Partial<AppConfig> = req.body;
    writeGlobalConfig(config);
    reloadConfig(); // Reload the configuration in the running process
    res.status(200).json({ message: 'Configuration saved successfully.' });
  } catch (error: any) {
    console.error('Error saving config:', error);
    res.status(500).json({ message: error.message });
  }
});

// API endpoint for single project details
app.get('/api/projects/:projectName', (req, res) => {
  try {
    const projectName = req.params.projectName;
    const projectDetails = getProjectDetails(projectName);
    res.json(projectDetails);
  } catch (error: any) {
    console.error('Error fetching project details:', error);
    res.status(404).json({ message: error.message });
  }
});

// API endpoint to get project content
app.get('/api/projects/:projectName/content', (req, res) => {
  try {
    const projectName = req.params.projectName;
    const content = getGeneratedProjectContent(projectName);
    res.send(content);
  } catch (error: any) {
    console.error('Error fetching project content:', error);
    res.status(500).json({ message: error.message });
  }
});

// API endpoint to save project content
app.put('/api/projects/:projectName/content', (req, res) => {
  try {
    const projectName = req.params.projectName;
    const { content } = req.body;
    saveGeneratedProjectContent(projectName, content);
    res.status(200).json({ message: 'Content saved successfully.' });
  } catch (error: any) {
    console.error('Error saving project content:', error);
    res.status(500).json({ message: error.message });
  }
});

// API endpoint to generate outline
app.post('/api/projects/:projectName/outline', async (req, res) => {
  try {
    const projectName = req.params.projectName;
    const { overwrite } = req.body; // Expect overwrite boolean from frontend
    const outline = await generateProjectOutline(projectName, overwrite);
    res.status(200).json({ message: 'Outline generated successfully.', outline });
  } catch (error: any) {
    console.error('Error generating outline:', error);
    res.status(400).json({ message: error.message });
  }
});

// API endpoint to save outline
app.post('/api/projects/:projectName/outline/save', async (req, res) => {
  try {
    const projectName = req.params.projectName;
    const { outline } = req.body;
    await saveProjectOutline(projectName, outline);
    res.status(200).json({ message: 'Outline saved successfully.' });
  } catch (error: any) {
    console.error('Error saving outline:', error);
    res.status(400).json({ message: error.message });
  }
});

// API endpoint to start content generation
app.post('/api/projects/:projectName/run', (req, res) => {
  try {
    const projectName = req.params.projectName;
    // Don't await, let it run in the background
    startContentGeneration(projectName).catch(error => {
      // We need to handle potential errors here, otherwise they'll be unhandled
      console.error(`Error during content generation for project ${projectName}:`, error);
      // Optionally, we could update the project status to 'error' here
    });
    res.status(202).json({ message: 'Content generation accepted.' });
  } catch (error: any) {
    // This will catch synchronous errors, e.g., if getProjectDetails throws an error
    console.error('Error starting content generation:', error);
    res.status(400).json({ message: error.message });
  }
});

// API endpoint to publish project
app.post('/api/projects/:projectName/publish', async (req, res) => {
  try {
    const projectName = req.params.projectName;
    const { publishType } = req.body;
    const result = await publishProject(projectName, publishType);
    res.status(200).json(result);
  } catch (error: any) {
    console.error('Error publishing project:', error);
    res.status(400).json({ message: error.message });
  }
});

// API endpoint for file download
app.get('/api/download', (req, res) => {
    const { filePath } = req.query;

    if (!filePath || typeof filePath !== 'string') {
        return res.status(400).json({ message: 'File path is required.' });
    }

    const workspacePath = getWorkspacePath();
    // Resolve the relative path against the workspace path
    const absoluteFilePath = path.resolve(workspacePath, filePath);

    // Security check: Ensure the path is within the allowed directory
    if (!absoluteFilePath.startsWith(workspacePath)) {
        return res.status(403).json({ message: 'Access to the specified file path is forbidden.' });
    }

    if (!fs.existsSync(absoluteFilePath)) {
        return res.status(404).json({ message: 'File not found.' });
    }

    res.download(absoluteFilePath, (err) => {
        if (err) {
            console.error('Error downloading file:', err);
            // Avoid sending a second response if one has already been sent
            if (!res.headersSent) {
              res.status(500).json({ message: 'Error downloading file.' });
            }
        }
    });
});

// All other GET requests not handled by API routes should serve the Vue app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

// Reset any stale 'running' generation statuses on startup
resetStaleGenerationStatuses();

export default app;
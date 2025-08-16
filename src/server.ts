import 'dotenv/config';
import express from 'express';
import path from 'path';
import * as fs from 'fs';
import multer from 'multer';
import { Buffer } from 'node:buffer';
import { getProjectList, createProject, deleteProject, getProjectDetails, getGeneratedProjectContent, saveGeneratedProjectContent,generateProjectOutline, startContentGeneration, saveProjectOutline, publishProject } from './core/projectManager';
import { ProjectSchema } from './types'; // Import ProjectSchema from types.ts
import { z } from 'zod';

export const app = express();
const port = 3000;

// Multer setup for file uploads
const uploadDir = path.resolve(process.cwd(), 'gendoc-workspace', 'uploads');
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
  // Return the path relative to the project root or a unique identifier
  // For now, return the full path, frontend will need to handle it.
  const relativeToCwdPath = path.relative(process.cwd(), req.file.path);
  res.status(200).json({ filePath: relativeToCwdPath, fileName: req.file.filename });
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
  const localeFilePath = path.join(__dirname, '..', 'locales', `${lang}.json`);

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
app.post('/api/projects/:projectName/generate-content', async (req, res) => {
  try {
    const projectName = req.params.projectName;
    const result = await startContentGeneration(projectName);
    res.status(200).json({ message: 'Content generation started successfully.', result });
  } catch (error: any) {
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

    // Security check: Ensure the path is within the allowed directory
    const allowedDirectory = path.resolve(process.cwd());
    const absoluteFilePath = path.resolve(filePath);

    if (!absoluteFilePath.startsWith(allowedDirectory)) {
        return res.status(403).json({ message: 'Access to the specified file path is forbidden.' });
    }

    if (!fs.existsSync(absoluteFilePath)) {
        return res.status(404).json({ message: 'File not found.' });
    }

    res.download(absoluteFilePath, (err) => {
        if (err) {
            console.error('Error downloading file:', err);
            res.status(500).json({ message: 'Error downloading file.' });
        }
    });
});

// Route for project detail page
app.get('/projects/:projectName', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/project-detail.html'));
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

export default app;
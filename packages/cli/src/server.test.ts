import request from 'supertest';
import app from './server'; // Assuming app is exported as default from server.ts
import * as projectManager from './core/projectManager';

// Mock the projectManager module
jest.mock('./core/projectManager');

describe('GET /api/projects', () => {
  it('should return an empty array if no projects exist', async () => {
    // Mock getProjectList to return an empty array
    (projectManager.getProjectList as jest.Mock).mockReturnValue([]);

    const res = await request(app).get('/api/projects');

    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual([]);
  });

  it('should return a list of projects if they exist', async () => {
    const mockProjects = [{ name: 'Project1' }, { name: 'Project2' }];
    (projectManager.getProjectList as jest.Mock).mockReturnValue(mockProjects);

    const res = await request(app).get('/api/projects');

    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(mockProjects);
  });
});

describe('POST /api/projects', () => {
  it('should create a new book project successfully', async () => {
    const newProjectData = {
      name: 'NewBookProject',
      type: 'book',
      idea: {
        language: 'en-US',
        summary: 'A summary of the book.',
        prompt: 'Global prompt for the book.',
      },
    };
    const createdProject = { ...newProjectData, createdAt: new Date().toISOString() }; // Mock createdAt
    (projectManager.createProject as jest.Mock).mockReturnValue(createdProject);

    const res = await request(app)
      .post('/api/projects')
      .send(newProjectData);

    expect(res.statusCode).toEqual(201);
    expect(res.body).toEqual(createdProject);
    expect(projectManager.createProject).toHaveBeenCalledWith(newProjectData);
  });

  it('should create a new templated project successfully', async () => {
    const newProjectData = {
      name: 'NewTemplatedProject',
      type: 'templated',
      sources: ['path/to/source1.txt', 'path/to/source2.txt'],
      template: 'path/to/template.txt',
    };
    const createdProject = { ...newProjectData, createdAt: new Date().toISOString() }; // Mock createdAt
    (projectManager.createProject as jest.Mock).mockReturnValue(createdProject);

    const res = await request(app)
      .post('/api/projects')
      .send(newProjectData);

    expect(res.statusCode).toEqual(201);
    expect(res.body).toEqual(createdProject);
    expect(projectManager.createProject).toHaveBeenCalledWith(newProjectData);
  });

  it('should return 400 with validation errors if project data is invalid', async () => {
    const invalidProjectData = { name: 'InvalidProject', type: 'book' }; // Missing 'idea'
    // We don't need to mock createProject for validation errors, as validation happens before it's called.

    const res = await request(app)
      .post('/api/projects')
      .send(invalidProjectData);

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toEqual('Validation Error');
    expect(res.body.errors).toBeInstanceOf(Array);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });
});

describe('DELETE /api/projects/:name', () => {
  it('should delete a project successfully', async () => {
    const projectName = 'ProjectToDelete';
    (projectManager.deleteProject as jest.Mock).mockImplementation(() => {}); // Mock successful deletion

    const res = await request(app).delete(`/api/projects/${projectName}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Project '${projectName}' deleted successfully.` });
    expect(projectManager.deleteProject).toHaveBeenCalledWith(projectName);
  });

  it('should return 400 if project deletion fails', async () => {
    const projectName = 'NonExistentProject';
    const errorMessage = 'Project not found';
    (projectManager.deleteProject as jest.Mock).mockImplementation(() => {
      throw new Error(errorMessage);
    });

    const res = await request(app).delete(`/api/projects/${projectName}`);

    expect(res.statusCode).toEqual(400);
    expect(res.body).toEqual({ message: errorMessage });
  });
});

describe('GET /api/projects/:projectName', () => {
  it('should return project details successfully', async () => {
    const projectName = 'TestProject';
    const mockProjectDetails = { name: projectName, status: 'active' };
    (projectManager.getProjectDetails as jest.Mock).mockReturnValue(mockProjectDetails);

    const res = await request(app).get(`/api/projects/${projectName}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(mockProjectDetails);
    expect(projectManager.getProjectDetails).toHaveBeenCalledWith(projectName);
  });

  it('should return 404 if project details not found', async () => {
    const projectName = 'NonExistentProject';
    const errorMessage = 'Project not found';
    (projectManager.getProjectDetails as jest.Mock).mockImplementation(() => {
      throw new Error(errorMessage);
    });

    const res = await request(app).get(`/api/projects/${projectName}`);

    expect(res.statusCode).toEqual(404);
    expect(res.body).toEqual({ message: errorMessage });
  });
});

describe('GET /api/projects/:projectName/content', () => {
  it('should return project content successfully', async () => {
    const projectName = 'TestProject';
    const mockContent = '# My Project Content';
    (projectManager.getGeneratedProjectContent as jest.Mock).mockReturnValue(mockContent);

    const res = await request(app).get(`/api/projects/${projectName}/content`);

    expect(res.statusCode).toEqual(200);
    expect(res.text).toEqual(mockContent);
    expect(projectManager.getGeneratedProjectContent).toHaveBeenCalledWith(projectName);
  });

  it('should return 500 if fetching project content fails', async () => {
    const projectName = 'TestProject';
    const errorMessage = 'Error reading content';
    (projectManager.getGeneratedProjectContent as jest.Mock).mockImplementation(() => {
      throw new Error(errorMessage);
    });

    const res = await request(app).get(`/api/projects/${projectName}/content`);

    expect(res.statusCode).toEqual(500);
    expect(res.body).toEqual({ message: errorMessage });
  });
});

describe('PUT /api/projects/:projectName/content', () => {
  it('should save project content successfully', async () => {
    const projectName = 'TestProject';
    const newContent = '# Updated Project Content';
    (projectManager.saveGeneratedProjectContent as jest.Mock).mockImplementation(() => {});

    const res = await request(app)
      .put(`/api/projects/${projectName}/content`)
      .send({ content: newContent });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Content saved successfully.' });
    expect(projectManager.saveGeneratedProjectContent).toHaveBeenCalledWith(projectName, newContent);
  });

  it('should return 500 if saving project content fails', async () => {
    const projectName = 'TestProject';
    const newContent = '# Updated Project Content';
    const errorMessage = 'Error writing content';
    (projectManager.saveGeneratedProjectContent as jest.Mock).mockImplementation(() => {
      throw new Error(errorMessage);
    });

    const res = await request(app)
      .put(`/api/projects/${projectName}/content`)
      .send({ content: newContent });

    expect(res.statusCode).toEqual(500);
    expect(res.body).toEqual({ message: errorMessage });
  });
});

describe('POST /api/projects/:projectName/outline', () => {
  it('should generate outline successfully', async () => {
    const projectName = 'TestProject';
    const mockOutline = { title: 'New Outline', sections: [] };
    (projectManager.generateProjectOutline as jest.Mock).mockResolvedValue(mockOutline);

    const res = await request(app)
      .post(`/api/projects/${projectName}/outline`)
      .send({ overwrite: false });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Outline generated successfully.', outline: mockOutline });
    expect(projectManager.generateProjectOutline).toHaveBeenCalledWith(projectName, false);
  });

  it('should return 400 if outline generation fails', async () => {
    const projectName = 'TestProject';
    const errorMessage = 'Error generating outline';
    (projectManager.generateProjectOutline as jest.Mock).mockRejectedValue(new Error(errorMessage));

    const res = await request(app)
      .post(`/api/projects/${projectName}/outline`)
      .send({ overwrite: false });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toEqual({ message: errorMessage });
  });
});

describe('POST /api/projects/:projectName/outline/save', () => {
  it('should save outline successfully', async () => {
    const projectName = 'TestProject';
    const outlineToSave = { title: 'Saved Outline', sections: [] };
    (projectManager.saveProjectOutline as jest.Mock).mockResolvedValue(undefined);

    const res = await request(app)
      .post(`/api/projects/${projectName}/outline/save`)
      .send({ outline: outlineToSave });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Outline saved successfully.' });
    expect(projectManager.saveProjectOutline).toHaveBeenCalledWith(projectName, outlineToSave);
  });

  it('should return 400 if saving outline fails', async () => {
    const projectName = 'TestProject';
    const outlineToSave = { title: 'Saved Outline', sections: [] };
    const errorMessage = 'Error saving outline';
    (projectManager.saveProjectOutline as jest.Mock).mockRejectedValue(new Error(errorMessage));

    const res = await request(app)
      .post(`/api/projects/${projectName}/outline/save`)
      .send({ outline: outlineToSave });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toEqual({ message: errorMessage });
  });
});

describe('POST /api/projects/:projectName/generate-content', () => {
  it('should start content generation successfully', async () => {
    const projectName = 'TestProject';
    const mockResult = { status: 'started' };
    (projectManager.startContentGeneration as jest.Mock).mockResolvedValue(mockResult);

    const res = await request(app)
      .post(`/api/projects/${projectName}/generate-content`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Content generation started successfully.', result: mockResult });
    expect(projectManager.startContentGeneration).toHaveBeenCalledWith(projectName);
  });

  it('should return 400 if content generation fails', async () => {
    const projectName = 'TestProject';
    const errorMessage = 'Error starting generation';
    (projectManager.startContentGeneration as jest.Mock).mockRejectedValue(new Error(errorMessage));

    const res = await request(app)
      .post(`/api/projects/${projectName}/generate-content`);

    expect(res.statusCode).toEqual(400);
    expect(res.body).toEqual({ message: errorMessage });
  });
});

describe('POST /api/projects/:projectName/publish', () => {
  it('should publish project successfully', async () => {
    const projectName = 'TestProject';
    const publishOptions = { publishType: 'single-markdown' };
    const mockResult = { message: 'Published successfully' };
    (projectManager.publishProject as jest.Mock).mockResolvedValue(mockResult);

    const res = await request(app)
      .post(`/api/projects/${projectName}/publish`)
      .send(publishOptions);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(mockResult);
    expect(projectManager.publishProject).toHaveBeenCalledWith(projectName, publishOptions.publishType);
  });

  it('should return 400 if publishing fails', async () => {
    const projectName = 'TestProject';
    const publishOptions = { publishType: 'single-markdown' };
    const errorMessage = 'Error publishing project';
    (projectManager.publishProject as jest.Mock).mockRejectedValue(new Error(errorMessage));

    const res = await request(app)
      .post(`/api/projects/${projectName}/publish`)
      .send(publishOptions);

    expect(res.statusCode).toEqual(400);
    expect(res.body).toEqual({ message: errorMessage });
  });
});

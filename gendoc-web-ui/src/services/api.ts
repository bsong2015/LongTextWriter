import axios from 'axios';
import type { Project, ProjectIdea, BookOutline, PublishResult, ProjectDetail, ProjectStatus } from '../../../src/types.ts';

const apiClient = axios.create({
  baseURL: '/api', // The backend is served on the same host
  headers: {
    'Content-Type': 'application/json',
  },
});

// Project Management
export const getProjects = (): Promise<Project[]> => apiClient.get('/projects').then(res => res.data);
export const getProjectDetails = (projectName: string): Promise<ProjectDetail> => apiClient.get(`/projects/${projectName}`).then(res => res.data);
export const createProject = (projectData: Partial<Project>): Promise<Project> => apiClient.post('/projects', projectData).then(res => res.data);
export const deleteProject = (projectName: string): Promise<{ message: string }> => apiClient.delete(`/projects/${projectName}`).then(res => res.data);

// Outline Management
export const generateProjectOutline = (projectName: string, overwrite: boolean): Promise<{ message: string; outline: BookOutline }> => apiClient.post(`/projects/${projectName}/outline`, { overwrite }).then(res => res.data);
export const saveProjectOutline = (projectName: string, outline: BookOutline): Promise<{ message: string }> => apiClient.post(`/projects/${projectName}/outline/save`, { outline }).then(res => res.data);

// Content Management
export const getGeneratedProjectContent = (projectName: string): Promise<string> => apiClient.get(`/projects/${projectName}/content`).then(res => res.data);
export const saveGeneratedProjectContent = (projectName: string, content: string): Promise<{ message: string }> => apiClient.put(`/projects/${projectName}/content`, { content }).then(res => res.data);
export const startContentGeneration = (projectName: string): Promise<{ message: string; result: any }> => apiClient.post(`/projects/${projectName}/generate-content`).then(res => res.data);

// Publishing
export const publishProject = (projectName: string, publishType: 'single' | 'multiple'): Promise<PublishResult> => apiClient.post(`/projects/${projectName}/publish`, { publishType }).then(res => res.data);
export const downloadFile = (filePath: string): void => {
    window.location.href = `/api/download?filePath=${encodeURIComponent(filePath)}`;
};

// Internationalization (i18n)
export const getLocale = (lang: string): Promise<Record<string, string>> => apiClient.get(`/locales/${lang}`).then(res => res.data);

// File Upload
export const uploadFile = (file: File): Promise<{ filePath: string; fileName: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  return apiClient.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }).then(res => res.data);
};


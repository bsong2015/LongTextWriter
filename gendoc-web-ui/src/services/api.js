"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLocale = exports.downloadFile = exports.publishProject = exports.startContentGeneration = exports.saveGeneratedProjectContent = exports.getGeneratedProjectContent = exports.saveProjectOutline = exports.generateProjectOutline = exports.deleteProject = exports.createProject = exports.getProjectDetails = exports.getProjects = void 0;
const axios_1 = __importDefault(require("axios"));
const apiClient = axios_1.default.create({
    baseURL: '/api', // The backend is served on the same host
    headers: {
        'Content-Type': 'application/json',
    },
});
// Project Management
const getProjects = () => apiClient.get('/projects').then(res => res.data);
exports.getProjects = getProjects;
const getProjectDetails = (projectName) => apiClient.get(`/projects/${projectName}`).then(res => res.data);
exports.getProjectDetails = getProjectDetails;
const createProject = (projectData) => apiClient.post('/projects', projectData).then(res => res.data);
exports.createProject = createProject;
const deleteProject = (projectName) => apiClient.delete(`/projects/${projectName}`).then(res => res.data);
exports.deleteProject = deleteProject;
// Outline Management
const generateProjectOutline = (projectName, overwrite) => apiClient.post(`/projects/${projectName}/outline`, { overwrite }).then(res => res.data);
exports.generateProjectOutline = generateProjectOutline;
const saveProjectOutline = (projectName, outline) => apiClient.post(`/projects/${projectName}/outline/save`, { outline }).then(res => res.data);
exports.saveProjectOutline = saveProjectOutline;
// Content Management
const getGeneratedProjectContent = (projectName) => apiClient.get(`/projects/${projectName}/content`).then(res => res.data);
exports.getGeneratedProjectContent = getGeneratedProjectContent;
const saveGeneratedProjectContent = (projectName, content) => apiClient.put(`/projects/${projectName}/content`, { content }).then(res => res.data);
exports.saveGeneratedProjectContent = saveGeneratedProjectContent;
const startContentGeneration = (projectName) => apiClient.post(`/projects/${projectName}/generate-content`).then(res => res.data);
exports.startContentGeneration = startContentGeneration;
// Publishing
const publishProject = (projectName, publishType) => apiClient.post(`/projects/${projectName}/publish`, { publishType }).then(res => res.data);
exports.publishProject = publishProject;
const downloadFile = (filePath) => {
    window.location.href = `/api/download?filePath=${encodeURIComponent(filePath)}`;
};
exports.downloadFile = downloadFile;
// Internationalization (i18n)
const getLocale = (lang) => apiClient.get(`/locales/${lang}`).then(res => res.data);
exports.getLocale = getLocale;

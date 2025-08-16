# LongTextWriter CLI - Requirement Document (v1.0 - Current CLI)

## 1. Introduction
This document outlines the functional requirements for the current command-line interface (CLI) version of the LongTextWriter application. The application aims to assist users in managing, generating, and publishing long-form text content.

## 2. Core Features

### 2.1 Project/Document Management
*   **Create New (new):** Users can initialize new projects or documents.
    *   **Requirement:** Support creation of different document types or templates.
    *   **Requirement:** Allow specifying project/document name and initial configuration.
*   **List (ls):** Users can list existing projects or documents.
    *   **Requirement:** Display key information for each item (e.g., name, status, last modified date).
    *   **Requirement:** Support filtering or sorting of listed items.
*   **Remove (rm):** Users can delete existing projects or documents.
    *   **Requirement:** Implement confirmation prompt before deletion to prevent accidental data loss.
*   **Status (status):** Users can view the current status of a project or document.
    *   **Requirement:** Display information such as word count, completion progress, or associated files.

### 2.2 Content Generation & Outlining
*   **Outline Generation (outline):** Users can generate outlines for their content.
    *   **Requirement:** Support various outline structures (e.g., hierarchical, linear).
    *   **Requirement:** Allow users to provide input (e.g., topic, keywords) for outline generation.
*   **Run (run):** Users can execute specific processes related to content generation or manipulation.
    *   **Requirement:** Define configurable "run" commands for different content workflows.

### 2.3 Publishing
*   **Publish (publish):** Users can publish their completed content.
    *   **Requirement:** Support publishing to various output formats (e.g., Markdown, HTML, PDF).
    *   **Requirement:** Allow configuration of publishing destinations or platforms.

## 3. Internationalization (i18n)
*   **Multi-language Support:** The application supports multiple languages for its interface and messages.
    *   **Requirement:** Load language-specific strings from `locales` directory (e.g., `en.json`, `zh.json`).
    *   **Requirement:** Allow users to select or configure their preferred language.

## 4. Configuration
*   **Environment Variables:** The application supports configuration via environment variables.
    *   **Requirement:** Provide an `.env.example` file for easy setup.
    *   **Requirement:** Allow overriding default settings through environment variables.

## 5. Technical Requirements
*   **Platform:** Node.js / TypeScript CLI application.
*   **Dependencies:** Managed via `package.json` and `package-lock.json`.
*   **Code Structure:** Adhere to a modular structure with commands, core logic, and utilities separated.

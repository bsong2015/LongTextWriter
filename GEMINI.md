# Project Overview: GenDoc

GenDoc is a powerful and flexible command-line interface (CLI) tool and a local web-based application designed to automate the creation of long-form, structured documents using Large Language Models (LLMs). It supports various generation modes, including books, templated documents, and article series, streamlining the content creation process from idea to publication.

**Key Technologies:**
*   **Runtime:** Node.js
*   **Language:** TypeScript
*   **CLI Framework:** Commander.js
*   **LLM Integration:** LangChain.js
*   **Web Frontend:** Vue.js (with Vite)
*   **Web Backend:** Node.js/Express (reusing core logic)

**Core Features:**
*   **Multiple Generation Modes:** Generate complete books, fill predefined Markdown templates, or create article series.
*   **Interactive Setup:** Guided project creation via `gendoc new` (CLI) or through the web UI.
*   **AI-Powered Outlining:** Automatically generate detailed outlines for books or series via CLI or web UI.
*   **Resumable Generation:** Pause and resume content generation at any time via CLI or web UI.
*   **Flexible Publishing:** Publish content as single consolidated Markdown files or as separate files via CLI or web UI.
*   **Structured Workspace:** Organizes all projects and assets within a `gendoc-workspace` directory.
*   **Web-based User Interface:** Provides an intuitive and visually rich experience for managing, generating, and publishing content, mirroring and enhancing CLI functionalities.

# Building and Running

This project is a Node.js application written in TypeScript, with a Vue.js frontend for the web UI.

**Prerequisites:**
*   Node.js (v18 or higher recommended)
*   An OpenAI API Key (to be set in a `.env` file)

**Installation:**
1.  Clone the repository.
2.  Install dependencies for the main project:
    ```bash
    npm install
    ```
3.  Install dependencies for the web UI:
    ```bash
    cd gendoc-web-ui
    npm install
    cd ..
    ```

**Building:**
Compile the TypeScript code into JavaScript for the CLI and build the web UI:
```bash
npm run build
npm run build --workspace=gendoc-web-ui
```

**Running the Tool:**
To start the CLI tool, you can use the `start` script which builds and then runs the main entry point:
```bash
npm run start
```
Alternatively, you can directly execute the compiled JavaScript:
```bash
node dist/index.js <command> [args]
```

To start the web UI (which also runs the backend server):
```bash
npm run dev --workspace=gendoc-web-ui
```

**Development:**
For CLI development, you can run the tool directly using `ts-node` without prior compilation:
```bash
npm run dev
```
For web UI development, use the following:
```bash
npm run dev --workspace=gendoc-web-ui
```

**Key CLI Commands:**
Once built or run in development mode, the `gendoc` CLI provides the following commands:
*   `gendoc new`: Interactively create a new generation project.
*   `gendoc ls`: List all projects in your `gendoc-workspace`.
*   `gendoc status <project_name>`: Display progress for a specific project.
*   `gendoc outline <project_name>`: Generate a detailed outline using AI (for book/series types).
*   `gendoc run <project_name>`: Start the AI content generation process (resumable).
*   `gendoc publish <project_name>`: Compile generated content into final Markdown documents.
*   `gendoc rm <project_name>`: Delete a project and its associated files.

# Web UI Features

The web-based user interface provides a comprehensive set of features for managing and interacting with GenDoc projects:

*   **Project/Document Management:**
    *   Dashboard displaying all projects with key information (name, status, last modified, word count).
    *   Search, filter, and sort capabilities for projects.
    *   Intuitive UI for creating new projects/documents with form-based input.
    *   Easy access to project actions (edit, delete, view status) via UI elements.
    *   Visual representation of project status (e.g., progress bars, icons).
*   **Content Editing & Generation:**
    *   Dedicated UI for generating and managing outlines with interactive editing (drag-and-drop, add/remove sections).
    *   Visual feedback during outline generation.
    *   UI elements to trigger and monitor content generation processes, including forms for configuring `run` commands and display of progress/output logs.
*   **Publishing:**
    *   Dedicated section for configuring and initiating publishing.
    *   Options for output formats (Markdown, HTML, PDF) and configuration forms for publishing destinations.
    *   Visual feedback on publishing status and option to download generated files.
*   **Internationalization (i18n):**
    *   Language selector for switching UI languages. All UI text and messages are localized.
*   **Configuration:**
    *   Web-based settings panel for managing application configurations, including editing environment variables and secure handling of sensitive information (e.g., API keys).

# Development Conventions

*   **Language:** The project is primarily developed in TypeScript.
*   **CLI Structure:** Commands are organized within the `src/commands` directory.
*   **Core Logic:** Core functionalities and utilities are located in the `src/core` directory, reused by both CLI and web backend.
*   **Web UI Structure:** The web frontend is located in the `gendoc-web-ui` directory.
*   **Project Data:** All generated projects and their assets are managed within the `gendoc-workspace` directory at the project root.
*   **Configuration:** Project-specific configurations and outlines are stored in `project.json` files within each project's directory inside `gendoc-workspace`.
*   **Environment Variables:** API keys and other sensitive configurations are expected to be provided via a `.env` file.
# Project Overview: GenDoc

GenDoc is a powerful and flexible command-line interface (CLI) tool and a local web-based application designed to automate the creation of long-form, structured documents using Large Language Models (LLMs). It supports various generation modes, including books, templated documents, and article series, streamlining the content creation process from idea to publication.

This project is structured as a monorepo using npm workspaces, containing the following packages:
*   `packages/cli`: The command-line interface, built with Commander.js. It also includes an Express backend to serve the web UI.
*   `packages/web-ui`: The Vue.js frontend application.
*   `packages/shared`: Shared types, configurations, and utilities used by both the CLI and web UI.

**Key Technologies:**
*   **Runtime:** Node.js
*   **Language:** TypeScript
*   **Monorepo Management:** npm Workspaces
*   **CLI Framework:** Commander.js
*   **Web Backend:** Node.js/Express
*   **Web Frontend:** Vue.js (with Vite)
*   **LLM Integration:** LangChain.js

**Core Features:**
*   **Multiple Generation Modes:** Generate complete books, fill predefined Markdown templates, or create article series.
*   **Interactive Setup:** Guided project creation via `gendoc new` (CLI) or through the web UI.
*   **AI-Powered Outlining:** Automatically generate detailed outlines for books or series via CLI or web UI.
*   **Resumable Generation:** Pause and resume content generation at any time via CLI or web UI.
*   **Flexible Publishing:** Publish content as single consolidated Markdown files or as separate files via CLI or web UI.
*   **Structured Workspace:** Organizes all projects and assets within a `gendoc-workspace` directory at the project root.
*   **Web-based User Interface:** Provides an intuitive and visually rich experience for managing, generating, and publishing content.

# Building and Running

This project is a TypeScript monorepo.

**Prerequisites:**
*   Node.js (v20 or higher recommended, see `packages/web-ui/package.json` for specific engine requirements)
*   An OpenAI API Key (to be set in a `.env` file at the project root)

**Installation:**
1.  Clone the repository.
2.  Install all dependencies for all workspaces from the root directory:
    ```bash
    npm install
    ```

**Building:**
Build all packages from the root directory:
```bash
npm run build
```
This command will build `shared`, `cli`, and `web-ui` packages in the correct order.

**Running the Application:**

**CLI Only:**
To run the CLI tool directly, you can use the `dev` script within the `cli` workspace:
```bash
npm run dev --workspace=@gendoc/cli -- <command> [args]
```
Example:
```bash
npm run dev --workspace=@gendoc/cli -- ls
```

**Web UI and Backend:**
To run the web UI and the backend server simultaneously for a complete experience, use the `dev` script from the root:
```bash
npm run dev
```
This starts the Express server from the `cli` package and the Vite dev server for the `web-ui` package. You can then access the web interface in your browser (typically at `http://localhost:5173`). The `npm run start:web` command also works as an alternative.

**Key CLI Commands:**
*   `gendoc new`: Interactively create a new generation project.
*   `gendoc ls`: List all projects in your `gendoc-workspace`.
*   `gendoc status <project_name>`: Display progress for a specific project.
*   `gendoc outline <project_name>`: Generate a detailed outline using AI (for book/series types).
*   `gendoc run <project_name>`: Start the AI content generation process (resumable).
*   `gendoc publish <project_name>`: Compile generated content into final Markdown documents.
*   `gendoc rm <project_name>`: Delete a project and its associated files.

# Development Conventions

*   **Language:** The project is primarily developed in TypeScript.
*   **Monorepo Structure:**
    *   `packages/cli`: Contains the CLI application logic (`src/commands`) and the Express server (`src/server.ts`).
    *   `packages/web-ui`: Contains the Vue.js frontend application (`src`).
    *   `packages/shared`: Contains shared code (`src`) intended for use in other packages.
*   **Project Data:** All generated projects and their assets are managed within the `gendoc-workspace` directory at the project root.
*   **Configuration:** Project-specific configurations and outlines are stored in `project.json` files within each project's directory inside `gendoc-workspace`.
*   **Environment Variables:** API keys and other sensitive configurations are expected to be provided via a `.env` file at the root of the monorepo.

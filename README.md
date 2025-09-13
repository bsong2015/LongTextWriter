English | [简体中文](./README.zh-CN.md)

# GenDoc - AI Long Document Generator

GenDoc is a powerful and flexible command-line tool and local web application that leverages Large Language Models (LLMs) to automate the creation of long-form, structured documents. Whether you're writing a book, generating technical documentation from a template, or creating a series of articles, GenDoc streamlines the process from idea to final publication.

## Quick Start

### Prerequisites

*   Node.js (v22 or higher recommended)
*   An OpenAI API Key

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd <repository-folder>
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Set up your environment:**
    Create a `.env` file in the project root by copying the example and add your OpenAI API key:
    ```bash
    cp .env.example .env
    ```
    Open `.env` and add:
    ```
    OPENAI_API_KEY="sk-YOUR_OPENAI_API_KEY"
    ```

### Running the Application

**Development Mode (Web UI & Backend):**

To run the entire application with hot-reloading:

```bash
npm run dev
```

The web UI will be available at `http://localhost:5173`.

**Production Mode (Web UI & Backend):**

To run the application for production use:

```bash
npm run start:web
```

Open your browser and navigate to `http://localhost:3000`.

## Core CLI Commands

GenDoc provides a powerful command-line interface:

*   `gendoc new`: Starts an interactive session to create a new project.
*   `gendoc ls`: Lists all projects in your `gendoc-workspace`.
*   `gendoc status <project_name>`: Displays a detailed progress report for a project.
*   `gendoc outline <project_name>`: Generates a detailed outline using AI.
*   `gendoc run <project_name>`: Starts the AI content generation process.
*   `gendoc publish <project_name>`: Compiles generated content into final Markdown documents.
*   `gendoc rm <project_name>`: Deletes a project.

## Documentation

For more detailed information on installation, configuration, advanced usage, development, testing, and more, please refer to our comprehensive documentation:

*   [**Installation & Configuration**](docs/en/installation-and-configuration.md)
*   [**Development Setup**](docs/en/development-setup.md)
*   [**Building & Packaging**](docs/en/build-and-package.md)
*   [**Usage Guide (Web UI & CLI)**](docs/en/usage.md)
*   [**Testing**](docs/en/testing.md)
*   [**Project Structure & Workspace**](docs/en/index.md)
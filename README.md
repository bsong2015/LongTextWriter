# GenDoc - AI Long Document Generator

GenDoc is a powerful and flexible command-line tool and local web application that leverages Large Language Models (LLMs) to automate the creation of long-form, structured documents. Whether you're writing a book, generating technical documentation from a template, or creating a series of articles, GenDoc streamlines the process from idea to final publication.

## Project Structure

This project is a monorepo managed by npm workspaces. It is divided into the following packages:

-   `packages/cli`: Contains the command-line interface (CLI) tool, built with Commander.js, and the backend server (Express.js) that powers the web UI.
-   `packages/web-ui`: The Vue.js frontend application that provides a user-friendly interface for managing GenDoc projects.
-   `packages/shared`: Contains shared code, primarily TypeScript types and Zod schemas, used by both the `cli` and `web-ui` packages.

## Features

-   **Web User Interface (UI)**: A local web-based interface for intuitive project management, content editing, and AI interactions.
-   **Multiple Generation Modes**:
    -   **Book**: Generate a complete book with chapters and articles from a single idea.
    -   **Templated Document**: Fill a predefined Markdown template with content from source documents, ideal for reports and technical specs.
    -   **Article Series**: Create a full series of articles from a central theme, complete with a generated outline.
-   **Interactive Setup**: An interactive `gendoc new` command guides you through project creation.
-   **AI-Powered Outlining**: Automatically generate a detailed outline for your book or series.
-   **Resumable Generation**: Stop and resume the content generation process at any time. Your progress is always saved.
-   **Flexible Publishing**: Publish a book or series as a single consolidated Markdown file or as separate files for each article.
-   **Structured Workspace**: All projects and their assets are neatly organized in a `gendoc-workspace` directory.

## Prerequisites

-   Node.js (v18 or higher recommended)
-   An OpenAI API Key

## Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd <repository-folder>
    ```

2.  **Install dependencies:**
    This single command installs dependencies for all packages (`cli`, `web-ui`, `shared`) in the monorepo.
    ```bash
    npm install
    ```

3.  **Set up your environment and language:**
    -   Create a `.env` file in the project root by copying the example:
        ```bash
        cp .env.example .env
        ```
    -   Open the newly created `.env` file and add your OpenAI API key and other optional settings:
        ```
        # Your secret API key
        OPENAI_API_KEY="sk-YOUR_OPENAI_API_KEY"

        # Optional: Specify a model name
        OPENAI_MODEL="gpt-4o"

        # Optional: Provide a custom base URL for OpenAI-compatible APIs (e.g., local LLMs)
        OPENAI_API_BASE="http://localhost:11434/v1"
        ```

    -   **Proxy Configuration:**
        If you are in a network environment that requires a proxy to access the internet, you can configure it using the `HTTPS_PROXY` environment variable. The application will automatically detect and use this setting when making requests to the OpenAI API. You can set this variable directly in your `.env` file:
        ```
        # Optional: Configure a proxy server
        HTTPS_PROXY="http://your-proxy-server-address:port"

        # Example with authentication
        # HTTPS_PROXY="http://user:password@your-proxy-server-address:port"
        ```

    -   **Language Configuration:**
        GenDoc supports multiple languages for its interface. The default language is English. You can change the language by setting the `GENDOC_LANG` environment variable.
        *   **To use English (default):** `export GENDOC_LANG=en`
        *   **To use Chinese:** `export GENDOC_LANG=zh`
        **Note for Windows users:** Use `set GENDOC_LANG=en` or `set GENDOC_LANG=zh` in Command Prompt, or `$env:GENDOC_LANG="en"` in PowerShell.

## Development

To run the entire application (backend server and frontend UI) in development mode with hot-reloading, use the following command from the project root:

```bash
npm run dev
```

This will concurrently start:
-   The backend server for the web UI.
-   The Vite development server for the Vue.js frontend.

The web UI will be available at `http://localhost:5173` (or another port if 5173 is busy).

## Building the Project

To build all packages for production, run the following command from the project root:

```bash
npm run build
```

This command builds all workspaces in the correct order (`shared` -> `web-ui` -> `cli`). The process includes compiling all TypeScript to JavaScript and copying the built frontend application into the `cli` package so it's ready to be served.

## Packaging for Distribution

To bundle the entire application (CLI and Web UI) into a single distributable file, you can use the `package` script. This is ideal for sharing the application with colleagues or for deploying it.

1.  **Create the package:**
    Run the following command from the project root:
    ```bash
    npm run package
    ```

2.  **Find the output:**
    This command will create a `.tgz` file (e.g., `gendoc-cli-1.0.0.tgz`) inside the `packages/cli` directory.

3.  **Install and run:**
    Anyone can install the application from that file by running:
    ```bash
    # Example path, use the actual path to the .tgz file
    npm install -g ./packages/cli/gendoc-cli-1.0.0.tgz
    ```
    After installation, the `gendoc` command will be available globally in their terminal.

## Usage

### Web UI

The primary way to use GenDoc is through the web interface. To start the application for production use, run:

```bash
npm run start:web
```

This starts the backend server and serves the production-built frontend. Open your browser and navigate to `http://localhost:3000`.

### Command-Line Interface (CLI)

You can also use the CLI directly for all operations.

After building the project with `npm run build`, you can run CLI commands using the compiled output:

```bash
node packages/cli/dist/index.js <command> [args]
```

For development, you can run commands without building first using `ts-node`:
```bash
npm run dev --workspace=@gendoc/cli -- <command> [args]
```
Example:
```bash
npm run dev --workspace=@gendoc/cli -- ls
```

#### **Core Commands**

-   `gendoc new`: Starts an interactive session to create a new project.
-   `gendoc ls`: Lists all projects in your `gendoc-workspace`.
-   `gendoc status <project_name>`: Displays a detailed progress report for a project.
-   `gendoc outline <project_name>`: Generates a detailed outline using AI.
-   `gendoc run <project_name>`: Starts the AI content generation process.
-   `gendoc publish <project_name>`: Compiles generated content into final Markdown documents.
-   `gendoc rm <project_name>`: Deletes a project.

## Testing with Mock LLM

For faster development and testing without incurring API costs, you can enable a mock LLM mode. This mode bypasses actual API calls and returns dummy responses.

To enable it, set the `MOCK_LLM` environment variable to `true` before running any command.

-   **Linux/macOS:** `export MOCK_LLM=true`
-   **Windows (CMD):** `set MOCK_LLM=true`
-   **Windows (PowerShell):** `$env:MOCK_LLM="true"`

## End-to-End Testing

The project includes an E2E test suite in the `e2e-tests` directory.

### How to Run the E2E Test

1.  **Start the GenDoc Server**:
    In the project root, start the web server:
    ```bash
    # Make sure your .env file is configured
    npm run start:web
    ```
    Keep the server running in a separate terminal.

2.  **Install E2E Test Dependencies**:
    ```bash
    cd e2e-tests
    npm install
    ```

3.  **Run the Test Script**:
    While in the `e2e-tests` directory:
    ```bash
    npx ts-node test_workflow.ts
    ```

## Workspace Directory

All your projects are stored in the `gendoc-workspace` directory, which is created automatically in your project root. The structure remains the same as before the refactor.

```
gendoc-workspace/
└── projects/
    ├── my-first-book/
    │   ├── project.json
    │   ├── generated.json
    │   └── output/
    └── my-design-spec/
        ├── project.json
        ├── sources/
        ├── templates/
        └── output/
```

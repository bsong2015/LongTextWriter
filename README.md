# GenDoc - AI Long Document Generator

GenDoc is a powerful and flexible command-line tool that leverages Large Language Models (LLMs) to automate the creation of long-form, structured documents. Whether you're writing a book, generating technical documentation from a template, or creating a series of articles, GenDoc streamlines the process from idea to final publication.

## Features

- **Web User Interface (UI)**: A local web-based interface for intuitive project management, content editing, and AI interactions.
- **Multiple Generation Modes**: 
  - **Book**: Generate a complete book with chapters and articles from a single idea.
  - **Templated Document**: Fill a predefined Markdown template with content from source documents, ideal for reports and technical specs.
  - **Article Series**: Create a full series of articles from a central theme, complete with a generated outline.
- **Interactive Setup**: An interactive `gendoc new` command guides you through project creation.
- **AI-Powered Outlining**: Automatically generate a detailed outline for your book or series.
- **Resumable Generation**: Stop and resume the content generation process at any time. Your progress is always saved.
- **Flexible Publishing**: Publish a book or series as a single consolidated Markdown file or as separate files for each article.
- **Structured Workspace**: All projects and their assets are neatly organized in a `gendoc-workspace` directory.

## Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **CLI Framework**: Commander.js
- **Interactive Prompts**: @inquirer/prompts
- **LLM Integration**: LangChain.js
- **Data Validation**: Zod

## Prerequisites

- Node.js (v18 or higher recommended)
- An OpenAI API Key

## Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <your-repository-url>
   cd <repository-folder>
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up your environment and language:**
   - Create a `.env` file by copying the provided example:
     ```bash
     cp .env.example .env
     ```
   - Open the newly created `.env` file and add your OpenAI API key and other optional settings:
     ```
     # Your secret API key
     OPENAI_API_KEY="sk-YOUR_OPENAI_API_KEY"

     # Optional: Specify a model name
     OPENAI_MODEL="gpt-4o"

     # Optional: Provide a custom base URL for OpenAI-compatible APIs (e.g., local LLMs)
     OPENAI_API_BASE="http://localhost:11434/v1"
     ```
   - **Language Configuration:**
     GenDoc supports multiple languages for its command-line interface. The default language is English. You can change the language by setting the `GENDOC_LANG` environment variable.
     *   **To use English (default):**
         ```bash
         export GENDOC_LANG=en
         # Or simply do not set GENDOC_LANG
         ```
     *   **To use Chinese:**
         ```bash
         export GENDOC_LANG=zh
         ```
     **Note for Windows users:** Use `set GENDOC_LANG=en` or `set GENDOC_LANG=zh` in Command Prompt, or `$env:GENDOC_LANG="en"` or `$env:GENDOC_LANG="zh"` in PowerShell.

4. **Build the project:**
   ```bash
   npm run build
   ```
   This compiles the TypeScript code into JavaScript and makes the `gendoc` command available.

## Testing with Mock LLM

For faster development and testing, especially when working on features that interact with Large Language Models (LLMs), you can enable a mock LLM mode. This mode bypasses actual API calls to OpenAI and returns predefined dummy responses, saving time and API costs.

### How to Use Mock LLM

To enable mock LLM, set the `MOCK_LLM` environment variable to `true` before running any `gendoc` command or starting the web UI.

*   **For Linux/macOS (Bash/Zsh):**
    ```bash
    export MOCK_LLM=true
    # Then run your command, e.g., npm run start:web or node dist/index.js outline my-project
    ```
*   **For Windows (Command Prompt):**
    ```cmd
    set MOCK_LLM=true
    rem Then run your command, e.g., npm run start:web or node dist/index.js outline my-project
    ```
*   **For Windows (PowerShell):**
    ```powershell
    $env:MOCK_LLM="true"
    # Then run your command, e.g., npm run start:web or node dist/index.js outline my-project
    ```

**To disable Mock LLM** (and use the real OpenAI API, ensuring your `OPENAI_API_KEY` is set):

*   **For Linux/macOS (Bash/Zsh):**
    ```bash
    unset MOCK_LLM
    ```
*   **For Windows (Command Prompt):**
    ```cmd
    set MOCK_LLM=
    ```
*   **For Windows (PowerShell):**
    ```powershell
    Remove-Item Env:MOCK_LLM
    ```

When Mock LLM is enabled, you will see "MOCK LLM: Returning dummy response." messages in your console, and AI-generated content will be replaced with mock data.

## Usage

The main entry point for the tool is the `gendoc` command, which you can run using `node dist/index.js`.

```bash
# It's recommended to create a global alias for convenience
# For Linux/macOS (in .bashrc or .zshrc):
# alias gendoc="node /path/to/your/project/dist/index.js"

# For Windows (in a PowerShell profile):
# function gendoc { node C:\path\to\your\project\dist\index.js $args }
```

### Core Commands

- **`gendoc new`**
  Starts an interactive session to create a new generation project. You will be prompted to choose a project type (`book`, `templated`, `series`) and provide the necessary details.

- **`gendoc ls`**
  Lists all projects currently in your `gendoc-workspace`, showing their type, status, and creation date.

- **`gendoc status <project_name>`**
  Displays a detailed progress report for a specific project, including which articles have been generated, are pending, or have failed.

- **`gendoc outline <project_name>`**
  *(For `book` and `series` types only)*
  Contacts the AI to generate a detailed chapter and article outline based on the project's idea.

- **`gendoc run <project_name>`**
  Starts the core AI content generation process. This command is resumable. If it stops, you can run it again to continue where you left off.

- **`gendoc publish <project_name>`**
  Compiles the generated content into final, readable Markdown documents in the project's `output` folder.

- **`gendoc rm <project_name>`**
  Deletes a project and all its associated files after a confirmation prompt.

### Example Workflow: Creating a Book

1. **Start a new project:**
   ```bash
   node dist/index.js new
   ```
   - Select `Book`.
   - Enter a project name (e.g., `my-mars-book`).
   - Provide the core idea, language, and any global prompts for the AI.

2. **Generate the outline:**
   ```bash
   node dist/index.js outline my-mars-book
   ```
   Wait for the AI to create the book's structure. You can manually edit the `project.json` file to adjust the outline if needed.

3. **Generate the content:**
   ```bash
   node dist/index.js run my-mars-book
   ```
   The tool will now write each article one by one. This may take a significant amount of time. You can monitor the progress with the `status` command.

4. **Publish the book:**
   ```bash
   node dist/index.js publish my-mars-book
   ```
   Your final, compiled book will be available at `gendoc-workspace/projects/my-mars-book/output/my-mars-book.md`.

## Web User Interface (UI)

GenDoc also provides a local web-based user interface for a more intuitive and visual experience.

### Starting the Web UI

To start the web server, run:

```bash
npm run start:web
```

Once the server is running, open your web browser and navigate to `http://localhost:3000`.

### Web UI Features

The Web UI offers:

-   **Dashboard:** A visual overview of all your projects, their status, and quick actions.
-   **Project Management:** Create, view details, edit, and delete projects through an intuitive interface.
-   **Content Editing:** An integrated Markdown editor for direct content creation and modification.
-   **AI Interactions:** Trigger outline generation, content generation, and publishing directly from the browser.
-   **Internationalization:** Switch between supported languages within the UI.

## End-to-End Testing

The project includes an end-to-end (E2E) test suite that simulates a full user workflow by making API calls to the server. This test is located in the `e2e-tests` directory and provides a comprehensive way to verify the core functionalities of the application.

### Test Workflow

The E2E test script (`test_workflow.ts`) performs the following actions:

1.  **Create Project**: Creates a new project.
2.  **List Projects**: Verifies the new project is listed.
3.  **Generate & Modify Outline**: Generates, modifies, and saves a project outline.
4.  **Generate & Modify Content**: Runs content generation, then modifies and saves the result.
5.  **Publish & Download**: Publishes the content and verifies the download.
6.  **Delete Project**: Cleans up by deleting the project.
7.  **Verify Deletion**: Confirms the project is no longer listed.

### How to Run the E2E Test

To run the E2E test, follow these steps:

1.  **Start the GenDoc Server**:
    In the project root directory, start the web server:
    ```bash
    # Make sure to set your .env file with the necessary API keys first
    npm run start:web
    ```
    Keep the server running in a separate terminal.

2.  **Install E2E Test Dependencies**:
    Navigate to the `e2e-tests` directory and install its dependencies:
    ```bash
    cd e2e-tests
    npm install
    ```

3.  **Run the Test Script**:
    While still in the `e2e-tests` directory, execute the test script using `npx`:
    ```bash
    npx ts-node test_workflow.ts
    ```
    Using `npx` ensures that the locally installed version of `ts-node` is used to run the script. The script will print its progress to the console, showing each step of the workflow.

## Workspace Directory

All your projects are stored in the `gendoc-workspace` directory, which is created automatically in your project root.

```
gendoc-workspace/
└── projects/
    ├── my-first-book/
    │   ├── project.json      # Core project configuration and outline
    │   ├── generated.json    # Intermediate content generated by the AI
    │   └── output/
    │       └── my-first-book.md
    └── my-design-spec/
        ├── project.json
        ├── sources/          # Your source files for templated docs
        │   └── requirement.md
        ├── templates/        # Your template files
        │   └── design_template.md
        └── output/
            └── design_spec_v1.md
```
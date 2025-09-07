# Development Setup Guide

This guide is for developers who wish to contribute to GenDoc or run it locally for advanced development. If you just want to use the application, please see the **Installation & Configuration** and **Usage Guide**.

## 1. Initial Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd <repository-folder>
    ```

2.  **Install dependencies:**
    This project uses npm workspaces. The following command will install dependencies for all packages (`cli`, `web-ui`, `shared`):
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    You need an OpenAI API key for development. Create your local `.env` file by copying the template:
    ```bash
    cp .env.example .env
    ```
    Then, edit the `.env` file and add your API key.

## 2. Running in Development Mode

*   **Running the Web UI (Frontend + Backend):**
    To run the backend server and the Vite frontend with hot-reloading, use:
    ```bash
    npm run dev
    ```
    You can access the web interface at `http://localhost:5173`.

*   **Running CLI Commands:**
    To test CLI commands during development, you can use the `dev` script, which runs the TypeScript source code directly via `ts-node`.
    ```bash
    # Syntax: npm run dev --workspace=@gendoc/cli -- <command> [args]

    # Example: List all projects
    npm run dev --workspace=@gendoc/cli -- ls

    # Example: Create a new project interactively
    npm run dev --workspace=@gendoc/cli -- new
    ```

## 3. Next Steps

-   For instructions on how to build and package the application, please see **`build-and-package.md`**.
-   For a guide on how to run the test suite, please refer to **`testing.md`**.
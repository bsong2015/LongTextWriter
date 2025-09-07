# Installation & Configuration

This guide will walk you through setting up GenDoc on your local machine.

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

### Proxy Configuration

If you are in a network environment that requires a proxy to access the internet, you can configure it using the `HTTPS_PROXY` environment variable. The application will automatically detect and use this setting when making requests to the OpenAI API. You can set this variable directly in your `.env` file:

```
# Optional: Configure a proxy server
HTTPS_PROXY="http://your-proxy-server-address:port"

# Example with authentication
# HTTPS_PROXY="http://user:password@your-proxy-server-address:port"
```

### Language Configuration

GenDoc supports multiple languages for its interface. The default language is English. You can change the language by setting the `GENDOC_LANG` environment variable.
*   **To use English (default):** `export GENDOC_LANG=en`
*   **To use Chinese:** `export GENDOC_LANG=zh`

**Note for Windows users:** Use `set GENDOC_LANG=en` or `set GENDOC_LANG=zh` in Command Prompt, or `$env:GENDOC_LANG="en"` in PowerShell.

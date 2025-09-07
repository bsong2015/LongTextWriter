# Installation & Configuration

This guide provides comprehensive instructions for setting up GenDoc. Please read the following sections to choose the best installation method for you.

## Choosing Your Installation Method

There are two primary ways to install GenDoc:

-   **From an npm Package (Recommended):** This method is for most users who want to quickly start using the application. It's the simplest and cleanest way to get started.
-   **From Source Code:** This method is for developers, contributors, or users who want to access the very latest (and potentially unstable) features.

## Prerequisites

Before you begin, ensure you have the following installed:

-   **Node.js**: v22 or higher is recommended. You can download it from the [official Node.js website](https://nodejs.org/).
-   **OpenAI API Key**: Required to use the AI generation features.
-   **Git**: Required only if you choose to install from source code.

## Installation

Follow the instructions for your chosen method.

### Method 1: Installation from a Package File

Since this package is not published on the public npm registry, you must install it from the package file (`.tgz`) provided with each release on GitHub.

1.  Navigate to the project's **GitHub Releases** page.
2.  Download the `.tgz` package file from the latest release (e.g., `gendoc-cli-v1.x.x.tgz`).
3.  Open your terminal, navigate to the directory where you downloaded the file, and run the following command (replace the filename with the one you downloaded):
    ```bash
    npm install -g ./gendoc-cli-v1.x.x.tgz
    ```

**Verify Installation**
After installation, you can verify that the `gendoc` command is available by running:
```bash
gendoc --version
```

### Method 2: From Source Code

This method is for developers who wish to contribute code or run a local development version. For a complete guide on how to set up your local environment, please see our **[Development Setup Guide](./development-setup.md)**.


## Configuration

GenDoc offers several ways to configure settings. It's important to understand their priority.

### Configuration Priority

Settings are applied in the following order of precedence (higher items override lower ones):

1.  **Environment Variables** (e.g., `OPENAI_API_KEY`)
2.  **Global CLI Config** (managed by the `gendoc config` command)
3.  **.env File** (primarily for development when installing from source)

### Recommended Method: `gendoc config`

For users who installed via npm package, this is the recommended way to manage your settings.

Use the `gendoc config set` command with dot notation to apply a setting.

**1. Set your API Key (Required)**
```bash
gendoc config set llm.apiKey sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
(Replace `sk-xxxxxxxx...` with your actual API key.)

**2. View All Available Keys**
Here are all the available configuration keys:

| Key | Description | Default Value |
| :--- | :--- | :--- |
| `llm.apiKey` | Your OpenAI API key. | `null` |
| `llm.model` | The LLM model name to use. | `'gpt-4o'` |
| `llm.baseUrl` | A custom base URL for OpenAI-compatible APIs (e.g., local LLMs). | `null` |
| `llm.proxy` | A proxy server URL for network access. | `null` |
| `app.language` | The application's interface language. Can be `en` or `zh`. | `'en'` |
| `app.mock` | Enable mock LLM responses for testing. Can be `true` or `false`. | `false` |

**3. Manage and Verify Your Configuration**
```bash
# Set the language to Chinese
gendoc config set app.language zh

# Check a single value
gendoc config get app.language

# List all currently set values
gendoc config list
```

### Alternative Methods

**Environment Variables**
You can set environment variables to override any other settings. This is useful for CI/CD environments or for proxy settings.

-   `OPENAI_API_KEY`: Sets the API key.
-   `OPENAI_MODEL`: Sets the model name.
-   `OPENAI_API_BASE`: Sets the API base URL.
-   `HTTPS_PROXY`: Sets the proxy URL.
-   `GENDOC_LANG`: Sets the application language (`en` or `zh`).

**`.env` File**
When you install from source, you can create a `.env` file in the project root. This method is primarily intended for development.

1.  Copy the example file:
    ```bash
    cp .env.example .env
    ```
2.  Edit the `.env` file with your settings:
    ```env
    OPENAI_API_KEY="sk-YOUR_OPENAI_API_KEY"
    HTTPS_PROXY="http://your-proxy-server-address:port"
    ```
# Usage Guide

This guide explains how to use the GenDoc command-line interface (CLI). For installation and configuration instructions, please see the **Installation & Configuration** guide.

## Starting the Web UI

To launch the integrated web user interface, simply run the `web` command. This will start a local server, and you can access the application in your web browser.

```bash
gendoc web
```

The accessible URL (usually `http://localhost:3000`) will be displayed in your terminal.

## CLI Command Reference

Below is a detailed reference for all available CLI commands.

### `gendoc new`

Creates a new document generation project.

**Interactive Mode**
Running `gendoc new` without arguments starts an interactive session that will guide you through the project setup process.

```bash
gendoc new
```

**Parameter Mode**
You can also provide all project details via command-line options for automation.

```bash
# Example: Create a new book project named "My Sci-Fi Novel"
gendoc new book --name "My Sci-Fi Novel" --lang "en" --summary "A story about a lone explorer on a distant planet."
```

**Options**
-   `[type]`: The type of project. Can be `book`, `series`, or `templated`.
-   `-n, --name <name>`: The name of the project.
-   `-l, --lang <language>`: The language of the project idea (e.g., `en`, `zh`).
-   `-s, --summary <summary>`: A brief summary of the project idea.
-   `-p, --prompt <prompt>`: A global prompt or instruction to guide the entire generation process.
-   `--sources <sources...>`: For `templated` projects, one or more source files.
-   `--template <template>`: For `templated` projects, the path to the template file.

---

### `gendoc ls`

Lists all projects currently in your workspace.

```bash
gendoc ls
```

---

### `gendoc status <project_name>`

Displays the generation status, progress, and details for a specific project.

```bash
gendoc status "My Sci-Fi Novel"
```

---

### `gendoc outline <project_name>`

Automatically generates a detailed outline for a `book` or `series` project using the AI.

```bash
gendoc outline "My Sci-Fi Novel"
```

---

### `gendoc run <project_name>`

Starts or resumes the content generation process for the specified project.

```bash
gendoc run "My Sci-Fi Novel"
```

---

### `gendoc publish <project_name>`

Publishes all the generated content for a project into final, consolidated Markdown files.

```bash
gendoc publish "My Sci-Fi Novel"
```

---

### `gendoc rm <project_name>`

Deletes a project and all of its associated files from the workspace.

**Default (with confirmation)**
```bash
gendoc rm "My Sci-Fi Novel"
```

**Force Deletion (skips confirmation)**
```bash
gendoc rm "My Sci-Fi Novel" --yes
```

---

### `gendoc config`

Manages your global configuration, such as API keys and language preferences.

**Set a value**
```bash
gendoc config set llm.apiKey sk-xxxxxxxx
```

**Get a value**
```bash
gendoc config get llm.model
```

**List all currently set values**
```bash
gendoc config list
```
For a full list of configurable keys, please refer to the **Installation & Configuration** guide.
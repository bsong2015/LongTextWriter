# Usage

You can interact with GenDoc through its web interface or the command-line tool.

## Web UI

The primary way to use GenDoc is through the web interface. To start the application for production use, run:

```bash
npm run start:web
```

This starts the backend server and serves the production-built frontend. Open your browser and navigate to `http://localhost:3000`.

## Command-Line Interface (CLI)

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

### Core Commands

-   `gendoc new`: Starts an interactive session to create a new project.
-   `gendoc ls`: Lists all projects in your `gendoc-workspace`.
-   `gendoc status <project_name>`: Displays a detailed progress report for a project.
-   `gendoc outline <project_name>`: Generates a detailed outline using AI.
-   `gendoc run <project_name>`: Starts the AI content generation process.
-   `gendoc publish <project_name>`: Compiles generated content into final Markdown documents.
-   `gendoc rm <project_name>`: Deletes a project.

## Workspace Directory

All your projects are stored in the `gendoc-workspace` directory, which is created automatically in your project root.

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

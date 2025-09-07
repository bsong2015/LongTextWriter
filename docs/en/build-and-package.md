# Build & Package

This section covers how to build the project for production and package it for distribution.

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

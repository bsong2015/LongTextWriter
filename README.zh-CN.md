# GenDoc - AI 长文档生成器

GenDoc 是一个功能强大且灵活的命令行工具和本地 Web 应用程序，它利用大型语言模型（LLM）来自动化创建长篇、结构化的文档。无论您是撰写书籍、从模板生成技术文档，还是创作系列文章，GenDoc 都能简化从创意到最终发布的整个流程。

## 项目结构

本项目是一个由 npm a a workspaces 管理的 monorepo。它分为以下几个包：

-   `packages/cli`: 包含命令行界面（CLI）工具（使用 Commander.js 构建）以及为 Web UI 提供支持的后端服务器（Express.js）。
-   `packages/web-ui`: Vue.js 前端应用程序，为管理 GenDoc 项目提供了用户友好的界面。
-   `packages/shared`: 包含由 `cli` 和 `web-ui` 包共享的代码，主要是 TypeScript 类型和 Zod 模式。

## 功能特性

-   **Web 用户界面 (UI)**: 一个本地的、基于 Web 的界面，用于直观的项目管理、内容编辑和 AI 交互。
-   **多种生成模式**:
    -   **书籍 (Book)**: 从单一想法生成包含章节和文章的完整书籍。
    -   **模板化文档 (Templated Document)**: 从源文档提取内容，填充到预定义的 Markdown 模板中，非常适合生成报告和技术规格文档。
    -   **系列文章 (Article Series)**: 围绕一个中心主题，生成包含大纲的完整系列文章。
-   **交互式设置**: 通过 `gendoc new` 命令，以交互方式引导您完成项目创建。
-   **AI 驱动的大纲生成**: 为您的书籍或系列文章自动生成详细的大纲。
-   **可续写进程**: 您可以随时停止和恢复内容生成过程，进度总会被保存。
-   **灵活的发布选项**: 可将书籍或系列文章发布为单个合并的 Markdown 文件，或为每篇文章生成独立的 Markdown 文件。
-   **结构化工作区**: 所有项目及其资产都整齐地组织在 `gendoc-workspace` 目录中。

## 系统要求

-   Node.js (推荐 v18 或更高版本)
-   一个 OpenAI 兼容的 API 密钥

## 安装与设置

1.  **克隆仓库:**
    ```bash
    git clone <your-repository-url>
    cd <repository-folder>
    ```

2.  **安装依赖:**
    这个命令会一次性安装 monorepo 中所有包（`cli`、`web-ui`、`shared`）的依赖。
    ```bash
    npm install
    ```

3.  **配置您的环境和语言:**
    -   通过在项目根目录复制提供的示例文件来创建 `.env` 文件：
        ```bash
        cp .env.example .env
        ```
    -   打开新创建的 `.env` 文件，并添加您的 OpenAI API 密钥和其他可选设置：
        ```env
        # 您的 API 密钥
        OPENAI_API_KEY="sk-YOUR_OPENAI_API_KEY"

        # (可选) 指定要使用的模型名称
        OPENAI_MODEL="gpt-4o"

        # (可选) 为 OpenAI 兼容的 API (如本地 LLM) 提供自定义的 URL 地址
        OPENAI_API_BASE="http://localhost:11434/v1"
        ```

    -   **代理配置:**
        如果您处于需要代理才能访问互联网的网络环境中，可以通过 `HTTPS_PROXY` 环境变量进行配置。本应用在向 OpenAI API 发出请求时，会自动检测并使用此设置。
        您可以直接在 `.env` 文件中设置该变量：
        ```
        # 可选：配置代理服务器
        HTTPS_PROXY="http://your-proxy-server-address:port"

        # 带身份验证的示例
        # HTTPS_PROXY="http://user:password@your-proxy-server-address:port"
        ```

    -   **语言配置:**
        GenDoc 命令行界面支持多种语言。默认语言为英文。您可以通过设置 `GENDOC_LANG` 环境变量来更改语言。
        *   **使用英文 (默认):** `export GENDOC_LANG=en`
        *   **使用中文:** `export GENDOC_LANG=zh`
        **Windows 用户注意事项:** 在命令提示符中使用 `set GENDOC_LANG=en` 或 `set GENDOC_LANG=zh`，在 PowerShell 中使用 `$env:GENDOC_LANG="en"`。

## 开发

要在开发模式下运行整个应用程序（后端服务器和前端 UI）并启用热重载，请从项目根目录运行以下命令：

```bash
npm run dev
```

这将同时启动：
-   Web UI 的后端服务器。
-   Vue.js 前端的 Vite 开发服务器。

Web UI 将在 `http://localhost:5173` 上可用（如果 5173 端口被占用，则会使用其他端口）。

## 构建项目

要为生产环境构建所有包，请从项目根目录运行以下命令：

```bash
npm run build
```

此命令将按正确的顺序（`shared` -> `web-ui` -> `cli`）构建所有工作区。该过程包括将所有 TypeScript 编译为 JavaScript，并将构建好的前端应用程序复制到 `cli` 包中，以便为其提供服务。

## 打包与分发

要将整个应用程序（CLI 和 Web UI）捆绑到一个可分发的独立文件中，您可以使用 `package` 脚本。这对于与同事共享应用程序或进行部署非常理想。

1.  **创建软件包:**
    从项目根目录运行以下命令：
    ```bash
    npm run package
    ```

2.  **查找输出文件:**
    此命令将在 `packages/cli` 目录内创建一个 `.tgz` 文件（例如 `gendoc-cli-1.0.0.tgz`）。

3.  **安装并运行:**
    任何人都可以通过运行以下命令从该文件安装应用程序：
    ```bash
    # 示例路径，请使用 .tgz 文件的实际路径
    npm install -g ./packages/cli/gendoc-cli-1.0.0.tgz
    ```
    安装后，`gendoc` 命令将在其终端中全局可用。

## 使用方法

### Web UI

使用 GenDoc 的主要方式是通过 Web 界面。要启动生产环境的应用程序，请运行：

```bash
npm run start:web
```

这会启动后端服务器并提供生产环境的前端文件。打开浏览器并访问 `http://localhost:3000`。

### 命令行界面 (CLI)

您也可以直接使用 CLI 进行所有操作。

使用 `npm run build` 构建项目后，您可以使用编译后的输出来运行 CLI 命令：

```bash
node packages/cli/dist/index.js <命令> [参数]
```

在开发过程中，您可以直接使用 `ts-node` 运行命令而无需预先构建：
```bash
npm run dev --workspace=@gendoc/cli -- <命令> [参数]
```
示例:
```bash
npm run dev --workspace=@gendoc/cli -- ls
```

#### **核心命令**

-   `gendoc new`: 启动一个交互式会话来创建一个新的项目。
-   `gendoc ls`: 列出您 `gendoc-workspace` 中的所有项目。
-   `gendoc status <project_name>`: 显示特定项目的详细进度报告。
-   `gendoc outline <project_name>`: 调用 AI 生成详细的大纲。
-   `gendoc run <project_name>`: 启动 AI 内容生成过程。
-   `gendoc publish <project_name>`: 将生成的内容编译成最终的 Markdown 文档。
-   `gendoc rm <project_name>`: 删除一个项目。

## 使用模拟 LLM 进行测试

为了加快开发和测试速度，特别是在处理与大型语言模型（LLM）交互的功能时，您可以启用模拟 LLM 模式。此模式会绕过对 OpenAI 的实际 API 调用，并返回预定义的虚拟响应，从而节省时间和 API 成本。

要启用模拟 LLM，请在运行任何 `gendoc` 命令或启动 Web UI 之前，将 `MOCK_LLM` 环境变量设置为 `true`。

*   **对于 Linux/macOS (Bash/Zsh):** `export MOCK_LLM=true`
*   **对于 Windows (命令提示符):** `set MOCK_LLM=true`
*   **对于 Windows (PowerShell):** `$env:MOCK_LLM="true"`

## 端到端测试

项目包含一个端到端（E2E）测试套件，位于 `e2e-tests` 目录中。

### 如何运行 E2E 测试

1.  **启动 GenDoc 服务器**：
    在项目根目录中，启动 Web 服务器：
    ```bash
    # 首先请确保您已在 .env 文件中设置了必要的 API 密钥
    npm run start:web
    ```
    让服务器在单独的终端中保持运行。

2.  **安装 E2E 测试依赖**：
    ```bash
    cd e2e-tests
    npm install
    ```

3.  **运行测试脚本**：
    仍在 `e2e-tests` 目录中，使用 `npx` 执行测试脚本：
    ```bash
    npx ts-node test_workflow.ts
    ```

## 工作区目录

您所有的项目都存储在 `gendoc-workspace` 目录中，该目录会在您的项目根目录下自动创建。其结构与重构前保持一致。

```
gendoc-workspace/
└── projects/
    ├── my-first-book/
    │   ├── project.json      # 核心项目配置和大纲
    │   ├── generated.json    # AI 生成的中间内容
    │   └── output/
    └── my-design-spec/
        ├── project.json
        ├── sources/          # 用于模板化文档的源文件
        ├── templates/        # 您的模板文件
        └── output/
```

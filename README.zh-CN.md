# GenDoc - AI 长文档生成器

GenDoc 是一个功能强大且灵活的命令行工具和本地 Web 应用程序，它利用大型语言模型（LLM）来自动化创建长篇、结构化的文档。无论您是撰写书籍、从模板生成技术文档，还是创作系列文章，GenDoc 都能简化从创意到最终发布的整个流程。

## 功能特性

*   **Web 用户界面 (UI)**: 一个本地的、基于 Web 的界面，用于直观的项目管理、内容编辑和 AI 交互。
*   **多种生成模式**: 支持书籍、模板化文档和系列文章生成。
*   **AI 驱动的大纲生成**: 为您的书籍或系列文章自动生成详细的大纲。
*   **可续写进程**: 您可以随时停止和恢复内容生成过程。
*   **灵活的发布选项**: 可发布为单个合并的 Markdown 文件或为每篇文章生成独立的 Markdown 文件。
*   **结构化工作区**: 所有项目及其资产都整齐地组织在 `gendoc-workspace` 目录中。

## 快速开始

### 系统要求

*   Node.js (推荐 v22 或更高版本)
*   一个 OpenAI 兼容的 API 密钥

### 安装

1.  **克隆仓库:**
    ```bash
    git clone <your-repository-url>
    cd <repository-folder>
    ```
2.  **安装依赖:**
    ```bash
    npm install
    ```
3.  **配置您的环境:**
    通过在项目根目录复制提供的示例文件来创建 `.env` 文件，并添加您的 OpenAI API 密钥：
    ```bash
    cp .env.example .env
    ```
    打开 `.env` 文件并添加：
    ```
    OPENAI_API_KEY="sk-YOUR_OPENAI_API_KEY"
    ```

### 运行应用程序

**开发模式 (Web UI & 后端):**

要在开发模式下运行整个应用程序并启用热重载：

```bash
npm run dev
```

Web UI 将在 `http://localhost:5173` 上可用。

**生产模式 (Web UI & 后端):**

要启动生产环境的应用程序：

```bash
npm run start:web
```

打开浏览器并访问 `http://localhost:3000`。

## 核心 CLI 命令

GenDoc 提供了强大的命令行界面：

*   `gendoc new`: 启动一个交互式会话来创建一个新的项目。
*   `gendoc ls`: 列出您 `gendoc-workspace` 中的所有项目。
*   `gendoc status <project_name>`: 显示特定项目的详细进度报告。
*   `gendoc outline <project_name>`: 调用 AI 生成详细的大纲。
*   `gendoc run <project_name>`: 启动 AI 内容生成过程。
*   `gendoc publish <project_name>`: 将生成的内容编译成最终的 Markdown 文档。
*   `gendoc rm <project_name>`: 删除一个项目。

## 文档

有关安装、配置、高级用法、开发、测试等更多详细信息，请参阅我们的完整文档：

*   [**安装与配置**](docs/zh/installation-and-configuration.md)
*   [**开发设置**](docs/zh/development-setup.md)
*   [**构建与打包**](docs/zh/build-and-package.md)
*   [**使用指南 (Web UI & CLI)**](docs/zh/usage.md)
*   [**测试**](docs/zh/testing.md)
*   [**项目结构与工作区**](docs/zh/index.md)
# GenDoc - AI 长文档生成器

GenDoc 是一个功能强大且灵活的命令行工具，它利用大型语言模型（LLM）来自动化创建长篇、结构化的文档。无论您是撰写书籍、从模板生成技术文档，还是创作系列文章，GenDoc 都能简化从创意到最终发布的整个流程。

## 功能特性

- **Web 用户界面 (UI)**: 一个本地的、基于 Web 的界面，用于直观的项目管理、内容编辑和 AI 交互。
- **多种生成模式**: 
  - **书籍 (Book)**: 从单一想法生成包含章节和文章的完整书籍。
  - **模板化文档 (Templated Document)**: 从源文档提取内容，填充到预定义的 Markdown 模板中，非常适合生成报告和技术规格文档。
  - **系列文章 (Article Series)**: 围绕一个中心主题，生成包含大纲的完整系列文章。
- **交互式设置**: 通过 `gendoc new` 命令，以交互方式引导您完成项目创建。
- **AI 驱动的大纲生成**: 为您的书籍或系列文章自动生成详细的大纲。
- **可续写进程**: 您可以随时停止和恢复内容生成过程，进度总会被保存。
- **灵活的发布选项**: 可将书籍或系列文章发布为单个合并的 Markdown 文件，或为每篇文章生成独立的 Markdown 文件。
- **结构化工作区**: 所有项目及其资产都整齐地组织在 `gendoc-workspace` 目录中。

## 技术栈

- **运行环境**: Node.js
- **开发语言**: TypeScript
- **CLI 框架**: Commander.js
- **交互式提示**: @inquirer/prompts
- **LLM 集成**: LangChain.js
- **数据校验**: Zod

## 系统要求

- Node.js (推荐 v18 或更高版本)
- 一个 OpenAI 兼容的 API 密钥

## 安装与设置

1. **克隆仓库:**
   ```bash
   git clone <your-repository-url>
   cd <repository-folder>
   ```

2. **安装依赖:**
   ```bash
   npm install
   ```

3. **配置您的环境和语言:**
   - 通过复制提供的示例文件来创建 `.env` 文件：
     ```bash
     cp .env.example .env
     ```
   - 打开新创建的 `.env` 文件，并添加您的 OpenAI API 密钥和其他可选设置：
     ```env
     # 您的 API 密钥
     OPENAI_API_KEY="sk-YOUR_OPENAI_API_KEY"

     # (可选) 指定要使用的模型名称
     OPENAI_MODEL="gpt-4o"

     # (可选) 为 OpenAI 兼容的 API (如本地 LLM) 提供自定义的 URL 地址
     OPENAI_API_BASE="http://localhost:11434/v1"
     ```
   - **语言配置:**
     GenDoc 命令行界面支持多种语言。默认语言为英文。您可以通过设置 `GENDOC_LANG` 环境变量来更改语言。
     *   **使用英文 (默认):**
         ```bash
         export GENDOC_LANG=en
         # 或者不设置 GENDOC_LANG 环境变量
         ```
     *   **使用中文:**
         ```bash
         export GENDOC_LANG=zh
         ```
     **Windows 用户注意事项:** 在命令提示符中使用 `set GENDOC_LANG=en` 或 `set GENDOC_LANG=zh`，在 PowerShell 中使用 `$env:GENDOC_LANG="en"` 或 `$env:GENDOC_LANG="zh"`。

4. **构建项目:**
   ```bash
   npm run build
   ```
   此命令会编译 TypeScript 代码到 JavaScript，并使 `gendoc` 命令可用。

## 使用模拟 LLM 进行测试

为了加快开发和测试速度，特别是在处理与大型语言模型（LLM）交互的功能时，您可以启用模拟 LLM 模式。此模式会绕过对 OpenAI 的实际 API 调用，并返回预定义的虚拟响应，从而节省时间和 API 成本。

### 如何使用模拟 LLM

要启用模拟 LLM，请在运行任何 `gendoc` 命令或启动 Web UI 之前，将 `MOCK_LLM` 环境变量设置为 `true`。

*   **对于 Linux/macOS (Bash/Zsh):**
    ```bash
    export MOCK_LLM=true
    # 然后运行您的命令，例如：npm run start:web 或 node dist/index.js outline my-project
    ```
*   **对于 Windows (命令提示符):**
    ```cmd
    set MOCK_LLM=true
    rem 然后运行您的命令，例如：npm run start:web 或 node dist/index.js outline my-project
    ```
*   **对于 Windows (PowerShell):**
    ```powershell
    $env:MOCK_LLM="true"
    # 然后运行您的命令，例如：npm run start:web 或 node dist/index.js outline my-project
    ```

**要禁用模拟 LLM** (并使用真实的 OpenAI API，请确保您的 `OPENAI_API_KEY` 已设置):

*   **对于 Linux/macOS (Bash/Zsh):**
    ```bash
    unset MOCK_LLM
    ```
*   **对于 Windows (命令提示符):**
    ```cmd
    set MOCK_LLM=
    ```
*   **对于 Windows (PowerShell):**
    ```powershell
    Remove-Item Env:MOCK_LLM
    ```

当启用模拟 LLM 时，您将在控制台中看到 "MOCK LLM: Returning dummy response." 消息，并且 AI 生成的内容将被模拟数据替换。

## 使用方法

本工具的主要入口是 `gendoc` 命令，您可以使用 `node dist/index.js` 来运行它。

## 使用方法

本工具的主要入口是 `gendoc` 命令，您可以使用 `node dist/index.js` 来运行它。

```bash
# 为方便起见，建议创建一个全局别名
# 对于 Linux/macOS (在 .bashrc 或 .zshrc 文件中):
# alias gendoc="node /path/to/your/project/dist/index.js"

# 对于 Windows (在 PowerShell 配置文件中):
# function gendoc { node C:\path\to\your\project\dist\index.js $args }
```

###核心命令

- **`gendoc new`**
  启动一个交互式会话来创建一个新的生成项目。系统将提示您选择项目类型（`book`, `templated`, `series`）并提供必要的详细信息。

- **`gendoc ls`**
  列出您 `gendoc-workspace` 中的所有项目，显示其类型、状态和创建日期。

- **`gendoc status <project_name>`**
  显示特定项目的详细进度报告，包括哪些文章已生成、待处理或生成失败。

- **`gendoc outline <project_name>`**
  *(仅适用于 `book` 和 `series` 类型)*
  调用 AI 根据项目的核心想法生成详细的章节和文章大纲。

- **`gendoc run <project_name>`**
  启动核心的 AI 内容生成过程。此命令是可续写的。如果中途停止，您可以再次运行它以从上次离开的地方继续。

- **`gendoc publish <project_name>`**
  将生成的内容编译成最终的、可读的 Markdown 文档，存放在项目的 `output` 文件夹中。

- **`gendoc rm <project_name>`**
  在确认提示后，删除一个项目及其所有相关文件。

### 示例工作流：创建一本书

1. **启动一个新项目:**
   ```bash
   node dist/index.js new
   ```
   - 选择 `Book`。
   - 输入项目名称 (例如, `my-mars-book`)。
   - 提供核心思想、语言和任何全局性的 AI 提示。

2. **生成大纲:**
   ```bash
   node dist/index.js outline my-mars-book
   ```
   等待 AI 创建书籍结构。如果需要，您可以手动编辑 `project.json` 文件来调整大纲。

3. **生成内容:**
   ```bash
   node dist/index.js run my-mars-book
   ```
   工具现在将逐一撰写每篇文章。这可能需要一些时间。您可以使用 `status` 命令监控进度。

4. **发布书籍:**
   ```bash
   node dist/index.js publish my-mars-book
   ```
   您最终的、已编译的书籍将位于 `gendoc-workspace/projects/my-mars-book/output/my-mars-book.md`。

## Web 用户界面 (UI)

GenDoc 还提供了一个本地的、基于 Web 的用户界面，以提供更直观和可视化的体验。

### 启动 Web UI

要启动 Web 服务器，请运行：

```bash
npm run start:web
```

服务器启动后，在您的 Web 浏览器中打开 `http://localhost:3000`。

### Web UI 功能

Web UI 提供：

-   **仪表板:** 所有项目的可视化概览，包括其状态和快速操作。
-   **项目管理:** 通过直观的界面创建、查看详情、编辑和删除项目。
-   **内容编辑:** 集成的 Markdown 编辑器，用于直接创建和修改内容。
-   **AI 交互:** 直接从浏览器触发大纲生成、内容生成和发布。
-   **国际化:** 在 UI 中切换支持的语言。

## 端到端测试

项目包含一个端到端（E2E）测试套件，通过对服务器进行 API 调用来模拟完整的用户工作流程。该测试位于 `e2e-tests` 目录中，提供了一种全面的方式来验证应用程序的核心功能。

### 测试工作流程

E2E 测试脚本（`test_workflow.ts`）执行以下操作：

1.  **创建项目**：创建一个新项目。
2.  **列出项目**：验证新创建的项目是否存在于列表中。
3.  **生成和修改大纲**：生成、修改并保存项目大纲。
4.  **生成和修改内容**：运行内容生成，然后修改并保存结果。
5.  **发布和下载**：发布内容并验证下载。
6.  **删除项目**：通过删除项目来清理。
7.  **验证删除**：确认项目已不再列出。

### 如何运行 E2E 测试

要运行 E2E 测试，请按照以下步骤操作：

1.  **启动 GenDoc 服务器**：
    在项目根目录中，启动 Web 服务器：
    ```bash
    # 首先请确保您已在 .env 文件中设置了必要的 API 密钥
    npm run start:web
    ```
    让服务器在单独的终端中保持运行。

2.  **安装 E2E 测试依赖**：
    导航到 `e2e-tests` 目录并安装其依赖项：
    ```bash
    cd e2e-tests
    npm install
    ```

3.  **运行测试脚本**：
    仍在 `e2e-tests` 目录中，使用 `npx` 执行测试脚本：
    ```bash
    npx ts-node test_workflow.ts
    ```
    使用 `npx` 可以确保使用本地安装的 `ts-node` 版本来运行脚本。脚本会将其进度打印到控制台，显示工作流程的每一步。

## 工作区目录

您所有的项目都存储在 `gendoc-workspace` 目录中，该目录会在您的项目根目录下自动创建。

```
gendoc-workspace/
└── projects/
    ├── my-first-book/
    │   ├── project.json      # 核心项目配置和大纲
    │   ├── generated.json    # AI 生成的中间内容
    │   └── output/
    │       └── my-first-book.md
    └── my-design-spec/
        ├── project.json
        ├── sources/          # 用于模板化文档的源文件
        │   └── requirement.md
        ├── templates/        # 您的模板文件
        │   └── design_template.md
        └── output/
            └── design_spec_v1.md
```
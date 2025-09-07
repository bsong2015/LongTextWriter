# 开发环境设置指南

本指南适用于希望为 GenDoc 贡献代码，或在本地进行二次开发的开发者。如果您只是想使用本应用，请参阅《安装与配置》和《使用指南》。

## 1. 初始设置

1.  **克隆仓库**:
    ```bash
    git clone <your-repository-url>
    cd <repository-folder>
    ```

2.  **安装依赖**:
    本项目使用 npm workspaces。运行以下命令来安装所有包 (`cli`, `web-ui`, `shared`) 的依赖项：
    ```bash
    npm install
    ```

3.  **配置环境变量**:
    您需要一个 OpenAI API 密钥来进行开发。通过复制模板文件来创建您的本地 `.env` 文件：
    ```bash
    cp .env.example .env
    ```
    然后，编辑 `.env` 文件并填入您的 API 密钥。

## 2. 运行开发服务器

*   **运行 Web UI (前端 + 后端)**:
    要在开发模式下同时运行后端和前端（带热重载），请使用：
    ```bash
    npm run dev
    ```
    在浏览器中访问 `http://localhost:5173`。

*   **运行 CLI 命令**:
    要在开发时单独测试 CLI 命令，请使用以下脚本，它会通过 `ts-node` 直接运行源码：
    ```bash
    # 语法: npm run dev --workspace=@gendoc/cli -- <command>
    
    # 示例: 列出所有项目
    npm run dev --workspace=@gendoc/cli -- ls
    
    # 示例: 创建一个新项目
    npm run dev --workspace=@gendoc/cli -- new
    ```

## 3. 后续步骤

-   关于如何**构建和打包**应用的说明，请参阅 **`build-and-package.md`**。
-   关于如何运行**单元测试**的指南，请参阅 **`testing.md`**。
# 安装与配置

本指南将引导您在本地计算机上完成 GenDoc 的设置。

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

### 代理配置

如果您处于需要代理才能访问互联网的网络环境中，可以通过 `HTTPS_PROXY` 环境变量进行配置。本应用在向 OpenAI API 发出请求时，会自动检测并使用此设置。
您可以直接在 `.env` 文件中设置该变量：
```
# 可选：配置代理服务器
HTTPS_PROXY="http://your-proxy-server-address:port"

# 带身份验证的示例
# HTTPS_PROXY="http://user:password@your-proxy-server-address:port"
```

### 语言配置

GenDoc 命令行界面支持多种语言。默认语言为英文。您可以通过设置 `GENDOC_LANG` 环境变量来更改语言。
*   **使用英文 (默认):** `export GENDOC_LANG=en`
*   **使用中文:** `export GENDOC_LANG=zh`

**Windows 用户注意事项:** 在命令提示符中使用 `set GENDOC_LANG=en` 或 `set GENDOC_LANG=zh`，在 PowerShell 中使用 `$env:GENDOC_LANG="en"`。

# 安装与配置

本指南提供了设置 GenDoc 的完整说明。请阅读以下部分，以选择最适合您的安装方法。

## 选择您的安装方式

安装 GenDoc 主要有两种方式：

-   **从 npm 包安装 (推荐)**：此方法适用于大多数希望快速开始使用本应用的用户。这是最简单、最干净的入门方式。
-   **从源代码安装**：此方法适用于开发者、贡献者或希望使用最新（可能不稳定）功能的用户。

## 系统要求

在开始之前，请确保您已安装以下软件：

-   **Node.js**: 推荐 v22 或更高版本。您可以从 [Node.js 官网](https://nodejs.org/) 下载。
-   **OpenAI API 密钥**: 使用 AI 生成功能所必需。
-   **Git**: 仅当您选择从源代码安装时需要。

## 安装

请根据您选择的方法按照说明进行操作。

### 方式一：从包文件安装

由于本包未发布到 npm 公共仓库，您必须通过 GitHub 上每个 Release 版本提供的包文件 (`.tgz`) 来进行安装。

1.  前往项目的 **GitHub Releases** 页面。
2.  从最新的 Release 中下载 `.tgz` 格式的包文件 (例如 `gendoc-cli-v1.x.x.tgz`)。
3.  打开终端，切换到您下载文件的目录，然后运行以下命令 (请将文件名替换为您下载的实际文件)：
    ```bash
    npm install -g ./gendoc-cli-v1.x.x.tgz
    ```

**验证安装**
安装完成后，您可以运行以下命令来验证 `gendoc` 命令是否可用：
```bash
gendoc --version
```

### 方式二：从源代码安装

此方法适用于希望贡献代码或进行二次开发的开发者。关于如何设置完整的本地开发环境，请参阅我们的 **[开发环境设置指南](./development-setup.md)**。


## 配置

GenDoc 提供多种方式来配置参数。理解它们的优先级非常重要。

### 配置优先级

配置参数按以下优先顺序生效（位置越高的项目会覆盖位置越低的项目）：

1.  **环境变量** (例如 `OPENAI_API_KEY`)
2.  **全局 CLI 配置** (通过 `gendoc config` 命令管理)
3.  **.env 文件** (主要用于从源码安装的开发场景)

### 推荐的配置方法: `gendoc config`

对于通过 npm 包安装的用户，这是管理配置的推荐方法。

使用 `gendoc config set` 命令并通过点分表示法来应用配置。

**1. 设置您的 API 密钥 (必需)**
```bash
gendoc config set llm.apiKey sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
(请将 `sk-xxxxxxxx...` 替换为您的真实 API 密钥。)

**2. 查看所有可用的配置项**
以下是所有可用的配置项：

| 配置项 (Key) | 描述 | 默认值 |
| :--- | :--- | :--- |
| `llm.apiKey` | 您的 OpenAI API 密钥。 | `null` |
| `llm.model` | 要使用的 LLM 模型名称。 | `'gpt-4o'` |
| `llm.baseUrl` | 用于 OpenAI 兼容 API 的自定义基础 URL（例如本地 LLM）。 | `null` |
| `llm.proxy` | 用于访问网络的代理服务器地址。 | `null` |
| `app.language` | 应用程序界面的语言。可以是 `en` 或 `zh`。 | `'en'` |
| `app.mock` | 是否启用模拟 LLM 响应，用于测试。可以是 `true` 或 `false`。 | `false` |

**3. 管理和验证您的配置**
```bash
# 设置界面语言为中文
gendoc config set app.language zh

# 检查单个值
gendoc config get app.language

# 列出所有已配置的值
gendoc config list
```

### 其他备用方法

**环境变量**
您可以设置环境变量来覆盖任何其他配置。这对于 CI/CD 环境或设置代理非常有用。

-   `OPENAI_API_KEY`: 设置 API 密钥。
-   `OPENAI_MODEL`: 设置模型名称。
-   `OPENAI_API_BASE`: 设置 API 基础 URL。
-   `HTTPS_PROXY`: 设置代理服务器 URL。
-   `GENDOC_LANG`: 设置应用语言 (`en` 或 `zh`)。

**`.env` 文件**
当您从源代码安装时，可以在项目根目录中创建一个 `.env` 文件。此方法主要用于开发目的。

1.  复制示例文件：
    ```bash
    cp .env.example .env
    ```
2.  编辑 `.env` 文件并填入您的配置：
    ```env
    OPENAI_API_KEY="sk-YOUR_OPENAI_API_KEY"
    HTTPS_PROXY="http://your-proxy-server-address:port"
    ```
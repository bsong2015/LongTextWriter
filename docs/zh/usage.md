# 使用指南

本指南将说明如何使用 GenDoc 命令行界面 (CLI)。关于安装和配置的说明，请参阅《安装与配置》指南。

## 启动 Web UI

要启动集成的 Web 用户界面，只需运行 `web` 命令。该命令会启动一个本地服务器，您便可以在浏览器中访问应用。

```bash
gendoc web
```

可访问的 URL (通常是 `http://localhost:3000`) 将会显示在您的终端中。

## CLI 命令详解

以下是所有可用 CLI 命令的详细参考。

### `gendoc new`

创建一个新的文档生成项目。

**交互模式**
直接运行 `gendoc new` 会启动一个交互式会话，它将引导您完成整个项目设置过程。

```bash
gendoc new
```

**参数模式**
您也可以通过命令行选项直接提供所有项目细节，以实现自动化。

```bash
# 示例：创建一个名为“我的科幻小说”的中文书籍项目
gendoc new book --name "我的科幻小说" --lang "zh" --summary "一个关于孤独探险家在遥远星球上的故事。"
```

**可用选项**
-   `[type]`: 项目类型。可以是 `book` (书籍)、`series` (系列文章) 或 `templated` (模板化)。
-   `-n, --name <name>`: 项目的名称。
-   `-l, --lang <language>`: 项目构思所用的语言 (例如 `en`, `zh`)。
-   `-s, --summary <summary>`: 项目构思的简要总结。
-   `-p, --prompt <prompt>`: 一个全局提示或指令，用于指导整个生成过程。
-   `--sources <sources...>`: 用于 `templated` 类型项目，一个或多个源文件。
-   `--template <template>`: 用于 `templated` 类型项目，模板文件的路径。

---

### `gendoc ls`

列出您工作区中当前的所有项目。

```bash
gendoc ls
```

---

### `gendoc status <project_name>`

显示指定项目的生成状态、进度和详细信息。

```bash
gendoc status "我的科幻小说"
```

---

### `gendoc outline <project_name>`

使用 AI 为 `book` 或 `series` 类型的项目自动生成详细大纲。

```bash
gendoc outline "我的科幻小说"
```

---

### `gendoc run <project_name>`

启动或继续指定项目的内容生成过程。

```bash
gendoc run "我的科幻小说"
```

---

### `gendoc publish <project_name>`

将项目生成的所有内容发布为最终的、合并的 Markdown 文件。

```bash
gendoc publish "我的科幻小说"
```

---

### `gendoc rm <project_name>`

从工作区中删除一个项目及其所有相关文件。

**默认 (有确认提示)**
```bash
gendoc rm "我的科幻小说"
```

**强制删除 (跳过确认)**
```bash
gendoc rm "我的科幻小说" --yes
```

---

### `gendoc config`

管理您的全局配置，例如 API 密钥和语言偏好。

**设置一个值**
```bash
gendoc config set llm.apiKey sk-xxxxxxxx
```

**获取一个值**
```bash
gendoc config get llm.model
```

**列出所有当前已设置的值**
```bash
gendoc config list
```
关于完整的可配置键列表，请参阅《安装与配置》指南。
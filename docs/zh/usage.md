# 使用方法

您可以通过其 Web 界面或命令行工具与 GenDoc 进行交互。

## Web UI

使用 GenDoc 的主要方式是通过 Web 界面。要启动生产环境的应用程序，请运行：

```bash
npm run start:web
```

这会启动后端服务器并提供生产环境的前端文件。打开浏览器并访问 `http://localhost:3000`。

## 命令行界面 (CLI)

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

### 核心命令

-   `gendoc new`: 启动一个交互式会话来创建一个新的项目。
-   `gendoc ls`: 列出您 `gendoc-workspace` 中的所有项目。
-   `gendoc status <project_name>`: 显示特定项目的详细进度报告。
-   `gendoc outline <project_name>`: 调用 AI 生成详细的大纲。
-   `gendoc run <project_name>`: 启动 AI 内容生成过程。
-   `gendoc publish <project_name>`: 将生成的内容编译成最终的 Markdown 文档。
-   `gendoc rm <project_name>`: 删除一个项目。

## 工作区目录

您所有的项目都存储在 `gendoc-workspace` 目录中，该目录会在您的项目根目录下自动创建。

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

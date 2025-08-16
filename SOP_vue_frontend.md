# GenDoc Web UI 开发标准作业程序 (SOP)

## 1. 项目概述与目标

本文档为AI程序员提供一个清晰、可执行的标准作业程序（SOP），用于从零开始构建 `GenDoc` 项目的前端Web界面。最终目标是实现一个功能完整、用户体验良好、与后端API完全对接的Vue.js单页应用（SPA）。

**核心技术栈:** 

*   **框架:** Vue.js 3 (Composition API)
*   **构建工具:** Vite
*   **UI组件库:** Element Plus
*   **HTTP客户端:** Axios
*   **状态管理:** Pinia
*   **路由:** Vue Router
*   **语言:** TypeScript

**核心流程:** 

1.  **环境准备与项目脚手架搭建。**
2.  **核心结构与服务层构建 (API, 路由, 状态管理)。**
3.  **分模块实现核心界面功能：**
    *   项目管理仪表盘 (Dashboard)
    *   项目详情页 (Project Detail)
        *   "图书/系列" 类型工作流 (设定、大纲、内容、发布)
        *   "模板化" 类型工作流 (文件、生成、发布)
4.  **实现国际化 (i18n) 功能。**
5.  **整体测试与最终构建。**

--- 

## 2. 准备阶段

### 2.1 阶段目标

*   初始化Vue.js项目环境。
*   安装所有必要的依赖库。
*   清理并准备项目结构。

### 2.2 具体步骤

#### 步骤 2.2.1：初始化Vue.js项目

*   **目标：** 使用 `create-vue` (Vite) 创建一个新的Vue.js项目。
*   **操作指令：**
    1.  在项目根目录 `D:\git\LongTextWritoer\` 下，执行以下命令来创建前端UI项目。
        ```shell
        npm create vue@latest
        ```
    2.  在交互式提示中，按以下方式配置项目：
        *   Project name: `gendoc-web-ui`
        *   Add TypeScript? `Yes`
        *   Add JSX Support? `No`
        *   Add Vue Router for Single Page Application development? `Yes`
        *   Add Pinia for state management? `Yes`
        *   Add Vitest for Unit Testing? `No` (暂时跳过，可后续添加)
        *   Add an End-to-End Testing Solution? `No`
        *   Add ESLint for code quality? `Yes`
        *   Add Prettier for code formatting? `Yes`
*   **预期产出：**
    *   在根目录下创建 `gendoc-web-ui` 文件夹，包含一个完整的Vue 3 + Vite项目结构。

#### 步骤 2.2.2：安装核心依赖

*   **目标：** 安装UI组件库和HTTP客户端。
*   **操作指令：**
    1.  进入新创建的前端项目目录。
        ```shell
        cd gendoc-web-ui
        ```
    2.  安装 `element-plus` 用于UI组件，`axios` 用于API请求。
        ```shell
        npm install element-plus @element-plus/icons-vue axios
        ```
*   **预期产出：**
    *   `package.json` 和 `package-lock.json` 文件更新，包含新添加的依赖。
    *   `node_modules` 目录包含所有依赖项。

#### 步骤 2.2.3：全局引入Element Plus并清理项目

*   **目标：** 配置Element Plus以便全局使用，并移除Vue脚手架自带的示例代码。
*   **操作指令：**
    1.  修改 `gendoc-web-ui/src/main.ts`，引入Element Plus的样式和组件。
    2.  删除 `gendoc-web-ui/src/components` 目录下的所有示例组件 (如 `HelloWorld.vue`, `TheWelcome.vue` 等)。
    3.  清空 `gendoc-web-ui/src/views` 目录下的示例视图组件内容，或删除它们。
    4.  清理 `gendoc-web-ui/src/App.vue`，移除所有对示例组件的引用，只留下 `<router-view />`。
*   **预期产ut：**
    *   一个干净的、准备好进行开发的Vue项目骨架。

#### 步骤 2.2.4：阶段性测试

*   **目标：** 确保开发环境可以正常运行。
*   **操作指令：**
    ```shell
    npm run dev
    ```
*   **预期产出：**
    *   Vite开发服务器成功启动。
    *   在浏览器中打开 `http://localhost:5173` (或指定的端口)，应能看到一个空白页面，无任何错误。

--- 

## 3. 核心结构与服务层构建

### 3.1 阶段目标

*   建立与后端API通信的服务层。
*   配置应用的基础路由。
*   创建共享的应用状态存储。

### 3.2 具体步骤

#### 步骤 3.2.1：创建API服务层

*   **目标：** 封装所有对后端 `server.ts` 中API的调用。
*   **操作指令：**
    1.  在 `gendoc-web-ui/src/` 下创建 `services/api.ts` 文件。
    2.  在该文件中，使用 `axios` 创建一个实例，并为 `server.ts` 中的每个API端点编写一个导出的异步函数。
        *   `getProjects()` -> `GET /api/projects`
        *   `createProject(data)` -> `POST /api/projects`
        *   `deleteProject(name)` -> `DELETE /api/projects/:name`
        *   `getProjectDetails(name)` -> `GET /api/projects/:projectName`
        *   ...等等，覆盖所有API。
*   **预期产出：**
    *   一个 `api.ts` 文件，集中管理所有后端通信逻辑。

#### 步骤 3.2.2：配置路由

*   **目标：** 定义应用的主要页面路由。
*   **操作指令：**
    1.  编辑 `gendoc-web-ui/src/router/index.ts`。
    2.  定义两个主要路由：
        *   `path: '/'`, `name: 'Dashboard'`, `component: () => import('../views/DashboardView.vue')`
        *   `path: '/projects/:projectName'`, `name: 'ProjectDetail'`, `component: () => import('../views/ProjectDetailView.vue')`, `props: true`
*   **预期产ut：**
    *   应用路由配置完成。

#### 步骤 3.2.3：创建Pinia Store

*   **目标：** 创建一个全局store来管理共享状态，例如国际化语言。
*   **操作指令：**
    1.  在 `gendoc-web-ui/src/stores/` 下创建一个 `app.ts` 文件。
    2.  使用 `defineStore` 创建一个名为 `useAppStore` 的store。
    3.  在state中定义 `language: 'en'`，并创建相应的action来修改它。
*   **预期产出：**
    *   一个 `app.ts` store文件，用于管理全局状态。

--- 

## 4. 界面实现：项目管理仪表盘

### 4.1 阶段目标

*   完成项目仪表盘的UI和功能，包括项目列表、新建和删除。

### 4.2 具体步骤

#### 步骤 4.2.1：创建Dashboard视图组件

*   **目标：** 搭建仪表盘页面的基本结构。
*   **操作指令：**
    1.  创建 `gendoc-web-ui/src/views/DashboardView.vue` 文件。
    2.  使用Element Plus的 `ElContainer`, `ElHeader`, `ElMain`, `ElButton` 布局。
    3.  在页面顶部放置 "GenDoc" Logo和一个 "新建项目" 按钮。
*   **预期产出：**
    *   一个基本的仪表盘页面布局。

#### 步骤 4.2.2：获取并展示项目列表

*   **目标：** 从API获取项目列表并以卡片形式展示。
*   **操作指令：**
    1.  在 `DashboardView.vue` 的 `<script setup>` 中，引入 `ref`, `onMounted` 和 `services/api.ts`。
    2.  在 `onMounted` 钩子中调用 `api.getProjects()`，将返回的数据存储在一个 `ref` 数组中。
    3.  在模板中，使用 `v-for` 遍历项目数组，并用 `ElCard` 组件展示每个项目的信息（名称、类型、创建日期）。
    4.  为每个卡片添加点击事件，使用 `vue-router` 导航到对应的项目详情页。
*   **预期产出：**
    *   仪表盘能动态显示所有项目。

#### 步骤 4.2.3：实现“新建项目”模态框

*   **目标：** 创建一个功能完善的、分步式的新建项目表单。
*   **操作指令：**
    1.  在 `DashboardView.vue` 中，使用 `ElDialog` 作为模态框。
    2.  内部使用 `ElSteps` 和 `ElStep` 来引导用户。
    3.  第一步：使用 `ElRadioGroup` 或 `ElTabs` 让用户选择项目类型。
    4.  第二步：根据所选类型，使用 `v-if` 或 `v-show` 动态展示不同的 `ElForm`。表单字段需严格对应 `web ui requiremtn.md` 中的要求。
    5.  实现表单提交逻辑，调用 `api.createProject(formData)`，成功后刷新项目列表并关闭模态框。
*   **预期产出：**
    *   用户可以通过UI完整地创建三种不同类型的项目。

#### 步骤 4.2.4：实现项目删除功能

*   **目标：** 在项目卡片上添加删除功能。
*   **操作指令：**
    1.  在每个项目卡片上添加一个删除图标按钮。
    2.  使用 `ElPopconfirm` 组件包裹删除按钮，提供二次确认，防止误操作。
    3.  当用户确认删除时，调用 `api.deleteProject(projectName)`，成功后刷新项目列表。
*   **预期产出：**
    *   用户可以安全地删除项目。

#### 步骤 4.2.5：阶段性测试

*   **目标：** 验证仪表盘所有功能是否正常。
*   **操作指令：**
    1.  运行 `npm run dev`。
    2.  **测试用例：**
        *   查看项目列表是否正确显示。
        *   创建三种类型的项目，检查是否成功。
        *   删除一个项目，检查是否成功。
        *   点击项目卡片，检查是否能正确跳转到详情页路由。
*   **预期产出：**
    *   一个功能完备的项目仪表盘。

--- 

## 5. 界面实现：项目详情页

### 5.1 阶段目标

*   构建项目详情页的整体布局和动态工作流切换机制。
*   完整实现 "图书/系列文章" 和 "模板化文档" 两种工作流的所有功能。

### 5.2 具体步骤

#### 步骤 5.2.1：创建详情页基础布局

*   **目标：** 搭建详情页的框架，包括返回按钮、标题和动态标签页。
*   **操作指令：**
    1.  创建 `gendoc-web-ui/src/views/ProjectDetailView.vue` 文件。
    2.  从路由参数 `projectName` 获取项目名称，并在 `onMounted` 中调用 `api.getProjectDetails()` 获取项目完整信息，存入 `ref`。
    3.  在页面顶部放置返回按钮和项目名称标题。
    4.  使用 `ElTabs` 组件。利用 `v-if` 根据 `project.type` ('book'/'series' vs 'templated') 渲染不同的 `ElTabPane` 集合。
*   **预期产出：**
    *   一个能根据项目类型显示不同导航标签的详情页框架。

#### 步骤 5.2.2：实现 "图书/系列" -> "大纲" 标签页

*   **目标：** 创建一个可交互的大纲编辑器。
*   **操作指令：**
    1.  创建一个新的组件 `components/OutlineEditor.vue`。
    2.  使用 `ElTree` 组件来展示大纲。设置 `draggable` 属性以支持拖拽排序。
    3.  为树节点提供自定义渲染，允许用户编辑标题、添加和删除节点（章节/文章）。
    4.  添加 "智能生成大纲" 按钮，调用 `api.generateProjectOutline()`，并用返回的数据更新树。
    5.  添加 "保存大纲" 按钮，将当前树的数据结构转换为API要求的格式，并调用 `api.saveProjectOutline()`。
*   **预期产出：**
    *   一个功能完善的大纲编辑和生成组件。

#### 步骤 5.2.3：实现 "图书/系列" -> "内容" 标签页

*   **目标：** 创建内容生成和编辑界面。
*   **操作指令：**
    1.  创建 `components/ContentEditor.vue`。
    2.  使用 `ElContainer` 实现双栏布局。
    3.  **左侧栏：** 使用 `ElTree` **只读**地显示大纲。为每个文章节点添加状态指示器图标。点击节点时，通过 `emit` 事件通知父组件加载对应文章。
    4.  **右侧栏：** 集成一个富文本编辑器（如 `tiptap` 或 `quill.js` 的Vue封装版）。显示当前选中文章的标题、摘要和内容。
    5.  添加 "生成全部内容" 按钮，调用 `api.startContentGeneration()`。需要轮询项目状态接口来更新左侧栏的状态指示器。
    6.  添加 "保存当前文章" 按钮，调用 `api.saveGeneratedProjectContent()`。
*   **预期产出：**
    *   一个完整的、可分离生成与编辑的内容工作区。

#### 步骤 5.2.4：实现 "发布" 标签页

*   **目标：** 创建一个统一的发布和下载界面。
*   **操作指令：**
    1.  创建 `components/PublishTab.vue`。
    2.  提供一个 `ElSelect` 让用户选择发布类型。
    3.  添加 "发布并生成下载文件" 按钮，调用 `api.publishProject()`。
    4.  接口成功返回后，根据响应中的文件路径，动态生成一个 `<a>` 标签或 `ElLink`，其 `href` 指向 `GET /api/download?filePath=...`。
*   **预期产出：**
    *   用户可以从UI触发项目发布并下载成品。

#### 步骤 5.2.5：实现 "模板化" 工作流标签页

*   **目标：** 完成模板化项目的特定UI。
*   **操作指令：**
    1.  **文件配置页:** 使用 `ElUpload` 组件让用户管理源文件和模板文件。
    2.  **生成页:** 提供一个 "开始生成" 按钮和一个只读的预览区域（如 `<code>` 或 `<div>`），用于展示生成结果。
*   **预期产出：**
    *   模板化项目的工作流完整可用。

#### 步骤 5.2.6：阶段性测试

*   **目标：** 验证详情页所有功能。
*   **操作指令：**
    1.  运行 `npm run dev`。
    2.  **测试用例：**
        *   打开一个 "图书" 项目，检查四个标签页是否正确。
        *   在 "大纲" 页，手动编辑、智能生成并保存大纲。
        *   在 "内容" 页，检查大纲是否同步，尝试生成内容，并编辑保存一篇文章。
        *   在 "发布" 页，尝试发布并下载。
        *   打开一个 "模板化" 项目，检查其特有的标签页和功能。
*   **预期产出：**
    *   一个功能完备、能够处理所有项目类型的项目详情页。

--- 

## 6. 国际化 (i18n)

### 6.1 阶段目标

*   为应用添加中/英双语支持。

### 6.2 具体步骤

#### 步骤 6.2.1：创建语言文件加载机制

*   **目标：** 从后端加载语言包并应用到界面。
*   **操作指令：**
    1.  在 `app.ts` Pinia store中，创建一个action `loadLanguage(lang)`。
    2.  该action调用 `api.getLocale(lang)`，并将返回的JSON对象存储在store的state中。
    3.  创建一个全局的翻译函数 `$t(key)`，它可以从store中根据key查找对应的翻译文本。可以将其挂载到Vue的全局属性上。
*   **预期产出：**
    *   一个可以动态加载和切换语言数据的系统。

#### 步骤 6.2.2：应用翻译

*   **目标：** 将界面上所有硬编码的文本替换为翻译函数调用。
*   **操作指令：**
    1.  在仪表盘和详情页的顶部导航栏添加一个语言切换器 (`ElSelect` 或 `ElDropdown`)。
    2.  当用户切换语言时，调用 `appStore.loadLanguage(selectedLang)`。
    3.  遍历所有Vue组件，将 "新建项目" 这样的硬编码字符串替换为 `$t('new_project_button')` 的形式。
*   **预期产出：**
    *   一个完全国际化的用户界面。

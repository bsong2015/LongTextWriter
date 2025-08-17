<template>
  <el-container class="content-editor-container">
    <!-- Left Sidebar: Read-only Outline Tree -->
    <el-aside width="300px" class="outline-sidebar">
      <el-tree
        :data="treeData"
        node-key="id"
        default-expand-all
        :expand-on-click-node="false"
        @node-click="handleNodeClick"
      >
        <template #default="{ node, data }">
          <span class="custom-tree-node">
            <el-icon class="node-icon">
              <Folder v-if="data.type === 'chapter'" />
              <Document v-else />
            </el-icon>
            <span>{{ node.label }}</span>
            <span v-if="data.type === 'article'" style="margin-left: 8px;">
              <el-tag :type="getStatusTagType(data.status)" size="small">{{ getStatusLabel(data.status) }}</el-tag>
            </span>
          </span>
        </template>
      </el-tree>
    </el-aside>

    <!-- Right Main Content: Editor and Actions -->
    <el-main class="editor-main">
      <div class="editor-actions">
        <el-button type="primary" @click="generateAllContent">生成全部内容</el-button>
        <el-button type="success" @click="saveCurrentArticle">保存当前文章</el-button>
      </div>

      <div class="article-editor-area">
        <template v-if="selectedArticle">
          <h2>{{ selectedArticle.title }}</h2>
          <p class="article-summary">{{ selectedArticle.summary }}</p>
        </template>
        <template v-else>
          <h2>请选择文章</h2>
          <p class="article-summary">请从左侧大纲中选择一篇文章进行编辑。</p>
        </template>

        <!-- Rich Text Editor is now always present -->
        <div class="rich-text-editor-wrapper">
          <QuillEditor
            ref="quillEditor"
            theme="snow"
            toolbar="full"
            contentType="html"
            :read-only="false"
            @textChange="onEditorChange"
          />
        </div>
      </div>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, onBeforeUnmount } from 'vue';
import { ElMessage } from 'element-plus';
import { startContentGeneration, saveGeneratedProjectContent } from '../services/api.ts';
import type { BookProject, SeriesProject, GeneratedContent, BookOutline } from '../../../src/types';
import {
  Folder,
  Document,
} from '@element-plus/icons-vue';

// Quill imports
import { QuillEditor } from '@vueup/vue-quill';
import 'quill/dist/quill.snow.css'; // Corrected Quill CSS import
import '../assets/quill-dark-mode.css'; // Import custom dark mode styles for Quill

interface ContentEditorProps {
  project: BookProject | SeriesProject;
  generatedContent?: GeneratedContent; // Initial generated content data
}

const props = defineProps<ContentEditorProps>();
const emit = defineEmits(['update:generatedContent', 'save']);

const treeData = ref<any[]>([]);
const selectedArticle = ref<any | null>(null); // Currently selected article for editing

// Quill editor ref
const quillEditor = ref<any>(null);

// Watch selectedArticle to update editor content
watch(selectedArticle, (newArticle) => {
  if (quillEditor.value) {
    if (newArticle) {
      // Set content when article changes
      quillEditor.value.setHTML(newArticle.content || '');
    } else {
      // Clear editor when no article is selected
      quillEditor.value.setHTML('');
    }
  }
}, { immediate: true });

// Handle content change from Quill
const onEditorChange = () => {
  if (selectedArticle.value && quillEditor.value) {
    selectedArticle.value.content = quillEditor.value.getHTML();
  }
};

// Convert GeneratedContent to ElTree data format
const convertContentToTreeData = (content: GeneratedContent) => {
  if (!content) return [];
  return content.chapters.map((chapter, chapterIndex) => ({
    id: `chapter-${chapterIndex}`,
    label: chapter.title,
    type: 'chapter',
    children: chapter.articles.map((article, articleIndex) => ({
      id: `article-${chapterIndex}-${articleIndex}`,
      label: article.title,
      type: 'article',
      status: article.status,
      content: article.content,
      summary: article.summary,
      chapterIndex, // Add chapterIndex
      articleIndex, // Add articleIndex
    })),
  }));
};

// Convert BookOutline to ElTree data format for content editor
const convertOutlineToTreeDataForContent = (outline: BookOutline) => {
  if (!outline) return [];
  return outline.chapters.map((chapter, chapterIndex) => ({
    id: `chapter-${chapterIndex}`,
    label: chapter.title,
    type: 'chapter',
    children: chapter.articles.map((article, articleIndex) => ({
      id: `article-${chapterIndex}-${articleIndex}`,
      label: article.title,
      type: 'article',
      status: 'pending',
      content: '',
      summary: '',
      chapterIndex,
      articleIndex,
    })),
  }));
};

// Initialize treeData when props change
watch(() => [props.generatedContent, props.project], ([newContent, newProject]) => {
  if (newContent && newContent.chapters.length > 0) {
    treeData.value = convertContentToTreeData(newContent);
  } else if (newProject?.outline?.chapters?.length > 0) {
    // If there's no content but there is an outline, build tree from outline
    treeData.value = convertOutlineToTreeDataForContent(newProject.outline);
  } else {
    treeData.value = [];
  }
}, { immediate: true, deep: true });


// --- Tree Node Operations ---
const handleNodeClick = (data: any) => {
  if (data.type === 'article') {
    // Use a deep copy to prevent direct mutation before saving
    selectedArticle.value = JSON.parse(JSON.stringify(data));
  }
};

const getStatusTagType = (status: string) => {
  switch (status) {
    case 'done': return 'success';
    case 'writing': return 'warning';
    case 'error': return 'danger';
    case 'pending': return 'info';
    default: return '';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'done': return '完成';
    case 'writing': return '生成中';
    case 'error': return '错误';
    case 'pending': return '待生成';
    default: return '未知';
  }
};

// --- API Calls ---
const generateAllContent = async () => {
  if (!props.project) {
    ElMessage.warning('请先选择一个项目。');
    return;
  }
  try {
    await startContentGeneration(props.project.name);
    ElMessage.success('内容生成已开始！');
    // TODO: Implement polling for project status to update UI
  } catch (error: any) {
    console.error('内容生成失败:', error);
    ElMessage.error(`内容生成失败: ${error.message || '未知错误'}`);
  }
};

const saveCurrentArticle = async () => {
  if (!props.project || !selectedArticle.value) {
    ElMessage.warning('请选择一篇文章进行保存。');
    return;
  }

  const { chapterIndex, articleIndex, content } = selectedArticle.value;

  // Create a deep copy of the generatedContent to modify
  const updatedContent = JSON.parse(JSON.stringify(props.generatedContent));

  // Directly update the content using indices
  if (updatedContent.chapters[chapterIndex] && updatedContent.chapters[chapterIndex].articles[articleIndex]) {
    updatedContent.chapters[chapterIndex].articles[articleIndex].content = content;
  } else {
    ElMessage.error('无法找到要保存的文章，请刷新后重试。');
    return;
  }

  try {
    await saveGeneratedProjectContent(props.project.name, updatedContent);
    ElMessage.success('文章保存成功！');

    // Also update the local treeData to reflect the change immediately
    const node = treeData.value[chapterIndex]?.children[articleIndex];
    if (node) {
      node.content = content;
    }
    
    emit('save'); // Notify parent that content has been saved
  } catch (error: any) {
    console.error('文章保存失败:', error);
    ElMessage.error(`文章保存失败: ${error.message || '未知错误'}`);
  }
};
</script>

<style scoped>
.content-editor-container {
  height: calc(100vh - 200px); /* Adjust height as needed */
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  overflow: hidden;
}

.custom-tree-node {
  width: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  overflow: hidden;
  padding: 4px 8px;
}

.node-icon {
  margin-right: 8px;
  font-size: 16px;
}

.outline-sidebar {
  padding: 20px;
  border-right: 1px solid var(--el-border-color-light);
  overflow-y: auto;
}

.editor-main {
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.editor-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.article-editor-area {
  flex-grow: 1;
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  padding: 15px;
  overflow-y: auto;
}

.article-editor-area h2 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 20px;
  color: #303133;
}

.article-summary {
  font-size: 14px;
  color: #606266;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px dashed var(--el-border-color-lighter);
}

.rich-text-editor-wrapper {
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  padding: 10px;
  min-height: 200px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.editor-toolbar {
  margin-bottom: 10px;
  border-bottom: 1px solid var(--el-border-color-light);
  padding-bottom: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.editor-toolbar .el-button.is-active {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

/* Basic TipTap editor styles */
.ProseMirror {
  min-height: 180px; /* Adjust as needed */
  outline: none;
  padding: 5px;
  flex-grow: 1;
  color: black; /* Set text color to black for visibility test */
}

.ProseMirror p:first-child {
  margin-top: 0;
}
.ProseMirror p:last-child {
  margin-bottom: 0;
}

/* Styles for TipTap generated content */
.ProseMirror p {
  margin: 0 0 1em 0;
}

.ProseMirror h1,
.ProseMirror h2,
.ProseMirror h3,
.ProseMirror h4,
.ProseMirror h5,
.ProseMirror h6 {
  margin-top: 1.2em;
  margin-bottom: 0.8em;
  font-weight: bold;
  line-height: 1.2;
}

.ProseMirror h1 { font-size: 2em; }
.ProseMirror h2 { font-size: 1.5em; }
.ProseMirror h3 { font-size: 1.17em; }
.ProseMirror h4 { font-size: 1em; }
.ProseMirror h5 { font-size: 0.83em; }
.ProseMirror h6 { font-size: 0.67em; }

.ProseMirror ul,
.ProseMirror ol {
  margin: 1em 0;
  padding-left: 2em;
}

.ProseMirror ul li,
.ProseMirror ol li {
  margin-bottom: 0.5em;
}

.ProseMirror code {
  background-color: rgba(9, 10, 11, 0.05);
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: monospace;
  font-size: 0.9em;
}

.ProseMirror pre {
  background: #0d0d0d;
  color: #fff;
  font-family: 'JetBrainsMono', monospace;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
}

.ProseMirror pre code {
  color: inherit;
  padding: 0;
  background: none;
  font-size: 0.8em;
}

.ProseMirror blockquote {
  padding-left: 1em;
  border-left: 3px solid #ccc;
  margin-left: 0;
  margin-right: 0;
}

.ProseMirror hr {
  border: none;
  border-top: 1px solid #ccc;
  margin: 1em 0;
}

.ProseMirror strong {
  font-weight: bold;
}

.ProseMirror em {
  font-style: italic;
}

.ProseMirror s {
  text-decoration: line-through;
}

.ql-editor {
  min-height: 180px; /* Adjust as needed */
  outline: none;
  padding: 5px;
  flex-grow: 1;
  color: var(--color-text); /* Set text color to use theme variable */
}

.ql-editor p { /* Target paragraphs inside the editor */
  color: var(--color-text); /* Set text color to use theme variable */
}


</style>
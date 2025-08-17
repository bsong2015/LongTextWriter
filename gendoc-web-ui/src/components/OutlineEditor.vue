<template>
  <div class="outline-editor-wrapper">
    <el-card class="outline-editor-card">
      <template #header>
        <div class="card-header-actions">
          <el-button type="primary" @click="generateOutline">智能生成大纲</el-button>
          <el-button type="success" @click="saveOutline">保存大纲</el-button>
          <el-button type="default" @click="addChapter">添加章节</el-button>
        </div>
      </template>

      <el-tree
        :data="treeData"
        node-key="id"
        default-expand-all
        draggable
        :allow-drop="allowDrop"
        :allow-drag="allowDrag"
        @node-drop="handleDrop"
        class="outline-tree"
      >
        <template #default="{ node, data }">
          <span class="custom-tree-node">
            <el-icon class="node-icon">
              <Folder v-if="data.type === 'chapter'" />
              <Document v-else />
            </el-icon>

            <span v-if="!data.editing" :key="data.id + '-label'" class="node-label">{{ node.label }}</span>
            <el-input
              v-else
              :key="data.id + '-input'"
              v-model="data.label"
              @blur="finishEditing(data)"
              @keyup.enter="finishEditing(data)"
              size="small"
              class="node-edit-input"
            />

            <span class="node-actions">
              <el-button :icon="Plus" @click.stop="addArticle(data)" circle size="small" title="添加文章" />
              <el-dropdown @command="handleCommand" trigger="click">
                <el-button :icon="MoreFilled" @click.stop circle size="small" title="更多操作" />
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item :command="{ action: 'rename', node: node, data: data }">重命名</el-dropdown-item>
                    <el-dropdown-item :command="{ action: 'delete', node: node, data: data }" divided>删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </span>
          </span>
        </template>
      </el-tree>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { ElMessage, ElTree } from 'element-plus';
import { generateProjectOutline, saveProjectOutline } from '../services/api.ts';
import type { BookOutline, BookProject, SeriesProject } from '../../../src/types';
import {
  Folder,
  Document,
  Plus,
  MoreFilled
} from '@element-plus/icons-vue';

interface OutlineEditorProps {
  project: BookProject | SeriesProject;
  outline?: BookOutline; // Initial outline data
}

const props = defineProps<OutlineEditorProps>();
const emit = defineEmits(['update:outline', 'save']);

const treeData = ref<any[]>([]); // Will store the ElTree compatible data

// Convert BookOutline to ElTree data format
const convertOutlineToTreeData = (outline: BookOutline) => {
  if (!outline) return [];
  return outline.chapters.map((chapter, chapterIndex) => ({
    id: `chapter-${chapterIndex}-${Date.now()}`,
    label: chapter.title,
    type: 'chapter',
    editing: false,
    children: chapter.articles.map((article, articleIndex) => ({
      id: `article-${chapterIndex}-${articleIndex}-${Date.now()}`,
      label: article.title,
      type: 'article',
      editing: false,
    })),
  }));
};

// Convert ElTree data format back to BookOutline
const convertTreeDataToOutline = (data: any[]): BookOutline => {
  return {
    title: props.project.outline?.title || props.project.name,
    chapters: data.map(chapterNode => ({
      title: chapterNode.label,
      articles: chapterNode.children ? chapterNode.children.map((articleNode: any) => ({
        title: articleNode.label,
      })) : [],
    })),
  };
};

// Initialize treeData when outline prop changes
watch(() => props.outline, (newOutline) => {
  if (newOutline) {
    treeData.value = convertOutlineToTreeData(newOutline);
  }
}, { immediate: true });

// --- Tree Node Operations ---
let nodeId = 0;

const generateUniqueId = (type: 'chapter' | 'article') => {
  return `${type}-${nodeId++}-${Date.now()}`;
};

const addChapter = () => {
  const newChapter = {
    id: generateUniqueId('chapter'),
    label: '新章节',
    type: 'chapter',
    editing: false,
    children: [],
  };
  treeData.value.push(newChapter);
  ElMessage.success('新章节已添加。');
};

const addArticle = (nodeData: any) => {
  // Articles can only be added to chapters
  if (nodeData.type !== 'chapter') {
    ElMessage.info('请在章节节点上添加文章');
    return;
  }
  const newArticle = {
    id: generateUniqueId('article'),
    label: '新文章',
    type: 'article',
    editing: false,
  };
  if (!nodeData.children) {
    nodeData.children = [];
  }
  nodeData.children.push(newArticle);
  treeData.value = [...treeData.value];
  ElMessage.success('新文章已添加。');
};

const removeNode = (node: any, data: any) => {
  const parent = node.parent;
  const children = parent.data.children || parent.data;
  const index = children.findIndex((d: any) => d.id === data.id);
  children.splice(index, 1);
  treeData.value = [...treeData.value];
  ElMessage.success('节点已删除。');
};

const startEditing = (data: any) => {
  data.editing = true;
};

const finishEditing = (data: any) => {
  data.editing = false;
};

// Handler for the dropdown menu commands
const handleCommand = (command: { action: string; node: any; data: any }) => {
  switch (command.action) {
    case 'rename':
      startEditing(command.data);
      break;
    case 'delete':
      removeNode(command.node, command.data);
      break;
  }
};

const allowDrop = (draggingNode: any, dropNode: any, type: string) => {
  if (draggingNode.data.type === 'article') {
    if (dropNode.data.type === 'chapter' && type === 'inner') return true;
    if (dropNode.data.type === 'article' && (type === 'before' || type === 'after')) return true;
  }
  if (draggingNode.data.type === 'chapter' && dropNode.data.type === 'chapter' && (type === 'before' || type === 'after')) {
    return true;
  }
  return false;
};

const allowDrag = (draggingNode: any) => {
  return true;
};

const handleDrop = () => {
  const newOutline = convertTreeDataToOutline(treeData.value);
  emit('update:outline', newOutline);
};

// --- API Calls ---
const generateOutline = async () => {
  if (!props.project) {
    ElMessage.warning('请先选择一个项目。');
    return;
  }
  try {
    const response = await generateProjectOutline(props.project.name, true);
    treeData.value = convertOutlineToTreeData(response.outline);
    emit('update:outline', response.outline);
    ElMessage.success('大纲生成成功！');
  } catch (error: any) {
    console.error('大纲生成失败:', error);
    ElMessage.error(`大纲生成失败: ${error.message || '未知错误'}`);
  }
};

const saveOutline = async () => {
  if (!props.project || !treeData.value.length) {
    ElMessage.warning('没有大纲数据可保存。');
    return;
  }
  try {
    const outlineToSave = convertTreeDataToOutline(treeData.value);
    await saveProjectOutline(props.project.name, outlineToSave);
    ElMessage.success('大纲保存成功！');
    emit('save');
  } catch (error: any) {
    console.error('大纲保存失败:', error);
    ElMessage.error(`大纲保存失败: ${error.message || '未知错误'}`);
  }
};
</script>

<style scoped>
.outline-editor-wrapper {
  height: 65vh;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.outline-editor-card {
  width: 100%;
  box-sizing: border-box;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  min-width: 100%
}

.outline-tree {
  width: 100%;
  box-sizing: border-box;
  display: table;
  table-layout: fixed;
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

.node-label {
  flex-grow: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.node-edit-input {
  flex-grow: 1;
}

.node-actions {
  margin-left: auto;
  padding-left: 10px;
  display: flex;
  align-items: center;
  gap: 5px;
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
}

.custom-tree-node:hover .node-actions {
  opacity: 1;
}

.card-header-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
<template>
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
    >
      <template #default="{ node, data }">
        <span class="custom-tree-node">
          <span v-if="!data.editing" @dblclick="startEditing(data)">{{ node.label }}</span>
          <el-input
            v-else
            v-model="data.label"
            @blur="finishEditing(data)"
            @keyup.enter="finishEditing(data)"
            size="small"
            class="node-edit-input"
          />
          <span style="margin-left: auto;"> <!-- Added margin-left: auto -->
            <el-button
              v-if="data.type === 'chapter'"
              type="text"
              size="small"
              @click="addArticle(data)"
            >
              添加文章
            </el-button>
            <el-button
              type="text"
              size="small"
              @click="removeNode(node, data)"
            >
              删除
            </el-button>
          </span>
        </span>
      </template>
    </el-tree>
  </el-card>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { ElMessage, ElTree } from 'element-plus';
import { generateProjectOutline, saveProjectOutline } from '../services/api.ts';
import type { BookOutline, BookProject, SeriesProject } from '../../../src/types';

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
    id: `chapter-${chapterIndex}-${Date.now()}`, // Add timestamp for uniqueness
    label: chapter.title,
    type: 'chapter',
    editing: false, // Add editing state
    children: chapter.articles.map((article, articleIndex) => ({
      id: `article-${chapterIndex}-${articleIndex}-${Date.now()}`, // Add timestamp for uniqueness
      label: article.title,
      type: 'article',
      editing: false, // Add editing state
    })),
  }));
};

// Convert ElTree data format back to BookOutline
const convertTreeDataToOutline = (data: any[]): BookOutline => {
  return {
    title: props.project.outline?.title || props.project.name, // Use existing title or project name
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
let nodeId = 0; // For new nodes, will be incremented

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

const addArticle = (chapterData: any) => {
  const newArticle = {
    id: generateUniqueId('article'),
    label: '新文章',
    type: 'article',
    editing: false,
  };
  if (!chapterData.children) {
    chapterData.children = [];
  }
  chapterData.children.push(newArticle);
  treeData.value = [...treeData.value]; // Force update
  ElMessage.success('新文章已添加。');
};

const removeNode = (node: any, data: any) => {
  const parent = node.parent;
  const children = parent.data.children || parent.data;
  const index = children.findIndex((d: any) => d.id === data.id);
  children.splice(index, 1);
  treeData.value = [...treeData.value]; // Force update
  ElMessage.success('节点已删除。');
};

const startEditing = (data: any) => {
  data.editing = true;
};

const finishEditing = (data: any) => {
  data.editing = false;
  // Optionally, trigger a save or update parent here if needed
  // For now, changes are reflected in treeData.value
};

const allowDrop = (draggingNode: any, dropNode: any, type: string) => {
  // Allow dropping articles into chapters or other articles
  if (draggingNode.data.type === 'article') {
    if (dropNode.data.type === 'chapter' && type === 'inner') {
      return true; // Article into chapter
    }
    if (dropNode.data.type === 'article' && (type === 'before' || type === 'after')) {
      return true; // Article before/after another article
    }
  }
  // Allow dropping chapters before/after other chapters
  if (draggingNode.data.type === 'chapter' && dropNode.data.type === 'chapter' && (type === 'before' || type === 'after')) {
    return true;
  }
  return false;
};

const allowDrag = (draggingNode: any) => {
  return true; // All nodes can be dragged
};

const handleDrop = (draggingNode: any, dropNode: any, dropType: string, ev: any) => {
  // ElTree handles the data manipulation internally for drag and drop
  // We just need to ensure treeData.value is updated to reflect the new order
  // For simplicity, we'll re-convert the tree data to outline and emit
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
    const response = await generateProjectOutline(props.project.name, true); // Overwrite existing
    treeData.value = convertOutlineToTreeData(response.outline);
    emit('update:outline', response.outline); // Update parent's outline prop
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
    emit('save'); // Notify parent that outline has been saved
  } catch (error: any) {
    console.error('大纲保存失败:', error);
    ElMessage.error(`大纲保存失败: ${error.message || '未知错误'}`);
  }
};
</script>

<style scoped>
.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  /* justify-content: space-between; */ /* Removed */
  font-size: 14px;
  padding-right: 8px;
}

.outline-editor-card {
  margin-top: 20px;
}

.card-header-actions {
  display: flex;
  justify-content: flex-end; /* Align buttons to the right */
  gap: 10px; /* Space between buttons */
}

.node-edit-input {
  width: 150px; /* Adjust as needed */
}
</style>
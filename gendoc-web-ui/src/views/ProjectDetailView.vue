<template>
  <el-container class="project-detail-container">
    <el-header class="detail-header">
      <el-button :icon="ArrowLeft" circle @click="goBack" />
      <h1 class="project-title">{{ project?.name || 'Loading...' }}</h1>
    </el-header>

    <el-main class="detail-main">
      <el-tabs v-if="project" v-model="activeTab" class="project-tabs">
        <!-- Tabs for Book/Series Projects -->
        <template v-if="project.type === 'book' || project.type === 'series'">
          <el-tab-pane label="大纲" name="outline">
            <OutlineEditor
              v-if="project && (project.type === 'book' || project.type === 'series')"
              :project="project"
              :outline="project.outline"
              @update:outline="project.outline = $event"
              @save="fetchProjectDetails"
            />
          </el-tab-pane>
          <el-tab-pane label="内容" name="content"></el-tab-pane>
          <el-tab-pane label="发布" name="publish"></el-tab-pane>
        </template>

        <!-- Tabs for Templated Projects -->
        <template v-else-if="project.type === 'templated'">
          <el-tab-pane label="文件" name="files"></el-tab-pane>
          <el-tab-pane label="生成" name="generate"></el-tab-pane>
          <el-tab-pane label="发布" name="publish"></el-tab-pane>
        </template>
      </el-tabs>

      <div v-else class="loading-state">
        <el-spinner size="large" />
        <p>Loading project details...</p>
      </div>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getProjectDetails } from '../services/api.ts';
import type { ProjectDetail } from '../../../src/types';
import { ElMessage } from 'element-plus';
import { ArrowLeft } from '@element-plus/icons-vue';
import OutlineEditor from '../components/OutlineEditor.vue';

const route = useRoute();
const router = useRouter();
const projectName = route.params.projectName as string;

const project = ref<ProjectDetail | null>(null);
const activeTab = ref('outline'); // Default tab for book/series

async function fetchProjectDetails() {
  try {
    project.value = await getProjectDetails(projectName);
    // Set default tab based on project type if needed
    if (project.value?.type === 'templated') {
      activeTab.value = 'files';
    }
  } catch (error) {
    console.error('Failed to fetch project details:', error);
    let errorMessage = '未知错误';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    ElMessage.error(`获取项目详情失败: ${errorMessage}`);
    router.push('/'); // Go back to dashboard on error
  }
}

function goBack() {
  router.push('/');
}

onMounted(() => {
  fetchProjectDetails();
});
</script>

<style scoped>
.project-detail-container {
  padding: 24px;
  background-color: #f0f2f5;
  min-height: 100vh;
}

.detail-header {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  padding: 0 20px;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}

.project-title {
  font-size: 28px;
  font-weight: bold;
  margin-left: 20px;
  color: #303133;
}

.detail-main {
  padding: 0 20px;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}

.project-tabs {
  margin-top: 20px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: #909399;
}
</style>
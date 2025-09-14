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
              v-if="project"
              :project="project"
              :outline="project.outline"
              :readonly="isOutlineLocked"
              @update:outline="project.outline = $event"
              @save="fetchProjectDetails"
              @request-edit="handleRequestEditOutline"
            />
          </el-tab-pane>
          
          <el-tab-pane v-if="hasOutline" label="内容" name="content">
            <!-- Generation Progress View -->
            <div v-if="isGenerating" class="generation-view">
              <h3>正在生成内容...</h3>
              <el-progress
                :text-inside="true"
                :stroke-width="24"
                :percentage="generationPercentage"
                status="success"
              />
              <p>{{ generationStatusText }}</p>
            </div>

            <!-- Content View (Editor or Initial Start) -->
            <div v-else>
              <!-- If content exists (partially or fully generated) -->
              <div v-if="hasContent">
                <!-- Add a continue button if not fully generated -->
                <div v-if="isResumable" class="generation-view" style="margin-bottom: 20px;">
                  <h3>内容生成已暂停</h3>
                  <p>已完成 {{ generationPercentage }}%。点击下面的按钮继续生成剩余内容。</p>
                  <el-button type="primary" size="large" @click="startGeneration" :loading="isGenerating">
                    继续生成内容
                  </el-button>
                </div>
                <ContentEditor
                  v-if="project"
                  :project="project"
                  :generated-content="generatedContent"
                  @update:generated-content="generatedContent = $event"
                  @save="fetchProjectDetails"
                />
              </div>

              <!-- Initial Generation Start View -->
              <div v-else class="generation-view">
                <h3>内容尚未生成</h3>
                <p>点击下面的按钮开始自动生成项目的全部内容。</p>
                <el-button type="primary" size="large" @click="startGeneration" :loading="isGenerating">
                  开始生成内容
                </el-button>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane v-if="hasContent" label="发布" name="publish">
            <PublishTab
              v-if="project"
              :project-name="project.name"
              :project-type="project.type"
            />
          </el-tab-pane>
        </template>

        <!-- Tabs for Templated Projects -->
        <template v-else-if="project.type === 'templated'">
          <el-tab-pane label="文件" name="files"></el-tab-pane>
          <el-tab-pane label="生成" name="generate"></el-tab-pane>
          <el-tab-pane label="发布" name="publish">
            <PublishTab
              v-if="project"
              :project-name="project.name"
              :project-type="project.type"
            />
          </el-tab-pane>
        </template>
      </el-tabs>

      <div v-else class="loading-state">
        <el-icon :size="30" class="is-loading"><Loading /></el-icon>
        <p>Loading project details...</p>
      </div>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getProjectDetails, getGeneratedProjectContent, startContentGeneration as apiStartGeneration } from '../services/api';
import type { ProjectDetail, GeneratedContent } from '@gendoc/shared';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowLeft, Loading } from '@element-plus/icons-vue';
import OutlineEditor from '../components/OutlineEditor.vue';
import ContentEditor from '../components/ContentEditor.vue';
import PublishTab from '../components/PublishTab.vue';

const route = useRoute();
const router = useRouter();
const projectName = route.params.projectName as string;

const project = ref<ProjectDetail | null>(null);
const generatedContent = ref<GeneratedContent | undefined>(undefined);
const activeTab = ref('outline');

const isGenerating = ref(false);
const pollingInterval = ref<number | null>(null);

// --- Computed Properties for UI ---

const hasOutline = computed(() => {
  return project.value?.outline?.chapters?.some(c => c.title.trim() !== '');
});

const hasContent = computed(() => !!generatedContent.value);

const isOutlineLocked = computed(() => {
  return hasContent.value || isGenerating.value;
});

const generationPercentage = computed(() => {
  if (project.value?.generationStatus === 'completed') {
    return 100; // If completed, show 100%
  }
  if (project.value?.status.type === 'progress') {
    return project.value.status.percentage || 0;
  }
  return 0;
});

const generationStatusText = computed(() => {
  if (project.value?.status.type === 'progress') {
    return `已完成 ${project.value.status.done} / ${project.value.status.total}`;
  }
  return '';
});

const isResumable = computed(() => {
  if (!project.value) return false;

  // Condition 1: Backend explicitly says it's in progress and not 100%
  const backendInProgress = project.value.status.type === 'progress' && project.value.status.percentage < 100;

  // Condition 2: Heuristic for a paused state after restart
  // If backend says idle, but we have some content and it's not 100% complete
  const heuristicPaused = project.value.status.type === 'idle' && hasContent.value && generationPercentage.value < 100;

  return backendInProgress || heuristicPaused;
});

// --- Core Methods ---

async function fetchProjectDetails() {
  try {
    project.value = await getProjectDetails(projectName);
    if (project.value && (project.value.type === 'book' || project.value.type === 'series')) {
      const content = await getGeneratedProjectContent(projectName);
      if (content && content.chapters.length > 0) {
        generatedContent.value = content;
      } else {
        generatedContent.value = undefined;
      }
    }
    if (project.value?.type === 'templated') {
      activeTab.value = 'files';
    }
  } catch (error) {
    handleFetchError(error, '获取项目详情失败');
    router.push('/'); // Go back to dashboard on error
  }
}

async function startGeneration() {
  try {
    await apiStartGeneration(projectName);
    ElMessage.success('内容生成已开始！');
    isGenerating.value = true;
    startPolling();
  } catch (error) {
    handleFetchError(error, '启动内容生成失败');
  }
}

async function handleRequestEditOutline() {
  try {
    await ElMessageBox.confirm(
      '修改大纲将会清空所有已生成的内容，并需要重新生成。是否继续？',
      '确认操作',
      {
        confirmButtonText: '继续',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );

    // User confirmed.
    generatedContent.value = undefined;

    if (isGenerating.value) {
      stopPolling();
      isGenerating.value = false;
    }
    
    // There is no API to delete content on the server, clearing the frontend is enough to unlock the UI.
    // The backend content will be overwritten on next generation.
    ElMessage.success('大纲已解锁。您可以重新编辑，保存后即可再次生成内容。');

  } catch (error) {
    // User cancelled the dialog, do nothing.
    ElMessage.info('操作已取消。');
  }
}

// --- Polling Logic ---

function startPolling() {
  if (pollingInterval.value) return; // Already polling
  pollingInterval.value = window.setInterval(async () => {
    await fetchProjectDetails();
    if (generationPercentage.value === 100) {
      stopPolling();
      isGenerating.value = false;
      ElMessage.success('内容生成已完成！');
      // Fetch final content one last time
      await fetchProjectDetails();
    }
  }, 3000); // Poll every 3 seconds
}

function stopPolling() {
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value);
    pollingInterval.value = null;
  }
}

// --- Helper & Lifecycle ---

function handleFetchError(error: any, message: string) {
  console.error(`${message}:`, error);
  let errorMessage = '未知错误';
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  }
  ElMessage.error(`${message}: ${errorMessage}`);
}

function goBack() {
  router.push('/');
}

onMounted(async () => {
  await fetchProjectDetails();
  // If generation was explicitly running on component mount, start polling
  // The backend's generationStatus is the source of truth for active generation
  if (project.value?.generationStatus === 'running' && project.value.status.percentage < 100) {
    isGenerating.value = true;
    startPolling();
  }
});

onUnmounted(() => {
  stopPolling();
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

/* Force the tab header to align to the left */
.project-tabs :deep(.el-tabs__nav-wrap) {
  justify-content: flex-start;
}

/* --- FIX FOR CONTENT SHRINKING --- */
/* This ensures the content area itself is not centering its children */
.project-tabs :deep(.el-tabs__content) {
  text-align: left;
}

/* This ensures the tab panel takes up the full width */
.project-tabs :deep(.el-tab-pane) {
  width: 100%;
  display: block;
}
/* --- END FIX --- */

.generation-view h3,
.generation-view p {
  color: var(--el-text-color-primary);
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
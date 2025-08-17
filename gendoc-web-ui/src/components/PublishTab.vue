<template>
  <div class="publish-tab-wrapper">
    <el-card class="publish-card">
      <template #header>
        <div class="card-header">
          <span>发布项目</span>
        </div>
      </template>

      <el-form :model="publishForm" label-width="120px" class="publish-form">
        <el-form-item label="生成文件">
          <el-space>
            <el-button type="primary" @click="handlePublish('single')" :loading="isPublishing">
              {{ isPublishing ? '生成中...' : '生成单个文件' }}
            </el-button>
            <el-button type="primary" @click="handlePublish('multiple')" :loading="isPublishing">
              {{ isPublishing ? '生成中...' : '生成多个文件 (Zip)' }}
            </el-button>
          </el-space>
        </el-form-item>
      </el-form>

      <div v-if="downloadLink" class="download-section">
        <p>发布成功！点击下载文件：</p>
        <el-link :href="downloadLink" type="primary" :icon="Download" target="_blank">
          下载文件
        </el-link>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { Download } from '@element-plus/icons-vue';
import { publishProject, downloadFile } from '../services/api.ts';

const props = defineProps<{
  projectName: string;
  projectType: 'book' | 'series' | 'templated'; // Not strictly used yet, but good to have
}>();

const isPublishing = ref(false);
const downloadLink = ref<string | null>(null);

async function handlePublish(buttonType: 'single' | 'multiple') {
  isPublishing.value = true;
  downloadLink.value = null; // Reset download link on new publish attempt

  let publishTypeToSend: string;

  if (props.projectType === 'series') {
    if (buttonType === 'single') {
      publishTypeToSend = 'single-markdown';
    } else { // buttonType === 'multiple'
      publishTypeToSend = 'multiple-markdown-zip';
    }
  } else {
    // For 'book' and 'templated' projects, the backend currently ignores publishType
    // and always produces a single markdown. So, we can send 'single' or 'single-markdown'
    // It doesn't strictly matter for these types, but 'single' is more generic.
    // However, to be safe and consistent with the series type, let's send 'single-markdown'
    // if the button is 'single', and throw an error if 'multiple' is clicked for these types.
    if (buttonType === 'single') {
      publishTypeToSend = 'single-markdown';
    } else { // buttonType === 'multiple'
      // For book and templated projects, 'multiple' is not supported by backend's publishProject
      ElMessage.error('当前项目类型不支持生成多个文件。');
      isPublishing.value = false;
      return;
    }
  }

  console.log(`Attempting to publish project: ${props.projectName} with type: ${publishTypeToSend}`);

  try {
    const result = await publishProject(props.projectName, publishTypeToSend);
    ElMessage.success(result.message || '项目发布成功！');
    downloadLink.value = `/api/download?filePath=${encodeURIComponent(result.filePath)}`;
  } catch (error) {
    console.error('发布失败:', error);
    let errorMessage = '未知错误';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    ElMessage.error(`项目发布失败: ${errorMessage}`);
  } finally {
    isPublishing.value = false;
  }
}
</script>

<style scoped>
.publish-tab-wrapper {
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.publish-card {
  width: 100%;  
  box-sizing: border-box;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 100%;
}

.card-header span {
  font-size: 18px;
  font-weight: bold;
}

.publish-form {
  width: 100%;
  display: table;
  table-layout: fixed;
}

.download-section {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.download-section p {
  margin-bottom: 10px;
  font-size: 16px;
  color: #555;
}
</style>

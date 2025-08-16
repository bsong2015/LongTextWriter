<template>
  <el-container class="project-list-container">
    <!-- 优化的顶部操作栏 -->
    <el-header class="page-header">
      <h1 class="page-title">GenDoc</h1>
      <el-button type="primary" @click="showNewProjectDialog = true">+ 新建项目</el-button>
    </el-header>

    <el-main class="project-main-content">
      <!-- 空状态处理 -->
      <el-empty
        v-if="!projects || projects.length === 0"
        description="您还没有任何项目"
      >
        <el-button type="primary" @click="showNewProjectDialog = true">立即创建</el-button>
      </el-empty>

      <!-- 使用栅格系统进行响应式布局 -->
      <el-row v-else :gutter="24">
        <el-col
          v-for="project in projects"
          :key="project.name"
          :xl="6"
          :lg="6"
          :md="8"
          :sm="12"
          :xs="24"
          class="project-col"
        >
          <!-- 使用 el-card 美化卡片 -->
          <el-card class="project-card" shadow="hover" @click="navigateToProject(project.name)">
            <!-- 卡片头部：标题和操作 -->
            <template #header>
              <div class="card-header">
                <div class="project-title-group">
                  <el-icon class="project-icon" :size="20">
                    <component :is="getProjectIcon(project.type)" />
                  </el-icon>
                  <span class="project-name">{{ project.name }}</span>
                </div>
                <el-popconfirm
                  title="确定要删除这个项目吗？"
                  confirm-button-text="确定"
                  cancel-button-text="取消"
                  @confirm.stop="handleDeleteProject(project.name)"
                  @cancel.stop
                >
                  <template #reference>
                    <el-button
                      class="delete-button"
                      type="danger"
                      :icon="ElIconDelete"
                      size="small"
                      circle
                      @click.stop
                    />
                  </template>
                </el-popconfirm>
              </div>
            </template>

            <!-- 卡片主体：内容预览 (暂时省略 el-image) -->
            <div class="card-body">
              <el-tag size="small" :type="getProjectTypeTagType(project.type)">{{ getProjectTypeLabel(project.type) }}</el-tag>
            </div>

            <!-- 卡片底部：元信息 -->
            <div class="card-footer">
              <span>创建于：{{ new Date(project.createdAt).toLocaleDateString() }}</span>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-main>

    <!-- New Project Dialog -->
    <el-dialog v-model="showNewProjectDialog" title="新建项目" width="600px" @close="resetForm">
      <el-steps :active="activeStep" finish-status="success" simple style="margin-bottom: 20px">
        <el-step title="选择类型" />
        <el-step title="填写信息" />
      </el-steps>

      <el-form :model="form" ref="formRef" label-width="120px">
        <!-- Step 1: Select Type -->
        <div v-if="activeStep === 0">
          <el-form-item label="项目类型">
            <el-radio-group v-model="form.type">
              <el-radio-button label="book">📖 图书</el-radio-button>
              <el-radio-button label="series">📚 系列文章</el-radio-button>
              <el-radio-button label="templated">📄 模板化文档</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </div>

        <!-- Step 2: Fill Info -->
        <div v-if="activeStep === 1">
          <el-form-item label="项目名称" prop="name" :rules="{ required: true, message: '项目名称不能为空', trigger: 'blur' }">
            <el-input v-model="form.name"></el-input>
          </el-form-item>

          <!-- Fields for Book/Series -->
          <template v-if="form.type === 'book' || form.type === 'series'">
            <el-form-item label="写作语言">
              <el-select v-model="form.idea.language">
                <el-option label="中文" value="zh-CN"></el-option>
                <el-option label="English" value="en-US"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="核心思想">
              <el-input type="textarea" v-model="form.idea.summary"></el-input>
            </el-form-item>
            <el-form-item label="全局要求">
              <el-input type="textarea" v-model="form.idea.prompt"></el-input>
            </el-form-item>
          </template>
		  

          <!-- Fields for Templated -->
          <template v-if="form.type === 'templated'">
          <el-form-item label="源文件">
            <el-upload v-model:file-list="sourceFileList" multiple :auto-upload="false">
              <el-button type="primary">点击上传</el-button>
            </el-upload>
          </el-form-item>
          <el-form-item label="模板文件">
            <el-upload v-model:file-list="templateFileList" :limit="1" :auto-upload="false">
              <el-button type="primary">点击上传</el-button>
            </el-upload>
          </el-form-item>
        </template>
      </div>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="prevStep" v-if="activeStep > 0">上一步</el-button>
        <el-button @click="nextStep" v-if="activeStep < 1">下一步</el-button>
        <el-button type="primary" @click="handleCreateProject" v-if="activeStep === 1" >创建项目</el-button>
      </span>
    </template>
  </el-dialog>
  </el-container>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { getProjects, createProject, deleteProject, uploadFile } from '../services/api.ts';
import type { Project, ProjectIdea } from '../../../src/types';
import type { FormInstance, UploadUserFile, UploadRawFile, UploadInstance, UploadFile } from 'element-plus';
import { ElMessage } from 'element-plus';
import { Delete as ElIconDelete } from '@element-plus/icons-vue';
import * as ElIcons from '@element-plus/icons-vue';

const showNewProjectDialog = ref(false);
const projects = ref<Project[]>([]);
const router = useRouter();
const activeStep = ref(0);
const formRef = ref<FormInstance>();



const sourceFileList = ref<UploadUserFile[]>([]);
const templateFileList = ref<UploadUserFile[]>([]);

const uploadedSourcePaths = ref<string[]>([]);
const uploadedTemplatePath = ref<string>('');

const initialFormState = {
  name: '',
  type: 'book' as 'book' | 'series' | 'templated',
  idea: {
    language: 'zh-CN',
    summary: '',
    prompt: ''
  } as ProjectIdea,
};

const form = reactive({ ...initialFormState });

async function fetchProjects() {
  try {
    projects.value = await getProjects();
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    let errorMessage = '未知错误';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    ElMessage.error(`获取项目列表失败: ${errorMessage}`);
  }
}

function navigateToProject(projectName: string) {
  router.push({ name: 'ProjectDetail', params: { projectName } });
}

function nextStep() {
  if (activeStep.value === 0) {
    // Validate project type selection before moving to next step
    if (!form.type) {
      ElMessage.warning('请选择项目类型');
      return;
    }
  }
  if (activeStep.value < 1) activeStep.value++;
}

function prevStep() {
  if (activeStep.value > 0) activeStep.value--;
}

function resetForm() {
  activeStep.value = 0;
  Object.assign(form, initialFormState);
  form.idea = { ...initialFormState.idea };
  sourceFileList.value = [];
  templateFileList.value = [];
  uploadedSourcePaths.value = [];
  uploadedTemplatePath.value = '';
  formRef.value?.resetFields();
}



async function handleCreateProject() {
  if (!formRef.value) return;

  // Validate form fields first
  const formValid = await formRef.value.validate();
  if (!formValid) return;

  // Handle file uploads for templated projects
  if (form.type === 'templated') {
    if (sourceFileList.value.length === 0) {
      ElMessage.warning('请上传源文件');
      return;
    }
    if (templateFileList.value.length === 0) {
      ElMessage.warning('请上传模板文件');
      return;
    }

    // Reset paths before new upload session
    uploadedSourcePaths.value = [];
    uploadedTemplatePath.value = '';

    // Manually trigger upload for source files
    for (const file of sourceFileList.value) {
      try {
        const response = await uploadFile(file.raw as File);
        uploadedSourcePaths.value.push(response.filePath);
        console.log('Uploaded source file path:', response.filePath); // Debug log
      } catch (error) {
        console.error(`源文件 ${file.name} 上传失败:`, error);
        ElMessage.error(`源文件 ${file.name} 上传失败`);
        return; // Stop if any source file fails to upload
      }
    }

    // Manually trigger upload for template file
    if (templateFileList.value.length > 0) {
      try {
        const response = await uploadFile(templateFileList.value[0].raw as File);
        uploadedTemplatePath.value = response.filePath;
        console.log('Uploaded template file path:', response.filePath); // Debug log
      } catch (error) {
        console.error(`模板文件 ${templateFileList.value[0].name} 上传失败:`, error);
        ElMessage.error(`模板文件 ${templateFileList.value[0].name} 上传失败`);
        return; // Stop if template file fails to upload
      }
    }
  }

  console.log('uploadedSourcePaths before createProject:', uploadedSourcePaths.value); // Debug log
  console.log('uploadedTemplatePath before createProject:', uploadedTemplatePath.value); // Debug log

  try {
    const projectData: any = {
      name: form.name,
      type: form.type,
    };

    if (form.type === 'book' || form.type === 'series') {
       projectData.idea = {
		language: form.idea.language,
		summary: form.idea.summary,
		prompt: form.idea.prompt,
	  };
    } else if (form.type === 'templated') {
      projectData.sources = uploadedSourcePaths.value;
      projectData.template = uploadedTemplatePath.value;
    }

    await createProject(projectData);
    showNewProjectDialog.value = false;
    fetchProjects(); // Refresh the project list
    ElMessage.success('项目创建成功！');
  } catch (error) {
    console.error('Failed to create project:', error);
    let errorMessage = '未知错误';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    ElMessage.error(`创建项目失败: ${errorMessage}`);
  }
}

async function handleDeleteProject(projectName: string) {
  try {
    await deleteProject(projectName);
    fetchProjects(); // Refresh the list after deletion
    ElMessage.success('项目删除成功！');
  } catch (error) {
    console.error(`Failed to delete project ${projectName}:`, error);
    let errorMessage = '未知错误';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    ElMessage.error(`删除项目失败: ${errorMessage}`);
  }
}

function getProjectIcon(type: string) {
  switch (type) {
    case 'book': return ElIcons.Reading;
    case 'series': return ElIcons.Collection;
    case 'templated': return ElIcons.Document;
    default: return ElIcons.Document;
  }
}

function getProjectTypeLabel(type: string) {
  switch (type) {
    case 'book': return '图书';
    case 'series': return '系列文章';
    case 'templated': return '模板化文档';
    default: return '未知';
  }
}

function getProjectTypeTagType(type: string) {
  switch (type) {
    case 'book': return 'primary'; // Changed from '' to 'primary'
    case 'series': return 'success';
    case 'templated': return 'info';
    default: return 'info'; // Changed from '' to 'info'
  }
}

onMounted(() => {
  fetchProjects();
});
</script>

<style scoped>
.project-list-container {
  padding: 24px;
  background-color: #f0f2f5; /* 使用柔和的灰色背景代替纯黑 */
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 0 20px; /* Adjust padding to match el-header */
  max-width: 1200px; /* Max width for centering */
  margin-left: auto;
  margin-right: auto;
  gap: 20px; /* Add space between flex items */
}

.page-title {
  font-size: 24px;
  color: #303133;
  margin: 0;
}

.project-main-content {
  padding: 0 20px; /* Adjust padding to match el-main */
  max-width: 1200px; /* Max width for centering */
  margin-left: auto;
  margin-right: auto;
}

.project-col {
  margin-bottom: 24px; /* 列的底部外边距，确保换行时有间距 */
}

.project-card {
  border-radius: 8px; /* 添加圆角 */
  transition: all 0.3s ease; /* 为所有过渡效果添加动画 */
  cursor: pointer;
}

/* 添加悬停效果 */
.project-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--el-border-color-light);
  margin-bottom: 10px;
}

.project-title-group {
  display: flex;
  align-items: center;
  font-size: 1.2rem;
  font-weight: bold;
  color: #333;
}

.project-icon {
  margin-right: 8px;
  color: #409eff; /* Element Plus primary color */
}

.project-name {
  flex-grow: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 默认隐藏删除按钮 */
.delete-button {
  opacity: 0;
  transition: opacity 0.3s ease;
}

/* 鼠标悬停在卡片上时显示删除按钮 */
.project-card:hover .delete-button {
  opacity: 1;
}

.card-body {
  padding: 0;
  margin-bottom: 10px; /* Add some space below the tag */
}

.card-footer {
  padding: 14px 0 0 0; /* Adjust padding */
  font-size: 13px;
  color: #909399;
  border-top: 1px solid #ebeef5;
  margin-top: 10px; /* Add some space above the footer */
}

.created-at {
  /* No specific style needed here, as it's inside card-footer */
}
</style>
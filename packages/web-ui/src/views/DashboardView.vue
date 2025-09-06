<template>
  <el-container class="project-list-container">
    <!-- 优化的顶部操作栏 -->
    <el-header class="page-header">
      <h1 class="page-title">GenDoc</h1>
      <div>
        <el-button type="primary" @click="showNewProjectDialog = true">+ 新建项目</el-button>
        <el-button :icon="ElIconSetting" circle @click="navigateToSettings" />
      </div>
    </el-header>

    <el-main class="project-main-content">
      <!-- 空状态处理 -->
      <el-empty
        v-if="!projects || projects.length === 0"
        description="您还没有任何项目"
      >
        <el-button type="primary" @click="showNewProjectDialog = true">立即创建</el-button>
      </el-empty>

      <!-- 新的列表视图 -->
      <el-table v-else :data="projects" style="width: 100%" size="large" class="project-table">
        <el-table-column prop="name" label="项目名称" min-width="300">
          <template #default="{ row }">
            <a class="project-name-link" @click="navigateToProject(row.name)">
              <el-icon class="project-icon"><component :is="getProjectIcon(row.type)" /></el-icon>
              <span>{{ row.name }}</span>
            </a>
          </template>
        </el-table-column>

        <el-table-column prop="type" label="类型" width="150">
          <template #default="{ row }">
            <el-tag :type="getProjectTypeTagType(row.type)" size="small">{{ getProjectTypeLabel(row.type) }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="createdAt" label="创建日期" width="180">
          <template #default="{ row }">
            {{ row.createdAt ? new Date(row.createdAt).toLocaleDateString() : 'N/A' }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="180" align="right">
          <template #default="{ row }">
            <el-button size="small" @click="navigateToProject(row.name)">打开</el-button>
            <el-popconfirm
              title="确定要删除这个项目吗？"
              confirm-button-text="确定"
              cancel-button-text="取消"
              @confirm="handleDeleteProject(row.name)"
            >
              <template #reference>
                <el-button
                  type="danger"
                  size="small"
                >删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-main>

    <!-- New Project Dialog (no changes needed here) -->
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
import { getProjects, createProject, deleteProject, uploadFile } from '../services/api';
import type { Project, ProjectIdea } from '@gendoc/shared';
import type { FormInstance, UploadUserFile } from 'element-plus';
import { ElMessage } from 'element-plus';
import { Delete as ElIconDelete, Setting as ElIconSetting } from '@element-plus/icons-vue';
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

function navigateToSettings() {
  router.push('/settings');
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
  background-color: #f0f2f5; 
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 0 20px; 
  max-width: 1200px; 
  margin-left: auto;
  margin-right: auto;
  gap: 20px; 
}

.page-title {
  font-size: 24px;
  color: #303133;
  margin: 0;
}

.project-main-content {
  padding: 0 20px; 
  max-width: 1200px; 
  margin-left: auto;
  margin-right: auto;
}

.project-table {
  border-radius: 8px;
  overflow: hidden;
}

.project-name-link {
  font-weight: 500;
  color: var(--el-color-primary);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.project-name-link:hover {
  text-decoration: underline;
}

.project-icon {
  font-size: 16px;
}
</style>
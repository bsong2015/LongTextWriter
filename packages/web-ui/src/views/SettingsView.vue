<template>
  <div class="settings-view">
    <h1>设置</h1>
    <div v-if="error" class="error-message">{{ error }}</div>
    <div v-if="success" class="success-message">{{ success }}</div>
    <form @submit.prevent="saveSettings" v-if="config.app">
      <div class="card">
        <h2>通用设置</h2>
        <div class="form-group form-group-checkbox">
          <label for="mock">
            <input id="mock" type="checkbox" v-model="config.app.mock" />
            模拟模式 (Mock Mode)
          </label>
          <small>启用后，将使用模拟数据进行内容生成，无需配置 LLM。</small>
        </div>
      </div>

      <div class="card" v-if="!config.app.mock">
        <h2>LLM 设置</h2>

        <div class="form-group">
          <label for="apiKey">OpenAI API Key</label>
          <input id="apiKey" type="password" v-model="config.llm.apiKey" placeholder="请输入您的 OpenAI API 密钥" />
          <small>您的 OpenAI API 密钥将被安全存储。</small>
        </div>

        <div class="form-group">
          <label for="model">模型</label>
          <input id="model" type="text" v-model="config.llm.model" placeholder="例如: gpt-4o" />
          <small>请输入用于内容生成的语言模型。</small>
        </div>

        <div class="form-group">
          <label for="baseUrl">API Base URL (可选)</label>
          <input id="baseUrl" type="text" v-model="config.llm.baseUrl" placeholder="https://api.openai.com/v1" />
          <small>（可选）如果您使用自定义的或代理的OpenAI API端点，请在此处输入。</small>
        </div>

        <div class="form-group">
          <label for="proxy">代理 (可选)</label>
          <input id="proxy" type="text" v-model="config.llm.proxy" placeholder="http://127.0.0.1:7890" />
          <small>（可选）为API请求设置HTTP/HTTPS代理。</small>
        </div>
      </div>

      <button type="submit" :disabled="isSaving">
        {{ isSaving ? '保存中...' : '保存' }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getConfig, updateConfig } from '@/services/api';
import type { AppConfig } from '@gendoc/shared';

const config = ref<Partial<AppConfig>>({
  llm: {
    apiKey: '',
    model: 'gpt-4-turbo',
    baseUrl: '',
    proxy: ''
  },
  app: {
    language: 'zh',
    mock: false
  }
});

const isSaving = ref(false);
const error = ref<string | null>(null);
const success = ref<string | null>(null);

onMounted(async () => {
  try {
    const loadedConfig = await getConfig();
    // Merge loaded config into the ref, ensuring all nested objects exist
    if (loadedConfig.llm) {
      config.value.llm = { ...config.value.llm, ...loadedConfig.llm };
    }
    if (loadedConfig.app) {
        config.value.app = { ...config.value.app, ...loadedConfig.app };
    }
    // Always keep language as 'zh' as per discussion
    if(config.value.app) {
      config.value.app.language = 'zh';
    }

  } catch (err) {
    error.value = '加载配置失败。';
    console.error(err);
  }
});

const saveSettings = async () => {
  isSaving.value = true;
  error.value = null;
  success.value = null;

  // If mock is true, we might not need to validate other fields.
  // The backend should handle the logic of what to save.
  if (config.value.app?.mock) {
    // When mock is true, we might want to clear or ignore llm settings
    // For now, we'll just send them. The backend can decide.
  } else {
    // If not in mock mode, ensure apiKey is provided.
    if (!config.value.llm?.apiKey) {
      error.value = '在非模拟模式下，OpenAI API Key 是必需的。';
      isSaving.value = false;
      return;
    }
  }

  try {
    await updateConfig(config.value);
    success.value = '设置已成功保存！';
  } catch (err) {
    error.value = '保存设置失败。';
    console.error(err);
  } finally {
    isSaving.value = false;
    setTimeout(() => {
        success.value = null;
        error.value = null;
    }, 3000);
  }
};
</script>

<style scoped>
.settings-view {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 1rem;
}

.card {
  background-color: var(--color-background-soft);
  padding: 2rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.card h2 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  font-size: 1.2rem;
  color: var(--color-heading);
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group-checkbox label {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  font-weight: 500;
}

.form-group-checkbox input[type="checkbox"] {
  width: auto;
  margin-right: 0.75rem;
  /* Bigger checkbox */
  width: 1.2em;
  height: 1.2em;
}


.form-group input,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background-color: var(--color-background);
  color: var(--color-text);
  font-size: 1rem;
}

.form-group small {
  display: block;
  margin-top: 0.5rem;
  color: var(--color-text-mute);
}

button[type="submit"] {
  background-color: hsla(160, 100%, 37%, 1);
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s;
}

button[type="submit"]:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

button[type="submit"]:hover:not(:disabled) {
  background-color: hsla(160, 100%, 37%, 0.8);
}

.error-message, .success-message {
    padding: 1rem;
    border-radius: 4px;
    margin-bottom: 1rem;
}

.error-message {
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}

.success-message {
    background-color: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}
</style>
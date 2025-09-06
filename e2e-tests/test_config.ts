import axios from 'axios';
import type { AppConfig } from '../packages/shared/src/index';

const BASE_URL = 'http://localhost:3000/api';

async function runConfigWorkflowTest() {
  console.log('Starting config workflow test...');

  let originalConfig: Partial<AppConfig> = {};

  try {
    // 1. Get the current config and back it up
    console.log('1. Fetching current configuration...');
    const initialResponse = await axios.get<Partial<AppConfig>>(`${BASE_URL}/config`);
    originalConfig = initialResponse.data;
    console.log('   Original config received:', originalConfig);

    // 2. Update the configuration
    const newConfig: Partial<AppConfig> = {
      ...originalConfig,
      app: {
        ...originalConfig.app,
        language: 'zh',
      },
      llm: {
        ...originalConfig.llm,
        model: 'gpt-4-turbo',
      },
    };
    console.log('2. Updating configuration with new values...', newConfig);
    const updateResponse = await axios.put(`${BASE_URL}/config`, newConfig);
    console.log('   Update response:', updateResponse.data.message);
    if (updateResponse.status !== 200) {
      throw new Error('Failed to update config');
    }

    // 3. Verify the update
    console.log('3. Verifying the updated configuration...');
    const verifyResponse = await axios.get<Partial<AppConfig>>(`${BASE_URL}/config`);
    const updatedConfig = verifyResponse.data;
    if (updatedConfig.app?.language !== 'zh' || updatedConfig.llm?.model !== 'gpt-4-turbo') {
      throw new Error(
        `Verification failed. Language is \'${updatedConfig.app?.language}\' (expected 'zh') and model is \'${updatedConfig.llm?.model}\' (expected 'gpt-4-turbo').`
      );
    }
    console.log('   Verification successful!');

    console.log('Config workflow test completed successfully!');

  } catch (error: any) {
    console.error('Config workflow test failed:', error.message || error);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  } finally {
    // 4. Restore the original configuration
    if (Object.keys(originalConfig).length > 0) {
      console.log('4. Restoring original configuration...');
      try {
        await axios.put(`${BASE_URL}/config`, originalConfig);
        console.log('   Original configuration restored.');
      } catch (restoreError: any) {
        console.error('Failed to restore original configuration:', restoreError.message || restoreError);
      }
    }
  }
}

runConfigWorkflowTest();

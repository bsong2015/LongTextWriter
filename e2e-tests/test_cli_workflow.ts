import { spawn } from 'child_process';
import * as path from 'path';

// --- CONFIGURATION ---
const PROJECT_ROOT = path.resolve(__dirname, '..'); // Resolve to the monorepo root
const GENDOC_CLI_PATH = path.join(PROJECT_ROOT, 'packages', 'cli', 'dist', 'index.js');
const TEST_PROJECT_NAME = `TestCliProject_${Date.now()}`;
const TEST_PROJECT_TYPE = 'book'; // book, series, or templated
const TEST_PROJECT_LANG = 'English';
const TEST_PROJECT_SUMMARY = 'A test book about the history of AI.';
const TEST_PROJECT_PROMPT = 'Write in a clear, concise, and engaging style.';

// --- UTILITY FUNCTION ---

function runGendocCommand(args: string[]): Promise<{ code: number | null, output: string }> {
  return new Promise((resolve, reject) => {
    const command = 'node';
    const commandArgs = [GENDOC_CLI_PATH, ...args];
    
    const child = spawn(command, commandArgs, {
      stdio: 'pipe',
      cwd: PROJECT_ROOT,
    });

    let output = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      output += data.toString();
    });

    child.on('close', (code) => {
      console.log(output); // Log final combined output for debugging
      if (code === 0) {
        resolve({ code, output });
      } else {
        reject(new Error(`Command failed with code ${code}:\n${output}`));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });

    child.stdin.end(); // Close stdin immediately as no input is expected
  });
}

// --- TEST WORKFLOW ---

async function runCliWorkflowTest() {
  console.log('\n======= 🚀 STARTING CLI E2E WORKFLOW TEST 🚀 =======\n');

  try {
    // 1. CLEANUP: Remove project if it exists from a previous failed run
    console.log(`\n--- 1. Pre-emptive Cleanup: Deleting project '${TEST_PROJECT_NAME}' (if it exists) ---\n`);
    try {
      await runGendocCommand(['rm', TEST_PROJECT_NAME, '--yes']); 
    } catch (error: any) {
      if (error.message.includes('project_not_found_error')) {
        console.log('Cleanup: Project did not exist. That\'s OK.\n');
      } else {
        console.warn('Warning during cleanup (this may be OK if project did not exist):', error.message);
      }
    }

    // 2. NEW: Create a new project non-interactively
    console.log(`\n--- 2. Creating new project: ${TEST_PROJECT_NAME} ---\n`);
    const newCommandArgs = [
        'new',
        TEST_PROJECT_TYPE,
        '--name', TEST_PROJECT_NAME,
        '--lang', TEST_PROJECT_LANG,
        '--summary', TEST_PROJECT_SUMMARY,
        '--prompt', TEST_PROJECT_PROMPT
    ];
    const { output: newOutput } = await runGendocCommand(newCommandArgs);
    if (!newOutput.includes('project_created_success')) {
      throw new Error('NEW command failed: Success message key not found.');
    }
    console.log('✅ NEW command successful.\n');

    // 3. STATUS: Check initial status
    console.log(`\n--- 3. Checking initial status for ${TEST_PROJECT_NAME} ---\n`);
    const { output: initialStatusOutput } = await runGendocCommand(['status', TEST_PROJECT_NAME]);
    if (!initialStatusOutput.includes('status_not_started')) { // Check for the i18n key
      throw new Error('STATUS command failed: Initial status should indicate no outline.');
    }
    console.log('✅ STATUS command (initial) successful.\n');

    // 4. OUTLINE: Generate the project outline
    console.log(`\n--- 4. Generating outline for ${TEST_PROJECT_NAME} ---\n`);
    const { output: outlineOutput } = await runGendocCommand(['outline', TEST_PROJECT_NAME]);
    if (!outlineOutput.includes('outline_generated_success')) {
      throw new Error('OUTLINE command failed: Success message key not found.');
    }
    console.log('✅ OUTLINE command successful.\n');

    // 5. RUN: Generate the content
    console.log(`\n--- 5. Running content generation for ${TEST_PROJECT_NAME} ---\n`);
    const { output: runOutput } = await runGendocCommand(['run', TEST_PROJECT_NAME]);
    if (!runOutput.includes('content_generation_success')) {
      throw new Error('RUN command failed: Success message key not found.');
    }
    console.log('✅ RUN command successful.\n');

    // 6. STATUS: Check final status
    console.log(`\n--- 6. Checking final status for ${TEST_PROJECT_NAME} ---\n`);
    const { output: finalStatusOutput } = await runGendocCommand(['status', TEST_PROJECT_NAME]);
    if (!finalStatusOutput.includes('100%')) { // Progress is a value, not a key
      throw new Error('STATUS command failed: Final status should be 100%.');
    }
    console.log('✅ STATUS command (final) successful.\n');

    // 7. PUBLISH: Publish the project
    console.log(`\n--- 7. Publishing project ${TEST_PROJECT_NAME} ---\n`);
    const { output: publishOutput } = await runGendocCommand(['publish', TEST_PROJECT_NAME]);
    if (!publishOutput.includes('project_published_success')) {
      throw new Error('PUBLISH command failed: Success message key not found.');
    }
    console.log('✅ PUBLISH command successful.\n');

    // 8. RM: Delete the project
    console.log(`\n--- 8. Deleting project ${TEST_PROJECT_NAME} ---\n`);
    const { output: rmOutput } = await runGendocCommand(['rm', TEST_PROJECT_NAME, '--yes']);
    if (!rmOutput.includes('project_deleted_success')) {
      throw new Error('RM command failed: Success message key not found.');
    }
    console.log('✅ RM command successful.\n');

    console.log('\n======= ✅ CLI E2E WORKFLOW TEST SUCCEEDED ✅ =======\n');

  } catch (error) {
    console.error('\n======= ❌ CLI E2E WORKFLOW TEST FAILED ❌ =======\n');
    console.error(error);
    process.exit(1); // Exit with error code
  }
}

runCliWorkflowTest();

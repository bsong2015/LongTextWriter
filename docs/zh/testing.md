# 测试

GenDoc 包含模拟测试选项和完整的端到端测试套件。

## 使用模拟 LLM 进行测试

为了加快开发和测试速度，特别是在处理与大型语言模型（LLM）交互的功能时，您可以启用模拟 LLM 模式。此模式会绕过对 OpenAI 的实际 API 调用，并返回预定义的虚拟响应，从而节省时间和 API 成本。

要启用模拟 LLM，请在运行任何 `gendoc` 命令或启动 Web UI 之前，将 `MOCK_LLM` 环境变量设置为 `true`。

*   **对于 Linux/macOS (Bash/Zsh):** `export MOCK_LLM=true`
*   **对于 Windows (命令提示符):** `set MOCK_LLM=true`
*   **对于 Windows (PowerShell):** `$env:MOCK_LLM="true"`

## 端到端测试

项目包含一个端到端（E2E）测试套件，位于 `e2e-tests` 目录中。

### 如何运行 E2E 测试

1.  **启动 GenDoc 服务器**：
    在项目根目录中，启动 Web 服务器：
    ```bash
    # 首先请确保您已在 .env 文件中设置了必要的 API 密钥
    npm run start:web
    ```
    让服务器在单独的终端中保持运行。

2.  **安装 E2E 测试依赖**：
    ```bash
    cd e2e-tests
    npm install
    ```

3.  **运行测试脚本**：
    仍在 `e2e-tests` 目录中，使用 `npx` 执行测试脚本：
    ```bash
    npx ts-node test_workflow.ts
    ```

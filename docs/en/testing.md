# Testing

GenDoc includes options for mock testing and a full end-to-end test suite.

## Testing with Mock LLM

For faster development and testing without incurring API costs, you can enable a mock LLM mode. This mode bypasses actual API calls and returns dummy responses.

To enable it, set the `MOCK_LLM` environment variable to `true` before running any command.

-   **Linux/macOS:** `export MOCK_LLM=true`
-   **Windows (CMD):** `set MOCK_LLM=true`
-   **Windows (PowerShell):** `$env:MOCK_LLM="true"`

## End-to-End Testing

The project includes an E2E test suite in the `e2e-tests` directory.

### How to Run the E2E Test

1.  **Start the GenDoc Server**:
    In the project root, start the web server:
    ```bash
    # Make sure your .env file is configured
    npm run start:web
    ```
    Keep the server running in a separate terminal.

2.  **Install E2E Test Dependencies**:
    ```bash
    cd e2e-tests
    npm install
    ```

3.  **Run the Test Script**:
    While in the `e2e-tests` directory:
    ```bash
    npx ts-node test_workflow.ts
    ```

import * as os from 'os';
import * as path from 'path';

const WORKSPACE_DIR_NAME = '.gendoc-workspace';

/**
 * Retrieves the absolute path to the gendoc workspace directory.
 *
 * In a production environment (installed package), this is located in the user's home directory.
 * In a development environment, this is located at the project root.
 *
 * @returns {string} The absolute path to the workspace.
 */
export function getWorkspacePath(): string {
  if (process.env.NODE_ENV === 'production') {
    return path.resolve(os.homedir(), WORKSPACE_DIR_NAME);
  } else {
    // In development, assume the command is run from the monorepo root.
    return path.resolve(process.cwd(), WORKSPACE_DIR_NAME);
  }
}

/**
 * Retrieves the absolute path to the 'projects' directory within the gendoc workspace.
 *
 * @returns {string} The absolute path to the projects directory.
 */
export function getProjectsPath(): string {
  return path.resolve(getWorkspacePath(), 'projects');
}

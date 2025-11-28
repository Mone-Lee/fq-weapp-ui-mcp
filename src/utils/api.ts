import { FULL_DEMO_PATH_MAP } from "../consts/demo.js";

const projectId = '175';
const ref = 'test';

export interface ComponentDemoResult {
  ok: boolean;
  content?: string;
  status?: number;
  reason?: string;
  url?: string;
}

export const getComponentDemo = async (
  componentName: string,
  token?: string,
): Promise<ComponentDemoResult> => {
  const pathInMap = FULL_DEMO_PATH_MAP[componentName];
  if (!pathInMap) {
    return {
      ok: false,
      reason: `Component ${componentName} not found in DEMO_PATH_MAP`
    };
  }

  const apiUrl = `https://git.ifengqun.com/api/v4/projects/${projectId}/repository/files/${encodeURIComponent(pathInMap)}/raw?ref=${ref}`;
  const effectiveToken = token || process.env.GITLAB_PERSONAL_ACCESS_TOKEN || '';

  if (!effectiveToken) {
    return {
      ok: false,
      reason: 'Missing GitLab personal access token',
      url: apiUrl
    };
  }

  try {
    const response = await fetch(apiUrl, {
      headers: {
        'PRIVATE-TOKEN': effectiveToken,
      }
    });

    if (!response.ok) {
      let reason = `HTTP ${response.status}`;
      if (response.status === 401 || response.status === 403) {
        reason = 'Authentication failed (token invalid or insufficient scope)';
      } else if (response.status === 404) {
        reason = 'File not found (check mapping, branch, or path)';
      }
      return {
        ok: false,
        status: response.status,
        reason,
        url: apiUrl
      };
    }

    const data = await response.text();
    return {
      ok: true,
      content: data,
      status: response.status,
      url: apiUrl
    };
  } catch (error) {
    return {
      ok: false,
      reason: `Network/Fetch error: ${error instanceof Error ? error.message : String(error)}`,
      url: apiUrl
    };
  }
};
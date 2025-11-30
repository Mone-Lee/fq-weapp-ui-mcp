import { FULL_DEMO_PATH_MAP } from "../consts/demo.js";
import { FULL_SOURCE_CODE_PATH_MAP } from "../consts/source.js";

const projectId = '175';
const ref = 'test';

type GitlabFetchResult = {
  ok: boolean;
  content?: string;
  status?: number;
  reason?: string;
  url: string | undefined;
};

const fetchGitlabFile = async (
  componentName: string,
  pathMap: Record<string, string>,
  token?: string
): Promise<GitlabFetchResult> => {
  const pathInMap = pathMap[componentName];
  if (!pathInMap) {
    return { ok: false, reason: `Component ${componentName} not found in mapping`, url: undefined };
  }
  const apiUrl = `https://git.ifengqun.com/api/v4/projects/${projectId}/repository/files/${encodeURIComponent(pathInMap)}/raw?ref=${ref}`;
  const effectiveToken = token || process.env.GITLAB_PERSONAL_ACCESS_TOKEN || '';
  if (!effectiveToken) {
    return { ok: false, reason: 'Missing GitLab personal access token', url: apiUrl };
  }
  try {
    const response = await fetch(apiUrl, {
      headers: { 'PRIVATE-TOKEN': effectiveToken }
    });
    if (!response.ok) {
      let reason = `HTTP ${response.status}`;
      if (response.status === 401 || response.status === 403) reason = 'Authentication failed';
      else if (response.status === 404) reason = 'File not found';
      return { ok: false, status: response.status, reason, url: apiUrl };
    }
    const data = await response.text();
    return { ok: true, content: data, status: response.status, url: apiUrl };
  } catch (error) {
    return { ok: false, reason: `Network/Fetch error: ${error instanceof Error ? error.message : String(error)}`, url: apiUrl };
  }
}

export const getComponentDemo = async (componentName: string, token?: string) =>
  fetchGitlabFile(componentName, FULL_DEMO_PATH_MAP, token);

export const getComponentSource = async (componentName: string, token?: string) =>
  fetchGitlabFile(componentName, FULL_SOURCE_CODE_PATH_MAP, token);
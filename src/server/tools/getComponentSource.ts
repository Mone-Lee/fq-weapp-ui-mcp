import { z } from 'zod';
import { getComponentSource } from '../../utils/api.js';
import { getGitlabToken } from '../../utils/token.js';

export const getComponentSourceSchema = {
  componentName: z.string().describe('组件名称 (如 FQButton)'),
  token: z.string().optional().describe('可选 GitLab Token')
};

export const getComponentSourceHandler = async ({ componentName, token }: { componentName: string, token?: string | undefined }): Promise<{ content: { type: 'text'; text: string }[] }> => {
  const effectiveToken = token || getGitlabToken();
  const result = await getComponentSource(componentName, effectiveToken);

  if (!result.ok) {
    if (result.reason === 'Missing GitLab personal access token') {
      throw new Error(
        `❌ 缺少 GitLab Token。\n组件: ${componentName}\nURL: ${result.url}\n\n请执行以下任一方式:\n` +
        `1. 设置环境变量: export GITLAB_PERSONAL_ACCESS_TOKEN=your_token\n` +
        `2. 先调用工具 set-gitlab-token 传入 token\n` +
        `3. 本次直接传递 token 参数调用 get-component-source\n\n示例:\n- set-gitlab-token: {"token": "glpat-xxxxx"}\n- get-component-source: {"componentName": "${componentName}", "token": "xxxxx"}`
      );
    }
    throw new Error(
      `❌ 获取示例失败\n组件: ${componentName}\n原因: ${result.reason}\nURL: ${result.url}` +
      (result.status ? `\n状态码: ${result.status}` : '') +
      `\n\n排查建议:\n- 确认 DEMO_PATH_MAP 中是否有该组件映射\n- 检查分支 ref 是否正确 (当前: test)\n- 若是 401/403，检查 token 是否有效且权限足够`
    );
  }

  return { content: [{ type: 'text', text: result.content || '' }] };
}
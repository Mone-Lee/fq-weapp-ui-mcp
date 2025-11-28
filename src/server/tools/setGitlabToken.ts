import { z } from 'zod';
import { setGitlabToken, getGitlabToken } from '../../utils/token.js';

export const setGitlabTokenSchema = {
  token: z.string().optional().describe('GitLab PAT; omit to only query')
};

export const setGitlabTokenHandler = async ({ token }: { token?: string | undefined }): Promise<{ content: { type: 'text'; text: string }[] }> => {
  if (token) {
    setGitlabToken(token.trim());
    return { content: [{ type: 'text', text: '✅ GitLab token stored for this session.' }] };
  }
  return {
    content: [
      {
        type: 'text',
        text: getGitlabToken()
          ? 'Current session token is set.'
          : 'No session token set. You can set one via set-gitlab-token or pass token to get-component-demo.'
      }
    ]
  };
}
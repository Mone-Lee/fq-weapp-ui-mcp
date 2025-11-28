let GITLAB_TOKEN: string | undefined;

export function setGitlabToken(token: string) {
  GITLAB_TOKEN = token;
}
export function getGitlabToken() {
  return GITLAB_TOKEN;
}
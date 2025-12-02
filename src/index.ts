#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { listComponentsSchema, listComponentsHandler } from './server/tools/listComponents.js';
import { getComponentDemoSchema, getComponentDemoHandler } from './server/tools/getComponentDemo.js';
import { getComponentSourceSchema, getComponentSourceHandler } from './server/tools/getComponentSource.js';
import { setGitlabTokenSchema, setGitlabTokenHandler } from './server/tools/setGitlabToken.js';

const server = new McpServer({
  name: 'fq-weapp-ui-mcp',
  version: '1.0.0',
}, {
  instructions: 'fq-weapp-ui 组件库 和 fq-weapp-ui-pro 组件库资料查询服务，提供组件列表、文档、源码等查询功能。',
});

server.registerTool('list-components', {
  title: '列出组件库的所有组件',
  description: '根据组件库名称，列出该组件库的所有组件列表。',
  inputSchema: listComponentsSchema
}, listComponentsHandler);

server.registerTool('get-component-demo', {
  title: '获取组件的示例代码',
  description: '根据组件名称，返回该组件的示例代码。',
  inputSchema: getComponentDemoSchema
}, getComponentDemoHandler);

server.registerTool('get-component-source-code', {
  title: '获取组件的源码',
  description: '根据组件名称，返回该组件的源码。',
  inputSchema: getComponentSourceSchema
}, getComponentSourceHandler);

server.registerTool('set-gitlab-token', {
  title: '设置/查询 GitLab Token',
  description: '设置会话级别的 GitLab Token，或查询当前状态。',
  inputSchema: setGitlabTokenSchema
}, setGitlabTokenHandler);

const transport = new StdioServerTransport();
server.connect(transport);
console.error('[mcp] server connected');
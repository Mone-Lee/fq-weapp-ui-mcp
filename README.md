# fq-weapp-ui-mcp

[![Node.js Version](https://img.shields.io/badge/node-%3E=18.0.0-brightgreen.svg)](https://nodejs.org/)
[![npm version](https://img.shields.io/npm/v/fq-weapp-ui-mcp.svg?style=flat-square)](https://www.npmjs.com/package/fq-weapp-ui-mcp)
![NPM Downloads](https://img.shields.io/npm/dm/fq-weapp-ui-mcp)
![Server](https://img.shields.io/badge/Server-Rx·Px·T✓·Sx-orange?style=flat&logo=modelcontextprotocol&labelColor=yellow)


🌐 **语言:** [English](#english) | [简体中文](#chinese)

---

<a name="chinese"></a>
<details open>
<summary>简体中文</summary>

fq-weapp-ui 组件库的 MCP 服务端，支持文档、示例代码和源码获取。

### 功能

- 列出 fq-weapp-ui 和 fq-weapp-ui-pro 组件库的所有组件
- 获取任意组件的示例代码和源码
- GitLab Token 管理，安全访问 API
- 可集成到 VS Code MCP 插件或命令行

### 安装

```bash
npm install -g fq-weapp-ui-mcp
# 或直接使用 npx
npx fq-weapp-ui-mcp
```

### 使用方法

https://www.yuque.com/camillelimengyi/rvimlc/accdd8xgp7yf5ho0?singleDoc# 《fq-weapp-ui-mcp使用说明》

### 工具列表

- **list-components**：列出组件库所有组件
- **get-component-demo**：获取组件的示例代码
- **get-component-source**：获取组件源码
- **set-gitlab-token**：设置或查询会话级 GitLab Token

### 工具调用示例

```json
{
  "name": "list-components",
  "arguments": { "name": "fq-weapp-ui" }
}
```

```json
{
  "name": "get-component-demo",
  "arguments": { "componentName": "FQButton", "token": "glpat-xxxxx" }
}
```

### 许可证

MIT

### 作者

Mone-Lee <limengyi.ml@gmail.com>

</details>

<a name="english"></a>
<details>
<summary>English</summary>

MCP server for fq-weapp-ui component library documentation, demo, and source code retrieval.

### Features

- List all components in fq-weapp-ui and fq-weapp-ui-pro libraries
- Fetch demo code and source code for any component
- GitLab token management for secure API access
- Designed for integration with VS Code MCP extension or CLI

### Installation

```bash
npm install -g fq-weapp-ui-mcp
# or use npx directly
npx fq-weapp-ui-mcp
```

### Usage

https://www.yuque.com/camillelimengyi/rvimlc/accdd8xgp7yf5ho0?singleDoc# 

### Tools

- **list-components**: List all components in a library
- **get-component-demo**: Get demo code for a component
- **get-component-source**: Get source code for a component
- **set-gitlab-token**: Set or query session GitLab token

### Example Tool Usage

```json
{
  "name": "list-components",
  "arguments": { "name": "fq-weapp-ui" }
}
```

```json
{
  "name": "get-component-demo",
  "arguments": { "componentName": "FQButton", "token": "glpat-xxxxx" }
}
```

### License

MIT

### Author

Mone-Lee <limengyi.ml@gmail.com>

</details>


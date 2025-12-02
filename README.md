```markdown
# fq-weapp-ui-mcp

<!-- Language Switch Index -->
- [English](#english)
- [中文](#中文)

---

## English

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

#### Run MCP Server

```bash
npx fq-weapp-ui-mcp
```

#### VS Code Integration

Add to `.vscode/mcp.json` in your project:

```json
{
  "servers": {
    "fq-weapp-ui-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["fq-weapp-ui-mcp"]
    }
  }
}
```

#### Environment Variables

Set your GitLab personal access token for demo/source code fetching:

```bash
export GITLAB_PERSONAL_ACCESS_TOKEN=your_token
```

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

---

## 中文

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

#### 启动 MCP 服务

```bash
npx fq-weapp-ui-mcp
```

#### VS Code 集成

在项目根目录添加 `.vscode/mcp.json`：

```json
{
  "servers": {
    "fq-weapp-ui-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["fq-weapp-ui-mcp"]
    }
  }
}
```

#### 环境变量

设置 GitLab 个人访问令牌，用于拉取示例和源码：

```bash
export GITLAB_PERSONAL_ACCESS_TOKEN=你的token
```

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
```
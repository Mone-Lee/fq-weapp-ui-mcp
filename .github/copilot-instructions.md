# MCP Node.js 项目初始化说明

本项目用于编写 Model Context Protocol (MCP) 服务器，采用 TypeScript + Node.js。

## 相关资源
- MCP 官方文档：https://modelcontextprotocol.io/
- TypeScript SDK：https://github.com/modelcontextprotocol/typescript-sdk
- 快速入门与示例：https://github.com/modelcontextprotocol/quickstart-resources/tree/main/weather-server-typescript

## 初始化步骤
1. 使用 `npm init -y` 初始化 Node 项目。
2. 安装依赖：
   - `@modelcontextprotocol/sdk` （MCP TypeScript SDK）
   - `zod@3` （Schema 校验）
   - 开发依赖：`typescript`、`@types/node`
3. 配置 `tsconfig.json`，设置 `outDir` 为 `build`，`rootDir` 为 `src`。
4. 创建 `src/index.ts`，实现 MCP 服务器逻辑。
5. 构建命令：`npm run build`。
6. MCP 服务器配置可参考 MCP 官方文档和 SDK 示例。

## MCP 服务器 VS Code 调试配置
- 在 `.vscode/mcp.json` 中添加 MCP 服务器配置，示例：
```json
{
  "servers": {
    "my-mcp-server": {
      "type": "stdio",
      "command": "node",
      "args": ["build/index.js"]
    }
  }
}
```

## 参考
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP 规范](https://spec.modelcontextprotocol.io/)
- [MCP 服务器开发教程](https://modelcontextprotocol.io/docs/develop/build-server)

---
如需继续，请参考上述文档或在本文件补充自定义说明。

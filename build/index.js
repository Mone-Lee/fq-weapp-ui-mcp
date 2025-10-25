import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
// 创建MCP服务器实例
const server = new McpServer({
    name: 'demo-server',
    version: '1.0.0',
});
// 添加加法工具
server.registerTool("add", {
    title: '加法工具',
    description: '将两个数字相加',
    inputSchema: {
        a: z.number(),
        b: z.number(),
    },
}, async ({ a, b }) => ({
    content: [{ type: 'text', text: `结果是：${a + b}` }]
}));
// 添加动态问候资源
server.registerResource("greeting", new ResourceTemplate("greeting://{name}", {
    list: undefined,
}), {
    title: "问候资源",
    description: "根据名称生成个性化问候语",
}, async (uri, { name }) => ({
    contents: [{ uri: uri.href, text: `你好，${name}！` }]
}));
// 通过标准输入输出接收和发送消息
const transport = new StdioServerTransport();
await server.connect(transport);
//# sourceMappingURL=index.js.map
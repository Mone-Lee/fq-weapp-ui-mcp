import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import { createRequire } from 'module';
import { getComponentDemo } from './utils/api.js';

/**
 * 全局变量，存储会话级别的 GitLab 令牌
 */
let GITLAB_TOKEN: string | undefined;

// 组件配置
const COMPONENT_PACKAGES: Record<string, { name: string; displayName: string; npmPackageName: string }> = {
  'fq-weapp-ui': {
    name: 'fq-weapp-ui',
    displayName: '@fq/fq-weapp-ui (基础组件库)',
    npmPackageName: '@fq/fq-weapp-ui',
  },
  'fq-weapp-ui-pro': {
    name: 'fq-weapp-ui-pro',
    displayName: '@fq/fq-weapp-ui-pro (高级组件库)',
    npmPackageName: '@fq/fq-weapp-ui-pro',
  }
};

// 从已安装的 npm 包中获取组件信息
function getComponentsFromNpmPackage(
  packageName: string,
): { components: string[], version?: string, packagePath?: string } | null {
  try {
    // 在 ES 模块中使用 createRequire 来使用 require.resolve
    const require = createRequire(path.join(process.cwd(), 'package.json'))
    const packageJsonPath = require.resolve(`${packageName}/package.json`);

    if (!packageJsonPath) {
      return null;
    }

    const packageDir = path.dirname(packageJsonPath);
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    // 尝试读取类型定义文件
    const possiblePaths = [
      path.join(packageDir, packageJson.typings || 'es/index.d.ts'),
      path.join(packageDir, 'lib/index.d.ts'),
      path.join(packageDir, 'dist/index.d.ts'),
      path.join(packageDir, 'index.d.ts')
    ];

    for (const typePath of possiblePaths) {
      if (fs.existsSync(typePath)) {
        const components = parseComponentsFromTypeFile(typePath);
        if (components.length > 0) {
          return {
            components,
            version: packageJson.version,
            packagePath: packageDir
          };
        }
      }
    }

    // 如果类型定义文件解析失败，尝试读取主文件
    const mainFilePath = path.join(packageDir, packageJson.main || 'lib/index.js');
    if (fs.existsSync(mainFilePath)) {
      const components = parseComponentsFromJsFile(mainFilePath);
      if (components.length > 0) {
        return {
          components,
          version: packageJson.version,
          packagePath: packageDir
        };
      }
    }

    return null;
  } catch (error) {
    // npm 包未安装或解析失败
    return null;
  }
}

// 从 TypeScript 类型定义文件中解析组件
function parseComponentsFromTypeFile(filePath: string): string[] {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const components: string[] = [];

    // 匹配 export declare const FQComponent: React.ComponentType<...>
    const componentRegex = /export\s+declare\s+(?:const|function|class)\s+(FQ\w+)/g;
    let match;

    while ((match = componentRegex.exec(content)) !== null) {
      if (match[1]) {
        components.push(match[1]);
      }
    }

    // 如果上面的正则没有匹配到，尝试其他模式
    if (components.length === 0) {
      const exportRegex = /export\s+{\s*default\s+as\s+(FQ\w+)/g;
      while ((match = exportRegex.exec(content)) !== null) {
        if (match[1]) {
          components.push(match[1]);
        }
      }
    }

    return components.sort();
  } catch (error) {
    console.error(`Error parsing type file ${filePath}:`, error);
    return [];
  }
}

// 从 JavaScript 文件中解析组件
function parseComponentsFromJsFile(filePath: string): string[] {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const components: string[] = [];

    // 匹配 module.exports.FQComponent =
    const componentRegex = /(?:exports\.|module\.exports\.)(FQ\w+)\s*=/g;
    let match;

    while ((match = componentRegex.exec(content)) !== null) {
      if (match[1]) {
        components.push(match[1]);
      }
    }

    return components.sort();
  } catch (error) {
    console.error(`Error parsing JS file ${filePath}:`, error);
    return [];
  }
}

// 解析组件导出文件，获取组件列表（用于开发环境）
function getComponentsFromExportFile(indexPath: string): string[] {
  try {
    const fullPath = path.resolve(__dirname, indexPath);
    if (!fs.existsSync(fullPath)) {
      return [];
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    const components: string[] = [];

    // 匹配 export { default as FQComponent } from './components/component-name';
    const exportRegex = /export\s+{\s+default\s+as\s+(FQ\w+)\s+}[^;]*;/g;
    let match;

    while ((match = exportRegex.exec(content)) !== null) {
      if (match[1]) {
        components.push(match[1]);
      }
    }

    return components;
  } catch (error) {
    console.error(`Error reading export file ${indexPath}:`, error);
    return [];
  }
}

// 通过扫描组件目录获取组件列表（用于开发环境）
function getComponentsFromDirectory(componentsDir: string): string[] {
  try {
    const fullPath = path.resolve(__dirname, componentsDir);
    if (!fs.existsSync(fullPath)) {
      return [];
    }

    const items = fs.readdirSync(fullPath, { withFileTypes: true });
    const components: string[] = [];

    for (const item of items) {
      if (item.isDirectory()) {
        // 检查目录中是否有 index.tsx 或 index.ts 文件
        const componentIndexPath = path.join(fullPath, item.name, 'index.ts');
        const componentTsxPath = path.join(fullPath, item.name, 'index.tsx');

        if (fs.existsSync(componentIndexPath) || fs.existsSync(componentTsxPath)) {
          // 将 kebab-case 转换为 PascalCase 并添加 FQ 前缀
          const componentName = item.name
            .split('-')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join('');
          components.push(`FQ${componentName}`);
        }
      }
    }

    return components.sort();
  } catch (error) {
    console.error(`Error scanning components directory ${componentsDir}:`, error);
    return [];
  }
}

// 获取指定组件库的组件列表
function getComponents(
  packageName: string,
): { components: string[], source: string, version?: string } {
  const config = COMPONENT_PACKAGES[packageName];

  if (!config) {
    return {
      components: [],
      source: '未知组件库'
    };
  }

  // 策略1：尝试从已安装的 npm 包中获取组件
  const npmResult = getComponentsFromNpmPackage(config.npmPackageName);
  const baseSourceNote = process.cwd();
  if (npmResult && npmResult.components.length > 0) {
    return {
      components: npmResult.components,
      source: `从项目 ${baseSourceNote} 已安装的 npm 包获取 (版本 ${npmResult.version})`,
      ...(npmResult.version && { version: npmResult.version })
    };
  }

  // 策略2：返回预定义的默认组件列表（作为兜底方案）
  const defaultComponents = getDefaultComponents(packageName);
  if (defaultComponents.length > 0) {
    return {
      components: defaultComponents,
      source: '从内置默认列表获取（可能不是最新版本）'
    };
  }

  return {
    components: [],
    source: '无法获取组件列表'
  };
}

// 获取默认组件列表（作为兜底方案）
function getDefaultComponents(packageName: string): string[] {
  const defaults: Record<string, string[]> = {
    'fq-weapp-ui': [
      'FQButton', 'FQBadge', 'FQModal', 'FQSpriteIcon', 'FQTitle', 'FQText',
      'FQNumeral', 'FQInputNew', 'FQForm', 'FQSpaceCompact', 'FQNoticeBar',
      'FQTextareaNew', 'FQCard', 'FQTag', 'FQWaterMark'
    ],
    'fq-weapp-ui-pro': [
      'FQGoodsCard', 'FQSearch', 'FQPrice'
    ]
  };

  return defaults[packageName] || [];
}

const server = new McpServer({
  name: 'fq-weapp-ui-mcp',
  version: '0.0.1',
});

/**
 * 列出组件库的所有组件 list-components
 * 输入参数: 组件库名称 (fq-weapp-ui 或 fq-weapp-ui-pro)
 * 输出: 组件名列表
 */
server.registerTool(
  'list-components',
  {
    title: '列出组件库的所有组件',
    description: '根据组件库名称，列出该组件库的所有组件列表。支持: fq-weapp-ui, fq-weapp-ui-pro',
    inputSchema: {
      name: z.string().describe('组件库的名称 (fq-weapp-ui 或 fq-weapp-ui-pro)'),
    },
  },
  async ({ name }) => {
    try {
      const { components, source, version } = getComponents(name);
      const config = COMPONENT_PACKAGES[name as keyof typeof COMPONENT_PACKAGES];

      if (!config) {
        return {
          content: [
            {
              type: "text",
              text: `❌ 未知的组件库: ${name}\n\n支持的组件库:\n- fq-weapp-ui (基础组件库)\n- fq-weapp-ui-pro (高级组件库)\n\n💡 提示: 请确保已在项目中安装相应的组件库包`
            }
          ]
        };
      }

      if (components.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `❌ 在 ${config.displayName} 中未找到任何组件\n\n**数据来源**: ${source}\n\n💡 建议:\n- 确认已安装 ${config.npmPackageName} 包\n- 检查包是否正确安装到 node_modules 中`
            }
          ]
        };
      }

      // 格式化输出
      const componentList = components.map(component => `  - ${component}`).join('\n');
      let response = `## ${config.displayName} 组件列表\n\n**数据来源**: ${source}\n**组件数量**: ${components.length}`;

      if (version) {
        response += `\n**包版本**: ${version}`;
      }

      response += `\n\n**组件列表**:\n${componentList}`;

      // 根据数据来源添加不同的提示
      if (source.includes('已安装的 npm 包')) {
        response += `\n\n✅ 组件列表基于您当前安装的版本，可能不是最新版本。请通过 http://npm.ifengqun.com:4873/ 查看组件库版本`;
      }

      return {
        content: [
          {
            type: "text",
            text: response
          }
        ]
      };
    } catch (error) {
      console.error('Error in list-components tool:', error);
      return {
        content: [
          {
            type: "text",
            text: `❌ 获取组件列表时发生错误: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);

/**
 * 增加记忆型工具 set-gitlab-token 存储本次会话令牌。
 */
server.registerTool(
  'set-gitlab-token',
  {
    title: 'Set or query GitLab token',
    description: 'Set a session GitLab Personal Access Token for demo fetching; omit to query current state.',
    inputSchema: {
      token: z.string().optional().describe('GitLab PAT; omit to only query')
    }
  },
  async ({ token }) => {
    if (token) {
      GITLAB_TOKEN = token.trim();
      return {
        content: [{ type: 'text', text: '✅ GitLab token stored for this session.' }]
      };
    }
    return {
      content: [
        {
          type: 'text',
          text: GITLAB_TOKEN
            ? 'Current session token is set.'
            : 'No session token set. You can set one via set-gitlab-token or pass token to get-component-demo.'
        }
      ]
    };
  }
);

/**
 * 返回组件的示例代码 get-component-demo
 * 输入参数: 组件名称 (如 FQButton)
 * 输出: 组件的示例代码
 */
server.registerTool(
  'get-component-demo',
  {
    title: '获取组件的示例代码',
    description: '根据组件名称，返回该组件的示例代码。',
    inputSchema: {
      componentName: z.string().describe('组件的名称 (如 FQButton)'),
      token: z.string().optional().describe('可选：GitLab Personal Access Token（不传则使用会话或环境变量）')
    },
  },
  async ({ componentName, token }) => {
    try {
      const effectiveToken = token || GITLAB_TOKEN || process.env.GITLAB_PERSONAL_ACCESS_TOKEN;
      const result = await getComponentDemo(componentName, effectiveToken);

      if (!result.ok) {
        // Missing token specific guidance
        if (result.reason === 'Missing GitLab personal access token') {
          return {
            content: [
              {
                type: 'text',
                text:
                  `❌ 缺少 GitLab Token。\n组件: ${componentName}\nURL: ${result.url}\n\n请执行以下任一方式:\n` +
                  `1. 设置环境变量: export GITLAB_PERSONAL_ACCESS_TOKEN=your_token\n` +
                  `2. 先调用工具 set-gitlab-token 传入 token\n` +
                  `3. 本次直接传递 token 参数调用 get-component-demo\n\n示例:\n- set-gitlab-token: {"token": "glpat-xxxxx"}\n- get-component-demo: {"componentName": "${componentName}", "token": "xxxxx"}`
              }
            ]
          };
        }

        // Auth / not found / other errors
        return {
          content: [
            {
              type: 'text',
              text:
                `❌ 获取示例失败\n组件: ${componentName}\n原因: ${result.reason}\nURL: ${result.url}` +
                (result.status ? `\n状态码: ${result.status}` : '') +
                `\n\n排查建议:\n- 确认 DEMO_PATH_MAP 中是否有该组件映射\n- 检查分支 ref 是否正确 (当前: test)\n- 若是 401/403，检查 token 是否有效且权限足够`
            }
          ]
        };
      }

      // Success: return demo content
      return {
        content: [
          {
            type: 'text',
            text: result.content || ''
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ 获取组件示例代码时发生错误: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);

const transport = new StdioServerTransport();
server.connect(transport);
console.error('[mcp] server connected');
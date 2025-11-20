import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import { createRequire } from 'module';

// 组件配置
const COMPONENT_PACKAGES = {
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
function getComponentsFromNpmPackage(packageName: string): { components: string[], version?: string, packagePath?: string } | null {
  try {
    // 在 ES 模块中使用 createRequire 来使用 require.resolve
    const require = createRequire(import.meta.url);
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
function getComponents(packageName: string): { components: string[], source: string, version?: string } {
  const config = COMPONENT_PACKAGES[packageName as keyof typeof COMPONENT_PACKAGES];

  if (!config) {
    return {
      components: [],
      source: '未知组件库'
    };
  }

  // 策略1：尝试从已安装的 npm 包中获取组件
  const npmResult = getComponentsFromNpmPackage(config.npmPackageName);
  if (npmResult && npmResult.components.length > 0) {
    return {
      components: npmResult.components,
      source: `从已安装的 npm 包获取 (版本 ${npmResult.version})`,
      ...(npmResult.version && { version: npmResult.version })
    };
  }

  // 策略2：如果 npm 包未安装，尝试从开发环境的源码获取（用于 monorepo 开发）
  // const exportComponents = getComponentsFromExportFile(config.fallbackIndexPath);
  // if (exportComponents.length > 0) {
  //   return {
  //     components: exportComponents,
  //     source: '从开发环境源码获取'
  //   };
  // }

  // 策略3：扫描组件目录
  // const directoryComponents = getComponentsFromDirectory(config.fallbackComponentsDir);
  // if (directoryComponents.length > 0) {
  //   return {
  //     components: directoryComponents,
  //     source: '从开发环境组件目录扫描'
  //   };
  // }

  // 策略4：返回预定义的默认组件列表（作为最后的兜底方案）
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
      'FQNumeral', 'FQInput', 'FQForm', 'FQSpaceCompact', 'FQNoticeBar',
      'FQTextarea', 'FQCard', 'FQTag', 'FQWaterMark'
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
        response += `\n\n✅ 组件列表基于您当前安装的版本，确保与实际使用的组件一致`;
      } else if (source.includes('开发环境')) {
        response += `\n\n🔧 当前从开发环境获取组件列表（开发模式）`;
      } else if (source.includes('内置默认列表')) {
        response += `\n\n⚠️  使用内置默认列表，建议安装 ${config.npmPackageName} 包以获取最新组件信息`;
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

const transport = new StdioServerTransport();
server.connect(transport);
console.error('[mcp] server connected');
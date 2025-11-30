import * as fs from 'fs';
import * as path from 'path';
import { COMPONENT_PACKAGES } from '../consts/package.js';
import { createRequire } from 'module';

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

export // 获取指定组件库的组件列表
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
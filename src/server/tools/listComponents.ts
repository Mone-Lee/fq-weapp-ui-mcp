import { z } from 'zod';
import { getComponents } from '../../utils/component.js';
import { COMPONENT_PACKAGES } from '../../consts/package.js';

export const listComponentsSchema = {
  name: z.string().describe('组件库名称 (fq-weapp-ui 或 fq-weapp-ui-pro)')
};

export const listComponentsHandler = async ({ name }: { name: string }): Promise<{ content: { type: 'text'; text: string }[] }> => {
  const { components, source, version } = getComponents(name);
  const config = COMPONENT_PACKAGES[name];
  if (!config) {
    throw new Error(`❌ 未知的组件库: ${name}`);
  }
  if (components.length === 0) {
    throw new Error(`❌ 在 ${config.displayName} 中未找到任何组件\n数据来源: ${source}`);
  }
  const componentList = components.map(c => `  - ${c}`).join('\n');
  let response = `## ${config.displayName} 组件列表\n数据来源: ${source}\n组件数量: ${components.length}`;
  if (version) response += `\n包版本: ${version}`;
  response += `\n\n组件列表:\n${componentList}`;
  return { content: [{ type: 'text', text: response }] };
}
import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import fs from 'fs/promises'
import path from 'path'

// 创建MCP服务器实例
const server = new McpServer({
  name: 'demo-server',
  version: '1.0.0',
})

// ========== 通用组件库支持：docs 资源 + 辅助工具 ==========

// 配置：组件文档根目录与组件包导入前缀
const COMPONENT_DOCS_DIR = process.env.COMPONENT_DOCS_DIR || path.resolve(process.cwd(), 'docs', 'components')
const COMPONENT_IMPORT_BASE = process.env.COMPONENT_IMPORT_BASE || '@your/ui'

async function ensureDocsDir() {
  try {
    await fs.mkdir(COMPONENT_DOCS_DIR, { recursive: true })
  } catch {
    // ignore
  }
}

async function listDocFiles(): Promise<string[]> {
  try {
    const entries = await fs.readdir(COMPONENT_DOCS_DIR, { withFileTypes: true })
    return entries
      .filter((e: import('fs').Dirent) => e.isFile() && (e.name.endsWith('.md') || e.name.endsWith('.mdx')))
      .map((e: import('fs').Dirent) => e.name)
  } catch {
    return []
  }
}

function nameFromFile(file: string) {
  return file.replace(/\.(md|mdx)$/i, '')
}

async function readDocByName(name: string): Promise<string | null> {
  const candidates = [path.join(COMPONENT_DOCS_DIR, `${name}.md`), path.join(COMPONENT_DOCS_DIR, `${name}.mdx`)]
  for (const file of candidates) {
    try {
      const content = await fs.readFile(file, 'utf8')
      return content
    } catch {
      // try next
    }
  }
  return null
}

// 解析简单的 Markdown frontmatter（YAML 风格）
type Frontmatter = {
  title?: string
  tags?: string[]
  props?: Array<{ name: string; type?: string; required?: boolean; description?: string }>
}

function parseFrontmatter(text: string): { fm: Frontmatter; body: string } {
  const fm: Frontmatter = {}
  if (text.startsWith('---')) {
    const end = text.indexOf('\n---', 3)
    if (end > 0) {
      const raw = text.slice(3, end).trim()
      const body = text.slice(end + 4)
      // 非严格 YAML：支持 "key: value" 与简单数组格式
      const lines = raw.split(/\r?\n/)
      let currentArrayKey: keyof Frontmatter | null = null
      let tempArray: any[] = []
      for (const line of lines) {
        const m = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/)
        if (m) {
          // 如果有挂起数组，先收集
          if (currentArrayKey) {
            ; (fm as any)[currentArrayKey] = tempArray
            currentArrayKey = null
            tempArray = []
          }
          const key = m[1]
          const val = m[2]
          if (val === '' && (key === 'tags' || key === 'props')) {
            // 进入数组块
            currentArrayKey = key as any
            tempArray = []
          } else {
            if (key === 'title' && val) fm.title = val
            else if (key === 'tags' && val) fm.tags = val.split(',').map((s) => s.trim()).filter(Boolean)
          }
        } else if (/^\s*-\s+/.test(line) && currentArrayKey) {
          const itemStr = line.replace(/^\s*-\s+/, '')
          if (currentArrayKey === 'tags') {
            tempArray.push(itemStr)
          } else if (currentArrayKey === 'props') {
            // 支持 "name: type - description" 或仅 name
            const mm = itemStr.match(/^([A-Za-z0-9_]+)\s*:\s*([^\-]+)?(?:-\s*(.*))?$/)
            if (mm) {
              const n = (mm[1] ?? '').trim()
              const t = mm[2] ? mm[2].trim() : undefined
              const d = mm[3] ? mm[3].trim() : undefined
              tempArray.push({ name: n, type: t, description: d })
            } else {
              tempArray.push({ name: itemStr })
            }
          }
        }
      }
      if (currentArrayKey) {
        ; (fm as any)[currentArrayKey] = tempArray
      }
      return { fm, body }
    }
  }
  return { fm, body: text }
}

// 资源：component 文档，URI 形如 component://{name}
server.registerResource(
  'component-doc',
  new ResourceTemplate('component://{name}', {
    // 列出所有可用文档
    list: async () => {
      await ensureDocsDir()
      const files = await listDocFiles()
      return {
        resources: files.map((f: string) => ({
          name: nameFromFile(f),
          uri: `component://${nameFromFile(f)}`,
          title: `${nameFromFile(f)} 文档`,
          description: `组件 ${nameFromFile(f)} 的文档资源`,
        })),
      }
    },
  }),
  {
    title: '组件文档',
    description: '根据组件名称返回 Markdown/MDX 文档内容',
  },
  async (uri, { name }) => {
    await ensureDocsDir()
    const content = await readDocByName(name as string)
    if (!content) {
      return {
        contents: [{ uri: uri.href, text: `未找到组件文档：${name}` }],
      }
    }
    return {
      contents: [{ uri: uri.href, text: content }],
    }
  }
)

// 工具：列出所有组件名称
server.registerTool(
  'list_components',
  {
    title: '列出组件',
    description: '扫描组件文档目录，返回所有组件名称',
    inputSchema: {},
  },
  async () => {
    await ensureDocsDir()
    const files = await listDocFiles()
    const names = files.map(nameFromFile)
    return { content: [{ type: 'text', text: JSON.stringify(names) }] }
  }
)

// 工具：获取组件文档
server.registerTool(
  'get_component_doc',
  {
    title: '获取组件文档',
    description: '根据组件名称返回 Markdown/MDX 文档内容',
    inputSchema: { name: z.string().describe('组件名称') },
  },
  async ({ name }) => {
    await ensureDocsDir()
    const content = await readDocByName(name)
    const text = content ?? `未找到组件文档：${name}`
    return { content: [{ type: 'text', text }] }
  }
)

// 工具：全文搜索组件文档（简单包含匹配）
server.registerTool(
  'search_docs',
  {
    title: '搜索组件文档',
    description: '在组件文档内进行简单包含匹配搜索，返回命中条目与片段',
    inputSchema: { query: z.string().min(1).describe('搜索关键字') },
  },
  async ({ query }) => {
    await ensureDocsDir()
    const files = await listDocFiles()
    const results: Array<{ name: string; snippet: string; title?: string; tags?: string[] }> = []
    for (const file of files) {
      try {
        const full = await fs.readFile(path.join(COMPONENT_DOCS_DIR, file), 'utf8')
        const { fm, body } = parseFrontmatter(full)
        const haystack = `${fm.title ?? ''}\n${(fm.tags ?? []).join(' ')}\n${body}`.toLowerCase()
        const idx = haystack.indexOf(query.toLowerCase())
        if (idx >= 0) {
          const start = Math.max(0, idx - 60)
          const end = Math.min(haystack.length, idx + query.length + 60)
          const snippet = haystack.slice(start, end).replace(/\n/g, ' ')
          const item: { name: string; snippet: string; title?: string; tags?: string[] } = {
            name: nameFromFile(file),
            snippet,
          }
          if (fm.title) item.title = fm.title
          if (fm.tags) item.tags = fm.tags
          results.push(item)
        }
      } catch {
        // ignore this file
      }
    }
    return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] }
  }
)

// 工具：根据需求生成界面样板代码
server.registerTool(
  'generate_ui',
  {
    title: '生成界面代码',
    description:
      '根据描述与选定组件生成高质量界面代码。可选框架：react、vue。可通过环境变量 COMPONENT_IMPORT_BASE 指定组件库导入路径。',
    inputSchema: {
      framework: z.enum(['react', 'vue']).describe('目标框架'),
      components: z.array(z.string()).describe('将要使用的组件名称列表'),
      goal: z.string().describe('界面目标与描述，如“创建支付表单，包含金额与备注”'),
      style: z.string().optional().describe('可选的样式偏好或主题信息'),
    },
  },
  async ({ framework, components, goal, style }) => {
    const importNames = components.join(', ')

    // 基于文档尝试提取 props，生成占位属性
    const propsByComp: Record<string, Array<{ name: string; type?: string }>> = {}
    for (const comp of components) {
      const doc = await readDocByName(comp)
      if (doc) {
        const { fm } = parseFrontmatter(doc)
        if (fm.props && fm.props.length) propsByComp[comp] = fm.props
      }
    }
    if (framework === 'react') {
      const code = `import React from 'react'
import { ${importNames} } from '${COMPONENT_IMPORT_BASE}'

export default function GeneratedUI() {
  // 目标：${goal}${style ? `\n  // 风格：${style}` : ''}
  return (
    <div style={{ padding: 16 }}>
      {/* TODO: 组装以下组件实现目标 */}
      ${components
          .map((c) => {
            const props = (propsByComp[c] || []).slice(0, 3).map((p) => `${p.name}={/* ${p.type ?? 'any'} */}`).join(' ')
            return `<${c} ${props} />`
          })
          .join('\n      ')}
    </div>
  )
}
`
      return { content: [{ type: 'text', text: code }] }
    } else {
      // vue
      const code = `<template>
  <div class="generated-ui">
    <!-- 目标：${goal} -->
    ${components
          .map((c) => {
            const props = (propsByComp[c] || []).slice(0, 3).map((p) => `:${p.name}="/* ${p.type ?? 'any'} */"`).join(' ')
            return `<${c} ${props} />`
          })
          .join('\n    ')}
  </div>
</template>

<script setup lang="ts">
import { ${importNames} } from '${COMPONENT_IMPORT_BASE}'
// ${style ? `风格：${style}` : ''}
</script>

<style scoped>
.generated-ui { padding: 16px; }
</style>
`
      return { content: [{ type: 'text', text: code }] }
    }
  }
)

// 工具：建议组件 Props（从文档 frontmatter 提取）
server.registerTool(
  'suggest_props',
  {
    title: '建议组件 Props',
    description: '根据组件文档 frontmatter 中的 props 列表给出建议属性',
    inputSchema: { name: z.string().describe('组件名称') },
  },
  async ({ name }) => {
    const doc = await readDocByName(name)
    if (!doc) return { content: [{ type: 'text', text: `未找到组件文档：${name}` }] }
    const { fm } = parseFrontmatter(doc)
    const props = fm.props ?? []
    return { content: [{ type: 'text', text: JSON.stringify(props, null, 2) }] }
  }
)

// 资源：提供一个使用指南 prompt（作为资源暴露，便于客户端引用）
server.registerResource(
  'component-usage-prompt',
  new ResourceTemplate('prompt://component-usage', { list: undefined }),
  { title: '组件使用指南', description: '指导 LLM 如何调用组件工具与资源生成高质量界面' },
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        text:
          `建议工作流:\n` +
          `1) 使用 list_components 获取可用组件列表；\n` +
          `2) 用 get_component_doc 或资源 component://{name} 阅读目标组件文档；\n` +
          `3) 若需要属性建议，用 suggest_props；\n` +
          `4) 调用 generate_ui 生成 React/Vue 样板代码，并根据需求微调；\n` +
          `5) 如需快速查找，使用 search_docs 以关键字检索文档与标签。`,
      },
    ],
  })
)

// 保留 demo：简单加法工具（便于快速连通性测试）
server.registerTool(
  'add',
  {
    title: '加法工具',
    description: '将两个数字相加',
    inputSchema: { a: z.number(), b: z.number() },
  },
  async ({ a, b }) => ({ content: [{ type: 'text', text: `结果是：${a + b}` }] })
)

// 通过标准输入输出接收和发送消息
const transport = new StdioServerTransport()
await server.connect(transport);
import type { IncomingMessage, ServerResponse } from 'node:http'
import path from 'node:path'
import type { Connect, Plugin } from 'vite'
import {
  ApiError,
  createToolRecord,
  deleteToolRecord,
  readTools,
  updateToolRecord,
  writeTools,
} from './toolsJsonStore'

const API_PREFIX = '/api/tools'
const MAX_BODY_BYTES = 100 * 1024

type Mutate = <T>(task: () => Promise<T>) => Promise<T>

function sendJson(res: ServerResponse, status: number, data: unknown): void {
  if (status === 204) {
    res.statusCode = 204
    res.end()
    return
  }
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(data))
}

function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let size = 0
    let tooLarge = false

    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        tooLarge = true
        return
      }
      chunks.push(chunk)
    })

    req.on('end', () => {
      if (tooLarge) {
        reject(new ApiError(413, '请求体过大'))
        return
      }
      if (chunks.length === 0) {
        resolve({})
        return
      }
      try {
        const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'))
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          reject(new ApiError(400, '请求体必须是 JSON 对象'))
          return
        }
        resolve(parsed as Record<string, unknown>)
      } catch {
        reject(new ApiError(400, '请求体不是合法 JSON'))
      }
    })

    req.on('error', () => reject(new ApiError(400, '读取请求体失败')))
  })
}

async function handleToolRequest(
  req: IncomingMessage,
  res: ServerResponse,
  dataFile: string,
  mutate: Mutate,
): Promise<void> {
  const pathname = new URL(req.url ?? '/', 'http://localhost').pathname.replace(/\/+$/, '') || '/'
  const method = req.method ?? 'GET'

  if (pathname === '/' && method === 'GET') {
    sendJson(res, 200, await readTools(dataFile))
    return
  }

  if (pathname === '/' && method === 'POST') {
    const body = await readJsonBody(req)
    const tool = await mutate(async () => {
      const tools = await readTools(dataFile)
      const mutation = createToolRecord(tools, body)
      await writeTools(dataFile, mutation.tools)
      return mutation.tool
    })
    sendJson(res, 201, tool)
    return
  }

  const idMatch = /^\/([^/]+)$/.exec(pathname)
  if (!idMatch) {
    sendJson(res, 404, { message: '接口不存在' })
    return
  }
  const id = decodeURIComponent(idMatch[1]!)

  if (method === 'PUT') {
    const body = await readJsonBody(req)
    const tool = await mutate(async () => {
      const tools = await readTools(dataFile)
      const mutation = updateToolRecord(tools, id, body)
      await writeTools(dataFile, mutation.tools)
      return mutation.tool
    })
    sendJson(res, 200, tool)
    return
  }

  if (method === 'DELETE') {
    await mutate(async () => {
      const tools = await readTools(dataFile)
      const mutation = deleteToolRecord(tools, id)
      await writeTools(dataFile, mutation.tools)
    })
    sendJson(res, 204, null)
    return
  }

  sendJson(res, 405, { message: '不支持的请求方法' })
}

/**
 * 开发环境 mock API：/api/tools 直接读写 src/data/tools.json。
 * 仅 apply: 'serve'，构建产物不包含此中间件。
 */
export function toolsApiPlugin(): Plugin {
  return {
    name: 'onion-tools-api',
    apply: 'serve',
    configureServer(server) {
      const dataFile = path.resolve(server.config.root, 'src/data/tools.json')
      let queue: Promise<unknown> = Promise.resolve()

      const mutate: Mutate = (task) => {
        const run = queue.then(task, task)
        queue = run.then(
          () => undefined,
          () => undefined,
        )
        return run
      }

      const handler: Connect.NextHandleFunction = (req, res) => {
        handleToolRequest(req, res, dataFile, mutate).catch((error: unknown) => {
          const status = error instanceof ApiError ? error.status : 500
          const message = error instanceof Error ? error.message : '服务器内部错误'
          if (!res.headersSent) {
            sendJson(res, status, { message })
          } else {
            res.end()
          }
        })
      }

      server.middlewares.use(API_PREFIX, handler)
    },
  }
}

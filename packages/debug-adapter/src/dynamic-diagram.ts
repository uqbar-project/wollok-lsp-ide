import { Server, Socket } from 'socket.io'
import express from 'express'
import http from 'http'
import cors from 'cors'
import {
  getDataDiagram,
} from 'wollok-web-tools'
import {
  getDynamicDiagramData,
  Interpreter,
  Package,
} from 'wollok-ts'
export type DynamicDiagramOptions = {
  host: string
  port: string
}
export type DynamicDiagramClient = {
  onReload: (interpreter: Interpreter) => void
  enabled: boolean
  server?: http.Server // only for testing purposes
}

export function initializeDynamicDiagram(
  _interpreter: Interpreter,
  options: DynamicDiagramOptions,
  rootPackage: Package,
  startDiagram = true,
): DynamicDiagramClient {
  if (!startDiagram) return { onReload: () => {}, enabled: false }

  const { host, port } = options
  let interpreter = _interpreter

  const app = express()
  const server = http.createServer(app)
  const io = new Server(server)

  io.on('connection', (socket: Socket) => {
    socket.on('disconnect', () => {
      console.debug('Dynamic diagram closed')
    })
    // INITITALIZATION
    socket.emit('initDiagram', options)
    const diagram = getDynamicDiagram(interpreter, rootPackage)
    socket.emit('updateDiagram', diagram)
  })

  app.use(
    cors({ allowedHeaders: '*' }),
    express.static(publicPath('diagram'), { maxAge: '1d' }),
  )

  server.addListener('error', console.error)
  server.addListener('listening', () => {
    console.info(`Dynamic diagram available at: ${`http://${host}:${port}`}`)
  })

  server.listen(parseInt(port), host)

  return {
    onReload: (maybeNewinterpreter: Interpreter) => {
      if (interpreter !== maybeNewinterpreter) {
        interpreter = maybeNewinterpreter
      }
      io.emit('updateDiagram', getDynamicDiagram(interpreter, rootPackage))
    },
    enabled: true,
    server,
  }
}

export function getDynamicDiagram(
  interpreter: Interpreter,
  rootFQN?: Package,
): any[] {
  const objects = getDynamicDiagramData(interpreter, rootFQN)
  try {
    const diagram = getDataDiagram(objects.map(o => o.label ? o : { ...o, label: 'esto esta too roto' }))

    return diagram

  } catch (e) {
    console.error('Error generating dynamic diagram', e)
    return []
  }
}
function publicPath(folder: string): string {
  return (
    '/Users/ivanjawerbaum/Documents/repos/uqbar/wollok-lsp-ide/public/' + folder
  )
}

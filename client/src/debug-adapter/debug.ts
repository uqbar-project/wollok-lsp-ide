import { WollokDebugSession } from './debug-session'

console.log('holaaaa')
process.stdout.emit('holaaaa')


const session = new WollokDebugSession()

process.on('SIGTERM', () => {
  session.shutdown()
})

session.start(process.stdin, process.stdout)

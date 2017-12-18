require('./config')
const debug = require('debug')('dcdn:Service')
const cdn = require('./lib/DCDN')

const shutdown = () => {
  debug('Shutting down...')
  cdn.close()
  process.exit(1)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
process.on('uncaughtException', debug)
process.on('unhandledRejection', debug)

;(async () => {
  await cdn.init(process.env.DAT_KEY)
})()

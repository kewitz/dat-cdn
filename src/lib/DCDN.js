const Dat = require('dat-node')
const debug = require('debug')('dcdn:Core')
const { downloadPackage } = require('./package')
const { promisify } = require('util')

const { BASE_PATH } = process.env

class DCDN {
  constructor () {
    if (!DCDN._) DCDN._ = this
    return DCDN._
  }

  async init (key) {
    this.dat = await promisify(Dat).call(Dat, BASE_PATH, { key })
    this.ddns = `dat://${this.dat.key.toString('hex')}\nTTL=3600`
    await promisify(this.dat.joinNetwork).call(this.dat)
    if (!key) {
      debug(`Joined Dat netowrk as the master node with key ${this.dat.key.toString('hex')}`)
      this.dat.importFiles({ watch: true })
    } else {
      const { total } = this.dat.trackStats().peers
      debug(`Joined Dat network with key ${this.dat.key.toString('hex')} and connected to ${total} peers.`)
    }
  }

  async close () {
    debug('Shutting down...')
    await promisify(this.dat.close).call(this.dat)
  }

  async addPackage (packname) {
    if (this.dat.writable) {
      debug(`Adding package ${packname}...`)
      await downloadPackage(packname)
    } else {
      debug(`Can't add package, I'm not the main node.`)
    }
  }
}

const instance = new DCDN()

module.exports = instance

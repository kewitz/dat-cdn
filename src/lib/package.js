const compareVersion = require('compare-version')
const debug = require('debug')('dcdn:Package')
const download = require('download')
const fs = require('fs-extra')
const LRU = require('lru-cache')
const jsdelivr = require('jsdelivr')
const path = require('path')
const { promisify } = require('util')

const { BASE_PATH } = process.env
const requests = LRU(50)

const first = array => [ ...array ][0]

const toCollection = ({ versions }) =>
  Object
    .keys(versions)
    .sort(compareVersion).reverse()
    .map(version => {
      return { version, url: `https:${versions[version]}` }
    })

const getFolder = (name, version) =>
  path.join(BASE_PATH, name, version)

const getVersions = async name => {
  const cached = requests.get(name)
  if (cached) return cached
  else {
    const packages = await promisify(jsdelivr.url)
      .call(jsdelivr, name)
      .then(toCollection)
    requests.set(name, packages)
    return packages
  }
}

const downloadAll = async (name) => {
  const versions = await getVersions(name)
  for (const pack of versions) {
    await downloadPackage(name, pack.version)
  }
}

const downloadPackage = async (name, version) => {
  if (name.match('@')) [ name, version ] = name.split('@')
  if (version === '*') return downloadAll(name)

  const folder = getFolder(name, version)
  const downloaded = await fs.exists(folder)
  if (!downloaded) {
    const versions = await getVersions(name)
    const pack = first(versions.filter(v => v.version === version))
    if (pack) {
      debug(`Downloading ${name}`, pack)
      try {
        await fs.ensureDir(folder)
        await download(pack.url, folder)
      } catch (err) {
        await fs.rmdir(folder)
        throw err
      }
    } else debug(`${name}@${version} doesn't exists`)
  } else debug(`${name}@${version} already exists`)
}

module.exports = {
  downloadPackage
}

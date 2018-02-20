const fs = require('fs')

const debug = require('debug')('writeTSV')
const csvWriter = require('csv-write-stream')
const intoStream = require('into-stream')

async function writeTSV (arr, output) {
  return new Promise((resolve, reject) => {
    const keys = Object.keys(arr[0])

    debug(`[${output}] headers: ${keys}`)
    debug(`[${output}] starting`)

    const stream = intoStream.obj(arr)
      .pipe(csvWriter({
        separator: '\t',
        headers: keys
      }))
      .pipe(fs.createWriteStream(output))

    stream
      .on('finish', () => {
        fs.stat(output, (err, stat) => {
          if (err) return reject(err)

          debug(`[${output}] finished, ${stat.size} bytes`)
          return resolve(output)
        })
      })
      .on('error', reject)
  })
}

module.exports = writeTSV

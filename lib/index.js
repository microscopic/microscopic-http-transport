'use strict'

const http = require('http')

const utils = require('microscopic-utils')
const Asserts = utils.asserts
const Json = utils.json
const IP = utils.ip

const Transport = require('microscopic-transport')

class HTTPTransport extends Transport {
  /**
   * @inheritDoc
   */
  listen (service) {
    Asserts.assert(typeof service.onMessage === 'function', new TypeError('Does not have `onMessage` method'))

    return new Promise((resolve) => {
      this.server = http.createServer((req, res) => {
        _bodyParse(req)
          .then((message) => {
            const reply = (error, response) => res.end(Json.stringify({ id: message.id, result: response }))

            service.onMessage(message, reply)
          })
      })

      this.server.listen(() => {
        resolve({ address: IP.getIP(), port: this.server.address().port })
      })
    })
  }

  /**
   * @inheritDoc
   */
  send (connectionConfig, msg, callback) {
    const message = super.createMessage(msg, callback)

    const options = {
      hostname: connectionConfig.address,
      port: connectionConfig.port,
      method: 'POST'
    }

    const request = http.request(options, (res) => {
      res.setEncoding('utf8')
      res.on('data', (data) => super.onResponse(Json.parse(data)))
    })

    request.write(Json.stringify(message))
    request.end()
  }
}

/**
 * Helper method to parse body request.
 *
 * @param {http.ClientRequest} request
 * @return {Promise}
 * @private
 */
function _bodyParse (request) {
  return new Promise((resolve) => {
    let body = []

    request.on('data', (chunk) => {
      body.push(chunk)
    }).on('end', () => {
      body = Buffer.concat(body).toString()
      resolve(Json.parse(body))
    })
  })
}

module.exports = HTTPTransport

'use strict'

const chai = require('chai')

const expect = chai.expect

const HTTPTransport = require('../lib/index')

describe('TCP Transport', () => {
  describe('listen()', () => {
    it('should throw error if service does not have `onMessage` method', () => {
      expect(() => new HTTPTransport().listen({})).to.throw()
    })

    it('should return promise', () => {
      expect(new HTTPTransport().listen({ onMessage: () => 1 })).to.be.instanceOf(Promise)
    })

    it('should return connection config', (done) => {
      new HTTPTransport().listen({ onMessage: () => 1 })
        .then((connectionConfig) => {
          expect(connectionConfig).to.have.all.keys([ 'address', 'port' ])

          done()
        })
    })
  })

  describe('communication', () => {
    it('client should be able to communication with server ', (done) => {
      const service = {
        onMessage: (message, reply) => {
          expect(message.a).to.be.equal(1)

          reply(null, { result: 'ok' })
        }
      }

      const client = new HTTPTransport()

      new HTTPTransport().listen(service)
        .then((connectionConfig) => {
          client.send(connectionConfig, { a: 1 }, (error, response) => {
            expect(response.result).to.be.equal('ok')

            done()
          })
        })
    })
  })
})

const Hapi = require('hapi')
const path = require('path')
const fs = require('fs-extra')
const HapiWebMonetization = require('..')
const monetization = new HapiWebMonetization()

const server = Hapi.server({
  port: 8080,
  host: 'localhost'
})

function payMiddleware (request, reply) {
  return monetization.paid(request, reply, { price: 100, awaitBalance: true })
}

const start = async () => {
  await server.register(require('inert'))

  server.route([
    {
      method: 'GET',
      path: '/',
      handler: function (request, reply) {
        return reply.file('./example/index.html')
      }
    },
    {
      method: 'GET',
      path: '/pay/{id}',
      handler: async function (request, reply) {
        return monetization.receive(request, reply)
      }
    },
    {
      method: 'GET',
      path: '/content/{id}',
      config: {
        pre: [
          {
            method: payMiddleware,
            assign: 'paid'
          }
        ],
        handler: async function (request, reply) {
          const file = await fs.readFile(path.resolve(__dirname, 'content.jpg'))
          return file
        }
      }
    },
    {
      method: 'GET',
      path: '/client.js',
      handler: async function (request, reply) {
        const clientFile = await fs.readFile(path.resolve(__dirname, '../client.js'))
        return reply.response(clientFile)
      }
    }
  ])

  await server.start()

  console.log('Server running at:', server.info.uri)
}

start()

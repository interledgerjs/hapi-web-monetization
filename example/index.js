const Hapi = require('hapi')
const path = require('path')
const fs = require('fs-extra')
// const HapiWebMonetization = require('..')
// const monetization = new HapiWebMonetization()

// Register on top of Yar, and  check if monetized based on balance === 0; Build on top yar. Set ID of paying user. Server generates cookie. registered whole thing. generate ID on server side. .startPaying. monetizer.start
const server = Hapi.server({
  port: 8080,
  host: 'localhost'
})

// function payMiddleware (request, reply) {
//   return monetization.paid(request, reply, { price: 100, awaitBalance: true })
// }

const start = async () => {
  await server.register(require('inert'))
  await server.register(require('..'))
  server.state('data', {
    ttl: null,     // One day
    isSecure: false,
    isHttpOnly: true,
    encoding: 'base64json',
    clearInvalid: false,
  });
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
      path: '/getMonetizationId',
      handler: function (request, reply) {
        return request.monetizer.generateAndStoreId(request, reply);
      }
    },
    {
      method: 'GET',
      path: '/pay/{id}',
      handler: function(request, reply) {
        return request.monetizer.receive(request, reply);
      }
    },
    {
      method: 'GET',
      path: '/content/',
      config: {

        handler: async function (request, reply) {
          request.monetizer.spend(100)
          await request.monetizer.awaitBalance(100)
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

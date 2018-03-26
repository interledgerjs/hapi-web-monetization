const Hapi = require('hapi');
const path = require('path')
const fs = require('fs-extra')
const HapiWebMonetization = require('..')
const monetization = new HapiWebMonetization()

const server = Hapi.server({
  port: 8080,
  host: 'localhost'
})

function payMiddleware (request, reply) {
  return monetization.paid({ price: 100, awaitBalance: true })
}


const start = async () => {
  await server.register(require('inert'))

  server.route([
    {
      method: 'GET',
      path: '/',
      handler: function (request, h) {
        console.log("WE IN HERE")
        return h.file('./example/index.html')
      }
    },
    {
      method: 'GET',
      path: '/pay/{id}',
      handler: async function (request, reply) {
        return monetization.receiver(request, reply)
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
        handler: function (request, reply) {
          console.log("get content")
          return {paid: true}
        }
      }
    },
    {
      method: 'GET',
      path: '/client.js',
      handler: async function (request, h) {
        // console.log("INHER")
        const clientFile = await fs.readFile(path.resolve(__dirname, '../client.js'))
        console.log("clientFile", clientFile)
        return h.response(clientFile)
      }
    }
  ])

  await server.start()

  console.log('Server running at:', server.info.uri)
}

start()

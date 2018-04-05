const Hapi = require('hapi')
const path = require('path')
const fs = require('fs-extra')

const server = Hapi.server({
  port: 8080,
  host: 'localhost'
})

const start = async () => {
  await server.register(require('inert'))
  await server.register({
    plugin: require('..'),
    options: {
      cookieOptions: {
        isSecure: false
      }
    }
  })

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
      path: '/content/',
      handler: async function (request, reply) {
        await request.awaitBalance(100)
        request.spend(100)
        const file = await fs.readFile(path.resolve(__dirname, 'content.jpg'))
        return file
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

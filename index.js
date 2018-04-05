const Hoek = require('hoek')
const HapiWebMonetization = require('./HapiWebMonetization')

const DEFAULT_OPTIONS = {
  plugin: null,
  maxBalance: Infinity,
  receiveEndpointUrl: '/__monetizer/{id}',
  cookieName: '__monetizer',
  cookieOptions: {
    clearInvalid: true,
    ignoreErrors: true,
    isSameSite: 'Lax',
    isHttpOnly: false,
    isSecure: true,
    path: '/'
  }
}

exports.register = async (server, options, next) => {
  const settings = Hoek.applyToDefaults(DEFAULT_OPTIONS, options)

  const monetizer = new HapiWebMonetization(settings)
  await monetizer.connect()

  ;['awaitBalance', 'spend'].forEach(key => {
    server.decorate('request', key, function (amount) {
      return monetizer[key](this.state[settings.cookieName], amount)
    })
  })
  const cookieOptions = Object.assign({
    autoValue: monetizer.generatePayerId.bind(monetizer)
  }, settings.cookieOptions)
  server.state(settings.cookieName, cookieOptions)

  server.route([{
    method: 'GET',
    path: settings.receiveEndpointUrl,
    handler: monetizer.receive.bind(monetizer)
  }])
}

exports.pkg = require('./package.json')

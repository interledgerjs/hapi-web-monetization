# Hapi Web Monetization
> Charge for resources and API calls with web monetization

- [Overview](#overview)
- [Example Code](#example-code)
- [Try it Out](#try-it-out)
  - [Prerequisites](#prerequisites)
  - [Install and Run](#install-and-run)
- [API Docs](#api-docs)
  - [Server register options](#server-register-options)
  - [Client constructor options](#client-constructor-options)
  - [Charging users](#charging-users)

## Overview

Using [Interledger](https://interledger.org) for payments, [Web
Monetization](https://github.com/interledger/rfcs/blob/master/0028-web-monetization/0028-web-monetization.md#web-monetization)
allows sites to monetize their traffic without being tied to an ad network. And
because payments happen instantly, they can also be tracked on the server-side
to unlock exclusive content or paywalls.

`hapi-web-monetization` makes this easy by providing middleware for your
[Hapi](https://hapijs.com/) application. Charging your users is as easy as putting
`request.spend(100)` in your route handler. No need to convince them to
buy a subscription or donate.

## Example Code

Below is an example of some of the functions that you would use to create
paywalled content. For a complete and working example, look at the next
section.

```js
const Hapi = require('hapi')

const server = Hapi.server({
  port: 8080,
  host: 'localhost'
})

const options = {
  cookieOptions: {
    isSecure: true
  }
}

const start = async () => {
  await server.register(require('inert'))
  await server.register({
    plugin: require('hapi-web-monetization'),
    options
  })

  server.route([
    {
      method: 'GET',
      path: '/',
      handler: function (request, reply) {
        // Load index page
      }
    },
    {
      method: 'GET',
      path: '/content/',
      handler: async function (request, reply) {
        await request.awaitBalance(100)
        request.spend(100)
        // Send paid content
      }
    },
  ])

  await server.start()

  console.log('Server running at:', server.info.uri)
}

start()

```

The client side code to support this is very simple too:

```html
<script src="node_modules/hapi-web-monetization/client.js"></script>
<script>
  var monetizerClient = new MonetizerClient();
  monetizerClient.start()
    .then(function() {
      var img = document.createElement('img')
      var container = document.getElementById('container')
      img.src = '/content/'
      img.width = '600'
      container.appendChild(img)
    })
    .catch(function(error){
      console.log("Error", error);
    })
</script>
```

## Try it out

This repo comes with an example server that you can run. It serves a page that has a single paywalled image on it.
The server waits for money to come in and then shows the image.

### Prerequisites

- You should be running [Moneyd](https://github.com/interledgerjs/moneyd-xrp)
  for Interledger payments. [Local
  mode](https://github.com/interledgerjs/moneyd-xrp#local-test-network) will work
  fine.

- Build and install the [Minute](https://github.com/sharafian/minute)
  extension. This adds Web Monetization support to your browser.

### Install and Run

```sh
git clone https://github.com/andywong418/hapi-web-monetization.git
cd hapi-web-monetization
npm install
DEBUG=* node example/index.js
```

Now go to [http://localhost:8080](http://localhost:8080), and watch the server
logs.

If you configured Minute and Moneyd correctly, you'll start to see that money
is coming in. Once the user has paid 100 units, the example image will load on
the page.

## API Docs
### Server register options

```ts
  server.register({
    plugin: require('hapi-web-monetization'),
    options : Object | void
  })
```

Registers a new `HapiWebMonetization` plugin which creates and sets cookie for the payer ID in the browser.
- `options.plugin` - Supply an ILP plugin. Defaults to using Moneyd.
- `options.maxBalance` - The maximum balance that can be associated with any user. Defaults to `Infinity`.
- `options.receiveEndpointUrl` - The endpoint in your Hapi route configuration that specifies where a user pays streams PSK packets to your site. Defaults to `/__monetizer/{id}` where `{id}` is the server generated ID (stored in the browser as a cookie).
- `options.cookieName` - The cookie key name for your server generated payer ID. Defaults to `__monetizer`.
- `options.cookieOptions` - Cookie configurations for Hapi. See [Hapi server state options](https://hapijs.com/api#-serverstatename-options) for more details!

### Client constructor options

```ts
new MonetizerClient(options: Object | void): MonetizerClient
```
Creates a new `MonetizerClient` instance.

- `options.url` - The url of the server that is registering the HapiWebMonetization plugin. Defaults to `new URL(window.location).origin`
- `options.cookieName` - The cookie key name that will be saved in your browser. Defaults to `__monetizer`. This MUST be the same has `options.cookieName` in the server configuration.
- `options.receiverUrl` - The endpoint where users of the site can start streaming packets via their browser extension or through the browser API. Defaults to `options.url + '__monetizer/:id'` where id is the server generated payer ID. This MUST be the same has `options.receiverEndpointUrl` in the server configuration.

### Charging users

The methods `request.spend()` and `request.awaitBalance()` are available to use inside handlers.

```ts
request.spend(amount): Function
```
Specifies how many units to charge the user.

```ts
request.awaitBalance(amount): Function
```
Waits until the user has sufficient balance to pay for specific content.
`awaitBalance` can be useful for when a call is being done at page start.
Rather than immediately failing because the user hasn't paid, the server will
wait until the user has paid the specified price.

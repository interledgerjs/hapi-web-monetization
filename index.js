const {createReceiver} = require('ilp-protocol-psk2')
const EventEmitter = require('events')
const getIlpPlugin = require('ilp-plugin')
const debug = require('debug')('hapi-web-monetization')
const Boom = require('boom')

class HapiWebMontezation {
  constructor(opts) {
    this.connect = false
    this.plugin = (opts && opts.plugin) || getIlpPlugin()
    this.buckets = new Map()
    this.balanceEvents = new EventEmitter()
    // Max balance is set so that user does not have an infinite amount of credit on site.
    this.maxBalance = (opts && opts.maxBalance) || Infinity
  }

  async connect() {
    if (this.connected) return
    this.connected = true
    await this.plugin.connect()
    // Start crediting the balance of a user on the site every second.
    this.receiver = await createReceiver({
      plugin: this.plugin,
      paymentHandler: async params => {
        const amount = params.prepare.amount
        const id = params.prepare.destination.split('.').slice(-3)[0]

        let balance = this.buckets.get(id) || 0
        balance = Math.min(balance + Number(amount), this.maxBalance)
        this.buckets.set(id, balance)
        setImmediate(() => this.balanceEvents.emit(id, balance))
        debug('got money for bucket. amount=' + amount,
          'id=' + id,
          'balance=' + balance)
        // Wait for chunk of payment to be accepted before calling again.
        await params.acceptSingleChunk()
      }
    })
  }

  spend (id, price) {
    // Spend credit accumulated from browser monetising user on site. E.g. Viewing paid content.
    const balance = this.buckets.get(id)
    if(balance < price) {
      throw new Error('insufficient balance on id.' +
      ' id=' + id,
      ' price=' + price,
      ' balance=' + balance)
    }
    debug('spent credit, id=' + id, 'price=' + price)
    this.buckets.set(id, balance - price)
  }

  paid ({price, awaitBalance = false }) {
    // Returns async function which is passed as middleware
    return async (request, reply) => {
      const id = request.params.id

      if (!id) {
        return ctx.throw(400, 'request.params.id must be defined')
      }

      const _price = (typeof price === 'function')
        ? Number(price(ctx))
        : Number(price)

      if (awaitBalance) {
        await this.awaitBalance(id, _price)
      }

      try {
        this.spend(id, _price)
        return reply('Spent!')
      } catch (e) {
        throw Boom.notFound(e.message)
      }
    }
  }
}

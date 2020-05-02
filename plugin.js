'use strict'

const fp = require('fastify-plugin')
const { defaultOptions, supportedParsers } = require('./default-options')

const fastifyLP = (fastify, opts, next) => {
  const options = Object.assign({}, defaultOptions, opts)

  fastify.decorateRequest('detectedLng', options.fallbackLng)

  const parsers = options.order

  if (!Array.isArray(parsers)) {
    return next(new Error('options.order has to be an array'))
  }

  if (!parsers.length) {
    return next(new Error('options.order has to contain at least one parser.'))
  }

  parsers.map(name => {
    if (supportedParsers.indexOf(name) === -1) {
      return next(new Error(`${name} is not a valid language parser`))
    }

    if (options.order.indexOf(name) !== options.order.lastIndexOf(name)) {
      return next(new Error(`${name} parser found  multiple times in order option. Try scope your routes instead.`))
    }

    fastify.addHook(
      'preHandler',
      require('./parser')(name, options)
    )
  })

  next()
}

module.exports = fp(fastifyLP, {
  fastify: '>=3.0.0',
  name: 'fastify-language-parser'
})

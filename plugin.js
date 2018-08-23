'use strict'

const fp = require('fastify-plugin')

const defaultOptions = {
  cookieDecorator: 'cookies',
  cookieKey: 'fastifyLanguageParser',
  order: [],
  headerDecorator: 'headers',
  headerKey: 'accept-language',
  fallbackLng: 'en',
  pathDecorator: 'params',
  pathKey: 'lng',
  queryDecorator: 'query',
  queryKey: 'lng',
  sessionDecorator: 'session',
  sessionKey: 'fastifyLanguageParser',
  supportedLngs: []
}

const supportedParsers = ['cookie', 'header', 'path', 'query', 'session']

const fastifyLP = (fastify, opts, next) => {
  const options = Object.assign({}, defaultOptions, opts)

  fastify.decorateRequest('detectedLng', options.fallbackLng)

  const parsers = options.order

  if (!Array.isArray(parsers)) {
    return next(new Error(`options.order has to be an array`))
  }

  parsers.map(name => {
    const parserOptions = Object.assign({}, {
      decorator: options[`${name}Decorator`],
      key: options[`${name}Key`],
      supportedLngs: options.supportedLngs
    })

    if (supportedParsers.indexOf(name) === -1) {
      return next(new Error(`${name} is not a valid language parser`))
    }

    if (options.order.indexOf(name) !== options.order.lastIndexOf(name)) {
      return next(new Error(`${name} parser found  multiple times in order option. Try scope your routes instead.`))
    }

    fastify.addHook(
      'preHandler',
      require('./parsers')(name, parserOptions)
    )
  })

  next()
}

module.exports = fp(fastifyLP, {
  fastify: '>=1.0.0',
  name: 'fastify-language-parser'
})

const fp = require('fastify-plugin')
const acceptLanguageParser = require('accept-language-parser')

const defaultOptions = {
  cookieDecorator: 'cookies',
  cookieKey: 'fastifyLanguageParser',
  order: [],
  fallbackLng: 'en',
  pathParam: 'lng',
  queryString: 'lng',
  sessionDecorator: 'session',
  sessionKey: 'fastifyLanguageParser',
  supportedLngs: ['en']
}

const fastifyLP = (fastify, opts, next) => {
  const options = Object.assign({}, defaultOptions, opts)

  fastify.decorateRequest('detectedLng', options.fallbackLng)

  options.order.map(name => {
    if (name !== 'session' && typeof detectors[name] !== 'function') {
      return next(new Error(`${name} is not a valid language detector`))
    }

    if (name === 'session') {
      fastify.addHook(
        'preHandler',
        detectors['cookie'](Object.assign({}, options, { session: true }))
      )
    } else {
      fastify.addHook('preHandler', detectors[name](options))
    }
  })

  next()
}

const detectors = {
  cookie: function (opts) {
    const { supportedLngs } = opts
    let decorator = opts.cookieDecorator
    let key = opts.cookieKey

    if (opts.session) {
      decorator = opts.sessionDecorator
      key = opts.sessionKey
    }

    return function (req, res, next) {
      if (req[decorator] && req[decorator][key]) {
        const found = req[decorator][key]
        if (supportedLngs.length === 0 || supportedLngs.indexOf(found) > -1) {
          req.detectedLng = found
        }
      }
      next()
    }
  },
  header: function (opts) {
    const { supportedLngs } = opts
    return function (req, res, next) {
      if (req.headers && req.headers['accept-language']) {
        const header = req.headers['accept-language']
        if (supportedLngs.length === 0) {
          req.detectedLng = acceptLanguageParser.parse(header)
        } else {
          const found = acceptLanguageParser.pick(supportedLngs, header)
          if (found) {
            req.detectedLng = found
          }
        }
      }
      next()
    }
  },
  path: function (opts) {
    const { pathParam, supportedLngs } = opts

    return function (req, res, next) {
      if (req.params && req.params[pathParam]) {
        const found = req.params[pathParam]
        if (supportedLngs.length === 0 || supportedLngs.indexOf(found) > -1) {
          req.detectedLng = found
        }
      }
      next()
    }
  },
  query: function (opts) {
    const { queryString, supportedLngs } = opts

    return function (req, res, next) {
      if (req.query && req.query[queryString]) {
        const found = req.query[queryString]
        if (supportedLngs.length === 0 || supportedLngs.indexOf(found) > -1) {
          req.detectedLng = found
        }
      }
      next()
    }
  }
}

module.exports = fp(fastifyLP, {
  fastify: '>=1.0.0',
  name: 'fastify-language-parser'
})

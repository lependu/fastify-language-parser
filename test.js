'use strict'

const tap = require('tap')
const Fastify = require('fastify')
const plugin = require('./plugin')

const { test } = tap

test('decorates request with detectedLng', t => {
  t.plan(1)
  const fastify = Fastify()

  fastify
    .register(plugin, { fallbackLng: 'hu' })
    .ready(() => {
      t.equal(fastify._Request.prototype.detectedLng, 'hu',
        'default value is fallbackLng'
      )
    })
  fastify.close()
})

test('throws if order option contains invalid detector', t => {
  t.plan(1)
  const fastify = Fastify()

  fastify
    .register(plugin, { order: ['not-exists'] })
    .after(err => {
      t.equal(err.message, 'not-exists is not a valid language detector',
        'error message matches'
      )
    })
  fastify.close()
})

test('cookie detector | without cookie', t => {
  t.plan(5)
  const fastify = Fastify()

  fastify
    .decorateRequest('cookies', {})
    .register(plugin, { order: ['cookie'], supportedLngs: [] })
    .after(err => {
      t.error(err, 'register does not throw')
      t.equal(fastify._hooks.preHandler.length, 1, 'adds preHandler hook')

      fastify.get('/', {}, (req, res) => {
        let { detectedLng } = req
        res.send({ detectedLng })
      })
    })

  fastify.inject({
    method: 'GET',
    url: '/'
  }, (err, res) => {
    t.error(err)
    const { statusCode, payload } = res
    t.equal(statusCode, 200, 'status OK')
    t.deepEqual(JSON.parse(payload), { detectedLng: 'en' },
      'returns fallbackLng'
    )
  })
  fastify.close()
})

test('cookie detector | with cookie | with supported language', t => {
  t.plan(5)
  const fastify = Fastify()

  fastify
    .decorateRequest('cookies', { fastifyLanguageParser: 'hu' })
    .register(plugin, { order: ['cookie'], supportedLngs: ['en', 'hu'] })
    .after(err => {
      t.error(err, 'register does not throw')
      t.equal(fastify._hooks.preHandler.length, 1, 'adds preHandler hook')

      fastify.get('/', {}, (req, res) => {
        let { detectedLng } = req
        res.send({ detectedLng })
      })
    })

  fastify.inject({
    method: 'GET',
    url: '/'
  }, (err, res) => {
    t.error(err)
    const { statusCode, payload } = res
    t.equal(statusCode, 200, 'status OK')
    t.deepEqual(JSON.parse(payload), { detectedLng: 'hu' },
      'with supported language in cookie returns language code'
    )
  })
  fastify.close()
})

test('cookie detector | with cookie | without supported language', t => {
  t.plan(5)
  const fastify = Fastify()

  fastify
    .decorateRequest('cookies', { fastifyLanguageParser: 'de' })
    .register(plugin, { order: ['cookie'], supportedLngs: ['en', 'hu'] })
    .after(err => {
      t.error(err, 'register does not throw')
      t.equal(fastify._hooks.preHandler.length, 1, 'adds preHandler hook')

      fastify.get('/', {}, (req, res) => {
        let { detectedLng } = req
        res.send({ detectedLng })
      })
    })

  fastify.inject({
    method: 'GET',
    url: '/'
  }, (err, res) => {
    t.error(err)
    const { statusCode, payload } = res
    t.equal(statusCode, 200, 'status OK')
    t.deepEqual(JSON.parse(payload), { detectedLng: 'en' },
      'returns language code found in cookie'
    )
  })
  fastify.close()
})

test('session detector', t => {
  t.plan(5)
  const fastify = Fastify()

  fastify
    .decorateRequest('session', { fastifyLanguageParser: 'hu' })
    .register(plugin, { order: ['session'], supportedLngs: ['en', 'hu'] })
    .after(err => {
      t.error(err, 'register does not throw')
      t.equal(fastify._hooks.preHandler.length, 1, 'adds preHandler hook')

      fastify.get('/', {}, (req, res) => {
        let { detectedLng } = req
        res.send({ detectedLng })
      })
    })

  fastify.inject({
    method: 'GET',
    url: '/'
  }, (err, res) => {
    t.error(err)
    const { statusCode, payload } = res
    t.equal(statusCode, 200, 'status OK')
    t.deepEqual(JSON.parse(payload), { detectedLng: 'hu' },
      'with supported language in session key returns language code'
    )
  })
  fastify.close()
})

test('query string detector | with supported language check', t => {
  t.plan(11)
  const fastify = Fastify()

  fastify
    .register(plugin, { order: ['query'], supportedLngs: ['en', 'hu'] })
    .after(err => {
      t.error(err, 'register does not throw')
      t.equal(fastify._hooks.preHandler.length, 1, 'adds preHandler hook')

      fastify.get('/', {}, (req, res) => {
        let { detectedLng } = req
        res.send({ detectedLng })
      })
    })

  fastify.inject({
    method: 'GET',
    url: '/'
  }, (err, res) => {
    t.error(err)
    const { statusCode, payload } = res
    t.equal(statusCode, 200, 'status OK')
    t.deepEqual(JSON.parse(payload), { detectedLng: 'en' },
      'without query string it returns fallbackLng'
    )
  })

  fastify.inject({
    method: 'GET',
    url: '/?lng=hu'
  }, (err, res) => {
    t.error(err)
    const { statusCode, payload } = res
    t.equal(statusCode, 200, 'status OK')
    t.deepEqual(JSON.parse(payload), { detectedLng: 'hu' },
      'with supported language in query string returns language code'
    )
  })

  fastify.inject({
    method: 'GET',
    url: '/?lng=de'
  }, (err, res) => {
    t.error(err)
    const { statusCode, payload } = res
    t.equal(statusCode, 200, 'status OK')
    t.deepEqual(JSON.parse(payload), { detectedLng: 'en' },
      'with not supported language in query string returns fallbackLng'
    )
  })
  fastify.close()
})

test('path detector | with supported language check', t => {
  t.plan(11)
  const fastify = Fastify()

  fastify
    .register(plugin, { order: ['path'], supportedLngs: ['en', 'hu'] })
    .after(err => {
      t.error(err, 'register does not throw')
      t.equal(fastify._hooks.preHandler.length, 1, 'adds preHandler hook')

      fastify.get('/api/:lng', {}, (req, res) => {
        let { detectedLng } = req
        res.send({ detectedLng })
      })
      fastify.get('/api', {}, (req, res) => {
        let { detectedLng } = req
        res.send({ detectedLng })
      })
    })

  fastify.inject({
    method: 'GET',
    url: '/api'
  }, (err, res) => {
    t.error(err)
    const { statusCode, payload } = res
    t.equal(statusCode, 200, 'status OK')
    t.deepEqual(JSON.parse(payload), { detectedLng: 'en' },
      'without path param it returns fallbackLng'
    )
  })

  fastify.inject({
    method: 'GET',
    url: '/api/hu'
  }, (err, res) => {
    t.error(err)
    const { statusCode, payload } = res
    t.equal(statusCode, 200, 'status OK')
    t.deepEqual(JSON.parse(payload), { detectedLng: 'hu' },
      'with supported language in path param returns language code'
    )
  })

  fastify.inject({
    method: 'GET',
    url: '/api/de'
  }, (err, res) => {
    t.error(err)
    const { statusCode, payload } = res
    t.equal(statusCode, 200, 'status OK')
    t.deepEqual(JSON.parse(payload), { detectedLng: 'en' },
      'with not supported language in path param returns fallbackLng'
    )
  })
  fastify.close()
})

test('accept-language header detector | with supported language check', t => {
  t.plan(11)
  const fastify = Fastify()

  fastify
    .register(plugin, { order: ['header'], supportedLngs: ['hu', 'en'] })
    .after(err => {
      t.error(err, 'register does not throw')
      t.equal(fastify._hooks.preHandler.length, 1, 'adds preHandler hook')

      fastify.get('/', {}, (req, res) => {
        let { detectedLng } = req
        res.send({ detectedLng })
      })
    })

  fastify.inject({
    method: 'GET',
    url: '/'
  }, (err, res) => {
    t.error(err)
    const { statusCode, payload } = res
    t.equal(statusCode, 200, 'status OK')
    t.deepEqual(JSON.parse(payload), { detectedLng: 'en' },
      'without header it returns fallbackLng'
    )
  })

  fastify.inject({
    method: 'GET',
    url: '/',
    headers: { 'accept-language': 'hu;q=0.9,en-GB,en-US;q=0.8' }
  }, (err, res) => {
    t.error(err)
    const { statusCode, payload } = res
    t.equal(statusCode, 200, 'status OK')
    t.deepEqual(JSON.parse(payload), { detectedLng: 'hu' },
      'with supported language in header returns language code'
    )
  })

  fastify.inject({
    method: 'GET',
    url: '/',
    headers: { 'accept-language': 'de;q=0.9,fr;q=0.8' }
  }, (err, res) => {
    t.error(err)
    const { statusCode, payload } = res
    t.equal(statusCode, 200, 'status OK')
    t.deepEqual(JSON.parse(payload), { detectedLng: 'en' },
      'with not supported language in header  returns fallbackLng'
    )
  })
  fastify.close()
})

test('allows to set any language if supportedLngs is empty array', t => {
  t.plan(11)
  const fastify = Fastify()

  fastify
    .register(plugin, { order: ['header', 'query', 'path'], supportedLngs: [] })
    .after(err => {
      t.error(err)
      t.equal(fastify._hooks.preHandler.length, 3, 'adds preHandler hooks')
      fastify.get('/', {}, (req, res) => {
        let { detectedLng } = req
        res.send({ detectedLng })
      })
      fastify.get('/api/:lng', {}, (req, res) => {
        let { detectedLng } = req
        res.send({ detectedLng })
      })
    })

  fastify.inject({
    method: 'GET',
    url: '/?lng=de'
  }, (err, res) => {
    t.error(err)
    const { statusCode, payload } = res
    t.equal(statusCode, 200, 'status OK')
    t.deepEqual(JSON.parse(payload), { detectedLng: 'de' },
      'returns language code found in query string'
    )
  })

  fastify.inject({
    method: 'GET',
    url: '/',
    headers: { 'accept-language': 'de;q=0.9,en-GB;q=0.8,en-US;q=0.7' }
  }, (err, res) => {
    t.error(err)
    const { statusCode, payload } = res
    t.equal(statusCode, 200, 'status OK')
    const expected = {
      detectedLng: [
        { code: 'de', quality: 0.9 },
        { code: 'en', quality: 0.8, region: 'GB' },
        { code: 'en', quality: 0.7, region: 'US' }
      ]
    }
    t.match(JSON.parse(payload), expected,
      'returns array of language details found in header'
    )
  })

  fastify.inject({
    method: 'GET',
    url: '/api/de'
  }, (err, res) => {
    t.error(err)
    const { statusCode, payload } = res
    t.equal(statusCode, 200, 'status OK')
    t.deepEqual(JSON.parse(payload), { detectedLng: 'de' },
      'returns language code found in path param')
  })
  fastify.close()
})

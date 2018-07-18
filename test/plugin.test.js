'use strict'

const tap = require('tap')
const Fastify = require('fastify')
const plugin = require('../plugin')

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

test('throws if order option is not an array', t => {
  t.plan(1)
  const fastify = Fastify()

  fastify
    .register(plugin, { order: 'not-array' })
    .after(err => {
      t.equal(err.message, 'options.order has to be an array',
        'error message matches'
      )
    })
  fastify.close()
})

test('throws if order option contains invalid parser', t => {
  t.plan(1)
  const fastify = Fastify()

  fastify
    .register(plugin, { order: ['not-exists'] })
    .after(err => {
      t.equal(err.message, 'not-exists is not a valid language parser',
        'error message matches'
      )
    })
  fastify.close()
})

test('throws if order option contains the same parser multiple times', t => {
  t.plan(1)
  const fastify = Fastify()

  fastify
    .register(plugin, { order: ['query', 'query'] })
    .after(err => {
      t.equal(err.message, 'query parser found  multiple times in order option. Try scope your routes instead.',
        'error message matches'
      )
    })
  fastify.close()
})

test('Integration', t => {
  t.plan(19)
  const fastify = Fastify()

  fastify
    .register((scope1, opts, next) => {
      scope1
        .register(plugin, {
          order: ['header', 'query'],
          supportedLngs: ['de', 'en']
        })
        .get('/scope1', (req, res) => {
          res.send({ lng: req.detectedLng })
        })
        .after(err => {
          t.error(err)
          t.equal(scope1._hooks.preHandler.length, 2, 'adds preHandler hooks')
          t.equal(scope1._Request.prototype.detectedLng, 'en',
            'scope1 decorates req with detectedLng and sets default value'
          )
        })
      next()
    })
    .register((scope2, opts, next) => {
      scope2
        .decorateRequest('cookies', { fastifyLanguageParser: 'de' })
        .decorateRequest('session', { fastifyLanguageParser: 'fr' })
        .register(plugin, {
          order: ['cookie', 'session', 'path'],
          fallbackLng: 'hu'
        })
        .get('/scope2/wo-path-param', (req, res) => {
          res.send({ lng: req.detectedLng })
        })
        .get('/scope2/:lng/with-path-param', (req, res) => {
          res.send({ lng: req.detectedLng })
        })
        .after(err => {
          t.error(err)
          t.equal(scope2._hooks.preHandler.length, 3,
            'scope2 adds preHandler hooks'
          )
          t.equal(scope2._Request.prototype.detectedLng, 'hu',
            'scope2 decorates req with detectedLng and sets default value'
          )
        })
      next()
    })
    .after(err => {
      t.error(err)
      t.equal(fastify._hooks.preHandler.length, 0,
        'Out of scope does not add preHandler hook'
      )
      t.equal(typeof fastify._Request.prototype.detectedLng, 'undefined',
        'Out of scope does not decorates req with detectedLng property'
      )
    })

  fastify.inject({
    method: 'GET',
    url: '/scope1'
  }, (err, res) => {
    t.error(err)
    t.ok(~res.payload.indexOf('en'),
      'GET /scope1 wo header and query returns defaultLng'
    )
  })

  fastify.inject({
    method: 'GET',
    url: '/scope1',
    headers: { 'accept-language': 'hu;q=0.9,de;q=0.8' }
  }, (err, res) => {
    t.error(err)
    t.ok(~res.payload.indexOf('de'),
      'GET /scope1 with header only picks from header'
    )
  })

  fastify.inject({
    method: 'GET',
    url: '/scope1?lng=de',
    headers: { 'accept-language': 'en;q=0.8' }
  }, (err, res) => {
    t.error(err)
    t.ok(~res.payload.indexOf('de'),
      'GET /scope1 with query and header returns query value'
    )
  })

  fastify.inject({
    method: 'GET',
    url: '/scope2/wo-path-param'
  }, (err, res) => {
    t.error(err)
    t.ok(~res.payload.indexOf('fr'),
      'GET /scope2/wo-path-param returns session value'
    )
  })

  fastify.inject({
    method: 'GET',
    url: '/scope2/fr/with-path-param'
  }, (err, res) => {
    t.error(err)
    t.ok(~res.payload.indexOf('fr'),
      'GET /scope2/fr/with-path-param returns value found in path param'
    )
  })

  fastify.close()
})

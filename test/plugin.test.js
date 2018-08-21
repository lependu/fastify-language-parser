'use strict'

const { test } = require('tap')
const Fastify = require('fastify')
const plugin = require('../plugin')

test('Decorates request with detectedLng', t => {
  t.plan(2)
  const fastify = Fastify()

  fastify
    .register(plugin, { fallbackLng: 'hu' })
    .ready(err => {
      t.error(err)
      t.equal(fastify._Request.prototype.detectedLng, 'hu',
        'default value is fallbackLng'
      )
    })
  fastify.close()
})

test('Register errors', t => {
  t.plan(6)

  testRegisterError(t, { order: 'not-array' },
    'options.order has to be an array',
    'throws if order option is not an array'
  )
  testRegisterError(t, { order: ['not-exists'] },
    'not-exists is not a valid language parser',
    'throws if order option contains invalid parser'
  )
  testRegisterError(t, { order: ['query', 'query'] },
    'query parser found  multiple times in order option.',
    'throws if order option contains the same parser multiple times'
  )
})

test('Integration', t => {
  t.plan(19)
  const fastify = Fastify()
  t.tearDown(() => fastify.close.bind(fastify))

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
    .ready(err => {
      t.error(err)
      t.equal(fastify._hooks.preHandler.length, 0,
        'Out of scope does not add preHandler hook'
      )
      t.equal(typeof fastify._Request.prototype.detectedLng, 'undefined',
        'Out of scope does not decorates req with detectedLng property'
      )
      testRoute(t, fastify, '/scope1', {}, 'en',
        'GET /scope1 wo header and query returns defaultLng'
      )
      testRoute(t, fastify, '/scope1',
        { 'accept-language': 'hu;q=0.9,de;q=0.8' },
        'de',
        'GET /scope1 with header only picks from header'
      )
      testRoute(t, fastify, '/scope1?lng=de',
        { 'accept-language': 'en;q=0.8' },
        'de',
        'GET /scope1 with query and header returns query value'
      )
      testRoute(t, fastify, '/scope2/wo-path-param', {}, 'fr',
        'GET /scope2/wo-path-param returns session value'
      )
      testRoute(t, fastify, '/scope2/fr/with-path-param', {}, 'fr',
        'GET /scope2/fr/with-path-param returns value found in path param'
      )
    })
})

function testRegisterError (t, opts, check, msg) {
  const fastify = Fastify()
  t.tearDown(() => fastify.close.bind(fastify))

  fastify
    .register(plugin, opts)
    .ready(err => {
      t.ok(err instanceof Error)
      t.match(err.message, check, msg)
    })
}

function testRoute (t, instance, url, headers, check, msg) {
  instance.inject({
    method: 'GET',
    url,
    headers
  }, (err, res) => {
    t.error(err)
    t.ok(~res.payload.indexOf(check), msg)
  })
}

'use strict'

const t = require('tap')
const Fastify = require('fastify')
const plugin = require('./plugin')
const { defaultOptions } = require('./default-options')

const PARSER_SUBTEST_COUNT = 4 * 5

t.test('Decorates request with detectedLng', t => {
  t.plan(2)
  const fastify = Fastify()

  fastify
    .register(plugin, { order: ['query'] })
    .ready(err => {
      t.error(err)
      t.ok(fastify.hasRequestDecorator('detectedLng'))
    })
  fastify.close()
})

t.test('Register errors', t => {
  t.plan(8)

  testRegisterError(t, { order: 'not-array' },
    'options.order has to be an array',
    'throws if order option is not an array')

  testRegisterError(t, { order: [] },
    'options.order has to contain at least one parser.',
    'throws if order option is an empty array')

  testRegisterError(t, { order: ['not-exists'] },
    'not-exists is not a valid language parser',
    'throws if order option contains invalid parser')

  testRegisterError(t, { order: ['query', 'query'] },
    'query parser found  multiple times in order option.',
    'throws if order option contains the same parser multiple times')
})

t.test('Parser', t => {
  t.plan(7)

  t.test('Default options | no supported check | no param', t => {
    t.plan(PARSER_SUBTEST_COUNT)

    testParser(t, 'query', { order: ['query'] }, null, '/', '/', {}, 'en',
      'query | returns default fallbackLng (en)')

    testParser(t, 'path', { order: ['path'] }, null, '/prefix/:lng', '/prefix/',
      {}, 'en', 'path | returns default fallbackLng (en)')

    testParser(t, 'cookie', { order: ['cookie'] }, null, '/', '/', {}, 'en',
      'cookie | returns default fallbackLng (en)')

    testParser(t, 'session', { order: ['session'] }, null, '/', '/', {}, 'en',
      'session | returns default fallbackLng (en)')

    testParser(t, 'header', { order: ['header'] }, null, '/', '/', {}, 'en',
      'header | returns default fallbackLng (en)')
  })

  t.test('Default options | no supported check | with param', t => {
    t.plan(PARSER_SUBTEST_COUNT)

    testParser(t, 'query', { order: ['query'] }, null, '/', '/?lng=de', {},
      'de', 'query | returns param (de)')

    testParser(t, 'path', { order: ['path'] }, null, '/prefix/:lng',
      '/prefix/de', {}, 'de', 'path | returns param (de)')

    testParser(t, 'cookie', { order: ['cookie'] }, 'de', '/', '/', {}, 'de',
      'cookie | returns param (de)')

    testParser(t, 'session', { order: ['session'] }, 'de', '/', '/', {}, 'de',
      'session | returns param (de)')

    testParser(t, 'header', { order: ['header'] }, null, '/', '/',
      { 'accept-language': 'de;q=0.9,fr;q=0.8' },
      JSON.stringify([{ code: 'de', script: null, quality: 0.9 }, { code: 'fr', script: null, quality: 0.8 }]),
      'header | returns array of matched items sorted by q')
  })

  t.test('Default options | supported check | param supported', t => {
    t.plan(PARSER_SUBTEST_COUNT)

    testParser(t, 'query', { order: ['query'], supportedLngs: ['en', 'de'] },
      null, '/', '/?lng=de', {}, 'de', 'query | returns param (de)')

    testParser(t, 'path', { order: ['path'], supportedLngs: ['en', 'de'] },
      null, '/prefix/:lng', '/prefix/de', {}, 'de', 'path | returns param (de)')

    testParser(t, 'cookie', { order: ['cookie'], supportedLngs: ['en', 'de'] },
      'de', '/', '/', {}, 'de', 'cookie | returns param (de)')

    testParser(t, 'session',
      { order: ['session'], supportedLngs: ['en', 'de'] }, 'de', '/', '/', {},
      'de', 'session | returns param (de)')

    testParser(t, 'header', { order: ['header'], supportedLngs: ['de', 'en'] },
      null, '/', '/', { 'accept-language': 'fr;q=0.9,en;q=0.8,de;q=0.7' },
      'en', 'header | returns the first matched item from supportedLngs (de)')
  })

  t.test('Default options | supported check | param not supported', t => {
    t.plan(PARSER_SUBTEST_COUNT)

    testParser(t, 'query', { order: ['query'], supportedLngs: ['en', 'de'] },
      null, '/', '/?lng=fr', {}, 'en', 'query | returns fallbackLng (en)')

    testParser(t, 'path', { order: ['path'], supportedLngs: ['en', 'de'] },
      null, '/prefix/:lng', '/prefix/fr', {}, 'en',
      'path | returns fallbackLng (en)')

    testParser(t, 'cookie', { order: ['cookie'], supportedLngs: ['en', 'de'] },
      'fr', '/', '/', {}, 'en', 'cookie | returns fallbackLng (en)')

    testParser(t, 'session',
      { order: ['session'], supportedLngs: ['en', 'de'] }, 'fr', '/', '/', {},
      'en', 'session | returns fallbackLng (en)')

    testParser(t, 'header', { order: ['header'], supportedLngs: ['de', 'en'] },
      null, '/', '/', { 'accept-language': 'fr;q=0.9' },
      'en', 'header | returns fallbackLng (en)')
  })

  t.test('Header | with supported check | without request header', t => {
    t.plan(4)

    testParser(t, 'header', { order: ['header'], supportedLngs: ['de', 'en'] },
      null, '/', '/', {}, 'en', 'returns fallbackLng (en)')
  })

  t.test('With custom decorator and key options', t => {
    t.plan(PARSER_SUBTEST_COUNT)

    testParser(t, 'query', {
      order: ['query'], queryDecorator: 'foo', queryKey: 'bar'
    }, 'de', '/', '/?bar=de', {}, 'de', 'query | returns param (de)')

    testParser(t, 'path', {
      order: ['path'], pathDecorator: 'foo', pathKey: 'bar'
    }, 'de', '/prefix/:bar', '/prefix/de', {}, 'de',
    'path | returns param (de)')

    testParser(t, 'cookie', {
      order: ['cookie'], cookieDecorator: 'foo', cookieKey: 'bar'
    }, 'de', '/', '/', {}, 'de', 'cookie | returns param (de)')

    testParser(t, 'session', {
      order: ['session'], sessionDecorator: 'foo', sessionKey: 'bar'
    }, 'de', '/', '/', {}, 'de', 'session | returns param (de)')

    testParser(t, 'header', {
      order: ['header'], headerDecorator: 'foo', headerKey: 'bar'
    }, 'de;q=0.9,en;q=0.8', '/', '/', {},
    JSON.stringify([{ code: 'de', script: null, quality: 0.9 }, { code: 'en', script: null, quality: 0.8 }]),
    'header | returns array of matched items')
  })

  t.test('Order (the last one wins)', t => {
    t.plan(PARSER_SUBTEST_COUNT)

    testParserOrder(t, {
      order: ['session', 'cookie', 'header', 'path', 'query']
    }, '/prefix/it?lng=gr', 'gr', 'last one is query')

    testParserOrder(t, {
      order: ['session', 'cookie', 'header', 'query', 'path']
    }, '/prefix/it?lng=gr', 'it', 'last one is path')

    testParserOrder(t, {
      order: ['session', 'header', 'query', 'path', 'cookie']
    }, '/prefix/it?lng=gr', 'de', 'last one is cookie')

    testParserOrder(t, {
      order: ['header', 'query', 'path', 'cookie', 'session']
    }, '/prefix/it?lng=gr', 'fr', 'last one is session')

    testParserOrder(t, {
      order: ['query', 'path', 'cookie', 'session', 'header']
    }, '/prefix/it?lng=gr', JSON.stringify([{ code: 'pt', script: null, quality: 0.9 }, { code: 'sp', script: null, quality: 0.8 }]),
    'last one is header')
  })
})

function testRegisterError (t, opts, check, msg) {
  const fastify = Fastify()
  t.tearDown(() => fastify.close())

  fastify
    .register(plugin, opts)
    .ready(err => {
      t.ok(err instanceof Error)
      t.match(err.message, check, msg)
    })
}

function testParser (t, name, opts, ctx, route, url, headers, check, msg) {
  const fastify = Fastify()
  t.tearDown(() => fastify.close())

  const decorator =
    opts[`${name}Decorator`] || defaultOptions[`${name}Decorator`]
  const key =
    opts[`${name}Key`] || defaultOptions[`${name}Key`]

  if (!fastify.hasRequestDecorator(decorator)) {
    fastify
      .decorateRequest(decorator, { [key]: ctx })
  }

  fastify.register(plugin, opts)
  fastify.get(route, (req, res) => res.send(req.detectedLng))
  fastify.ready(err => {
    t.error(err)

    fastify.inject({
      url,
      method: 'GET',
      headers
    }, (err, res) => {
      t.error(err)
      t.equal(res.statusCode, 200)
      t.equal(res.payload, check, msg)
    })
  })
}

function testParserOrder (t, opts, url, check, msg) {
  const fastify = Fastify()
  t.tearDown(() => fastify.close())

  fastify.decorateRequest('cookies', { fastifyLanguageParser: 'de' })
  fastify.decorateRequest('session', { fastifyLanguageParser: 'fr' })
  fastify.register(plugin, opts)
  fastify.get('/prefix/:lng', (req, res) => res.send(req.detectedLng))
  fastify.ready(err => {
    t.error(err)

    fastify.inject({
      url,
      method: 'GET',
      headers: { 'accept-language': 'pt;q=0.9,sp;q=0.8' }
    }, (err, res) => {
      t.error(err)
      t.equal(res.statusCode, 200)
      t.equal(res.payload, check, msg)
    })
  })
}

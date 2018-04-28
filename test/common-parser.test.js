'use strict'

const tap = require('tap')

const { test } = tap
const subject = require('../lib/common-parser')

test('common parser | with check | check is true | with key', t => {
  t.plan(1)
  const handler = subject({
    decorator: 'foo', key: 'bar', supportedLngs: ['alpha', 'beta']
  })
  let req = { detectedLng: 'alpha', foo: { bar: 'beta' } }
  handler(req, {}, function () {
    t.equal(req.detectedLng, 'beta', 'sets req.detectedLng')
  })
})

test('common parser | with check | check is true | without key', t => {
  t.plan(1)
  const handler = subject({
    decorator: 'foo', key: 'bar', supportedLngs: ['alpha', 'beta']
  })
  let req = { detectedLng: 'alpha' }
  handler(req, {}, function () {
    t.equal(req.detectedLng, 'alpha', 'does not set req.detectedLng')
  })
})

test('common parser | with check | check is false | with key', t => {
  t.plan(1)
  const handler = subject({
    decorator: 'foo', key: 'bar', supportedLngs: ['alpha', 'beta']
  })
  let req = { detectedLng: 'alpha', foo: { bar: 'gamma' } }
  handler(req, {}, function () {
    t.equal(req.detectedLng, 'alpha', 'does not set req.detectedLng')
  })
})

test('common parser | without check | with key', t => {
  t.plan(1)
  const handler = subject({
    decorator: 'foo', key: 'bar', supportedLngs: []
  })
  let req = { detectedLng: 'alpha', foo: { bar: 'beta' } }
  handler(req, {}, function () {
    t.equal(req.detectedLng, 'beta', 'sets req.detectedLng')
  })
})

test('common parser | without check | without key', t => {
  t.plan(1)
  const handler = subject({
    decorator: 'foo', key: 'bar', supportedLngs: []
  })
  let req = { detectedLng: 'alpha' }
  handler(req, {}, function () {
    t.equal(req.detectedLng, 'alpha', 'does not set req.detectedLng')
  })
})

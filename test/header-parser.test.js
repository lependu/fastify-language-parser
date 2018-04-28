'use strict'

const tap = require('tap')

const { test } = tap
const subject = require('../lib/header-parser')

test('header parser | with check | with header | with matches ', t => {
  t.plan(1)
  const handler = subject({
    decorator: 'headers', key: 'accept-language', supportedLngs: ['hu', 'en']
  })
  let req = {
    detectedLng: 'en',
    headers: { 'accept-language': 'en-GB;q=0.9,hu;q=0.7' }
  }
  handler(req, {}, function () {
    t.equal(req.detectedLng, 'hu',
      'picks first matching item from supportedLngs'
    )
  })
})

test('header parser | with check | with header | without matches ', t => {
  t.plan(1)
  const handler = subject({
    decorator: 'headers', key: 'accept-language', supportedLngs: ['hu', 'en']
  })
  let req = {
    detectedLng: 'en',
    headers: { 'accept-language': 'de;q=0.9,fr;q=0.8' }
  }
  handler(req, {}, function () {
    t.equal(req.detectedLng, 'en', 'does not sets req.detectedLng')
  })
})

test('header parser | with check | without header', t => {
  t.plan(1)
  const handler = subject({
    decorator: 'headers', key: 'accept-language', supportedLngs: ['hu', 'de']
  })
  let req = { detectedLng: 'en' }
  handler(req, {}, function () {
    t.equal(req.detectedLng, 'en', 'does not sets req.detectedLngs')
  })
})

test('header parser | without check | with header', t => {
  t.plan(1)
  const handler = subject({
    decorator: 'headers', key: 'accept-language', supportedLngs: []
  })
  let req = {
    detectedLng: 'en',
    headers: { 'accept-language': 'en-GB;q=0.9,hu;q=0.7' }
  }
  const expected = [
    { code: 'en', region: 'GB', quality: 0.9, script: null },
    { code: 'hu', region: null, quality: 0.7, script: null }
  ]
  handler(req, {}, function () {
    t.deepEqual(req.detectedLng, expected,
      'parses array of language objects found in header'
    )
  })
})

test('header parser | without check | without header', t => {
  t.plan(1)
  const handler = subject({
    decorator: 'headers', key: 'accept-language', supportedLngs: []
  })
  let req = { detectedLng: 'en' }
  handler(req, {}, function () {
    t.equal(req.detectedLng, 'en', 'does not sets req.detectedLngs')
  })
})

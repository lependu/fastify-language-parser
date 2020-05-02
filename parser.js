'use strict'

function parserProducer (name, opts) {
  const decorator = opts[`${name}Decorator`]
  const key = opts[`${name}Key`]
  const supportedLngs = opts.supportedLngs

  if (name === 'header') return headerFactory(decorator, key, supportedLngs)
  return commonFactory(decorator, key, supportedLngs)
}

function commonFactory (decorator, key, supportedLngs) {
  if (supportedLngs.length === 0) return commonParser(decorator, key)
  return commonParserWithSupportedCheck(decorator, key, supportedLngs)
}

function headerFactory (decorator, key, supportedLngs) {
  if (supportedLngs.length === 0) return headerParser(decorator, key)
  return headerParserWithSupportedCheck(decorator, key, supportedLngs)
}

function commonParser (decorator, key) {
  return function (req, res, next) {
    if (req[decorator] && req[decorator][key]) {
      req.detectedLng = req[decorator][key]
    }
    next()
  }
}

function commonParserWithSupportedCheck (decorator, key, supportedLngs) {
  return function (req, res, next) {
    if (req[decorator] && req[decorator][key] &&
      supportedLngs.indexOf(req[decorator][key]) > -1
    ) {
      req.detectedLng = req[decorator][key]
    }
    next()
  }
}

function headerParser (decorator, key) {
  return function (req, res, next) {
    if (req[decorator] && req[decorator][key]) {
      req.detectedLng = require('accept-language-parser').parse(
        req[decorator][key]
      )
    }
    next()
  }
}

function headerParserWithSupportedCheck (decorator, key, supportedLngs) {
  return function (req, res, next) {
    if (req[decorator] && req[decorator][key]) {
      const found = require('accept-language-parser').pick(
        supportedLngs,
        req[decorator][key]
      )
      if (found) {
        req.detectedLng = found
      }
    }
    next()
  }
}

module.exports = parserProducer

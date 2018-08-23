'use strict'

function parserFactory (name, opts) {
  const { decorator, key, supportedLngs } = opts

  if (name !== 'header') {
    if (supportedLngs.length === 0) {
      return function commonParser (req, res, next) {
        if (req[decorator] && req[decorator][key]) {
          req.detectedLng = req[decorator][key]
        }
        next()
      }
    } else {
      return function commonParserWithSupportedCheck (req, res, next) {
        if (req[decorator] && req[decorator][key] &&
          supportedLngs.indexOf(req[decorator][key]) > -1
        ) {
          req.detectedLng = req[decorator][key]
        }
        next()
      }
    }
  } else {
    if (supportedLngs.length === 0) {
      return function headerParser (req, res, next) {
        if (req[decorator] && req[decorator][key]) {
          req.detectedLng = require('accept-language-parser')
            .parse(req[decorator][key])
        }
        next()
      }
    } else {
      return function headerParserWithSupportedCheck (req, res, next) {
        if (req[decorator] && req[decorator][key]) {
          let found = require('accept-language-parser').pick(
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
  }
}

module.exports = parserFactory

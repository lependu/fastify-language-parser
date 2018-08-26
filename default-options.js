'use strict'

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

module.exports.defaultOptions = defaultOptions
module.exports.supportedParsers = supportedParsers

# fastify-language-parser

[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](http://standardjs.com/)
[![Build Status](https://travis-ci.org/lependu/fastify-language-parser.svg?branch=master)](https://travis-ci.org/lependu/fastify-language-parser)
[![Greenkeeper badge](https://badges.greenkeeper.io/lependu/fastify-language-parser.svg)](https://greenkeeper.io/)
[![Known Vulnerabilities](https://snyk.io/test/github/lependu/fastify-language-parser/badge.svg)](https://snyk.io/test/github/lependu/fastify-language-parser)

Language parser plugin for [fastify](https://github.com/fastify/fastify)

It decorates `req` object with `detectedLng` property and adds `preHandler` hook for language parsers specified in `order` option.
Supports `cookie`, `header`, `query`, `path` and `session` parser.


## Install
```
$ npm i --save fastify-language-parser
```


## Example
```js
const fastify = require('fastify')
const LP = require('fastify-language-parser')

fastify
  .reqister(LP, { order: ['query'])
  .after(err => {
    if (err) throw err
    fastify.get('/', (req, reply) => {
      // GET /?lng=de will set req.detectedLng to 'de'
      reply.send({ detectedLng: req.detectedLng })
    })
  })
```


## Lifecycle
```
req.detectedLng = result of previous parser || options.fallbackLng
        │
        └─▶ checks for value
                │
 does nothing ◀─┴─▶  if options.supportedLngs has any item
                       │
sets req.detectedLng ◀─┴─▶ looks for matches in supportedLngs
                               │
                does nothing ◀─┴─▶ sets req.detectedLng
                                        │
                                        └─▶ next parser defined in options.order
```


## API

### General options

name | type | default | description
-----|------|---------|------------
**`fallbackLng`** | `{String}` | `'en'` | The default value of `detectedLng` property.
**`order`** | `{Array}` | `[]` | List of parsers. Order is important, the last wins. Supported values are: `cookie` `header` `path` `query` `session`.
**`supportedLngs`** | `{Array}` | `['en']` | Use this option to filter the language code found by parser. If it is an empty array parser will set what it found. The order of items only counts when you use `header` parser.

### Parser specific options
#### header parser
Under the hood it uses [accept-language-parser](https://github.com/opentable/accept-language-parser). If `supportedLngs` does not contain any item it uses the [parse](https://github.com/opentable/accept-language-parser#parserparseacceptlanguageheader), otherwise the  [pick](https://github.com/opentable/accept-language-parser) method. Latter is the only case when the order in `supportedLngs` array makes any difference, because parser will pass that arrray to the pick method. No other plugin option is required.

#### query & path parsers

name | type | default | description
-----|------|---------|------------
**`pathParam`** | `{String}` | `'lng'` | The path parser looks for this property in `req.params` object.
**`queryString`** | `{String}` | `'lng'` | The query parser looks for this property in `req.query` object.

#### cookie & session parsers
This plugin does not set any cookie or session but looks for the keys specified in options. If you intend to use these parsers you need to register [fastify-cookie](https://github.com/fastify/fastify-cookie) or [fastify-session](https://github.com/SerayaEryn/fastify-session) plugin respectively.

name | type | default | description
-----|------|---------|------------
**`cookieDecorator`** | `{String}` | `'cookies'` | cookie decorator in `req` object.
**`cookieKey`** | `{String}` | `'fastifyLanguageParser'` | property to look for in `req[cookieDecorator]` object.
**`sessionDecorator`** | `{String}` | `'sessions'` | session decorator in `req` object.
**`sessionKey`** | `{String}` | `'fastifyLanguageParser'` | property to look for in `req[sessionDecorator]` object.

## License
Licensed under [MIT](./LICENSE).


# fastify-language-parser

[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](http://standardjs.com/)
[![Build Status](https://travis-ci.org/lependu/fastify-language-parser.svg?branch=master)](https://travis-ci.org/lependu/fastify-language-parser)
[![Known Vulnerabilities](https://snyk.io/test/github/lependu/fastify-language-parser/badge.svg)](https://snyk.io/test/github/lependu/fastify-language-parser)
[![Coverage Status](https://coveralls.io/repos/github/lependu/fastify-language-parser/badge.svg?branch=master)](https://coveralls.io/github/lependu/fastify-language-parser?branch=master)
![npm (scoped)](https://img.shields.io/npm/v/fastify-language-parser/latest)
![npm](https://img.shields.io/npm/dm/fastify-language-parser.svg)

Language parser plugin for [fastify](https://github.com/fastify/fastify)

It decorates `req` object with `detectedLng` and adds `preHandler` hook for those language parsers which you specified in `order` option. Supports `cookie`, `header`, `query`, `path` and `session` parser.


## Install
```
$ npm i --save fastify-language-parser
```

## Versions

The plugin supports the following `Fastify` versions. Please refer to the corresponding branch in PR and issues.

Version | Branch | Fastify | End of Support
--------|--------|---------|---------------  
1.x | [1.x](https://github.com/lependu/fastify-language-parser/tree/1.x) | [1.x](https://github.com/fastify/fastify/tree/1.x) | EOL
2.x | [2.x](https://github.com/lependu/fastify-language-parser/tree/2.x) | [2.x](https://github.com/fastify/fastify/tree/2.x) | TBD  
3.x | [master](https://github.com/lependu/fastify-language-parser/tree/master) | [3.x](https://github.com/fastify/fastify/tree/master) | TBD  
  
## Example
```js
const fastify = require('fastify')()
const LP = require('fastify-language-parser')

fastify
  .register(LP, { order: ['query'] })
  .after(err => {
    if (err) throw err
    fastify.get('/', (req, reply) => {
      // GET /?lng=de will set req.detectedLng to 'de'
      reply.send({ detectedLng: req.detectedLng })
    })
  })
```

If you need different set of parsers for different routes, [scope](https://www.fastify.io/docs/latest/Plugins-Guide/) the routes and register this plugin in each scope where it needed.


## API

### General options

name | type | default | description
-----|------|---------|------------
**`fallbackLng`** | `{String}` | `'en'` | The default value of the `req.detectedLng` decorator.
**`order`** | `{Array}` | `[]` | Order and from where language should be detected. The last item wins. Supported values are: `cookie` `header` `path` `query` `session`.
**`supportedLngs`** | `{Array}` | `['en']` | Use this option to filter the parsed language code. If it is an empty array parsers will skip the filter step. The order of items only counts when you use `header` parser.

### Parser specific options and notes
#### header parser
Under the hood it uses [accept-language-parser](https://github.com/opentable/accept-language-parser). If `supportedLngs` does not contain any item it uses the [parse](https://github.com/opentable/accept-language-parser#parserparseacceptlanguageheader), otherwise the [pick](https://github.com/opentable/accept-language-parser) method. Latter is the only case when the order in `supportedLngs` array makes any difference, because parser will pass it to the pick method. If the pick method returns no value than the `detectedLng` decorator will not change. It parses `req.headers['accept-language']` value which provided by fastify and normally you don't need to change, but you can using the `headerDecorator` and `headerKey` options.

#### query & path parsers
Parses specified keys from `req.query` and `req.params` decorators which provided by Fastify's core [Request](https://www.fastify.io/docs/latest/Request/) object. Ususally you don't need to change them, but you can using the `pathDecorator` and `queryDecorator` options.

name | type | default | description
-----|------|---------|------------
**`pathDecorator`** | `{String}` | `'params'` | The object key which contains the params matching the URL.
**`pathKey`** | `{String}` | `lng` | The object key which contains the actual language within the `req[pathDecorator]` object.
**`queryDecorator`** | `{String}` | `'query'` | The object key which contains the parsed querystring.
**`queryKey`** | `{String}` | `lng` | The object key which contains the actual language within the querystring.

#### cookie & session parsers
If you intend to use these parsers you need to register [fastify-cookie](https://github.com/fastify/fastify-cookie) or [fastify-session](https://github.com/SerayaEryn/fastify-session) plugin respectively. This plugin does not retrieves or sets any cookie or session value but looks for the `req[decorator][key]` value specified in options. The fastify-cookie plugin provides `req.cookies` decorator by defult. If you use fastify-session plugin you need to set the `req[sessionDecorator][sessionKey]` before this plugin, which reflects your session store state changes and provides the language code value.

name | type | default | description
-----|------|---------|------------
**`cookieDecorator`** | `{String}` | `'cookies'` |  Looks for the key in<br /> `req[cookieDecorator]`.
**`cookieKey`** | `{String}` | `'fastifyLanguageParser'` | Parses the value of<br /> `req[cookieDecorator][cookieKey]`.
**`sessionDecorator`** | `{String}` | `'sessions'` | Looks for the key in<br /> `req[sessionDecorator]`.
**`sessionKey`** | `{String}` | `'fastifyLanguageParser'` | Parses the value of<br /> `req[sessionDecorator][sessionKey]`.

## License
Licensed under [MIT](./LICENSE).

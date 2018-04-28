const acceptLanguageParser = require('accept-language-parser')

module.exports = function (opts) {
  const { decorator, key, supportedLngs } = opts

  if (supportedLngs.length === 0) {
    return function (req, res, next) {
      if (req[decorator] && req[decorator][key]) {
        req.detectedLng = acceptLanguageParser.parse(req[decorator][key])
      }
      next()
    }
  } else {
    return function (req, res, next) {
      if (req[decorator] && req[decorator][key]) {
        let found = acceptLanguageParser.pick(
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

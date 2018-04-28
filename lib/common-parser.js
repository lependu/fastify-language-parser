module.exports = function (opts) {
  const { decorator, key, supportedLngs } = opts

  if (supportedLngs.length === 0) {
    return function (req, res, next) {
      if (req[decorator] && req[decorator][key]) {
        req.detectedLng = req[decorator][key]
      }
      next()
    }
  } else {
    return function (req, res, next) {
      if (req[decorator] && req[decorator][key] &&
        supportedLngs.indexOf(req[decorator][key]) > -1
      ) {
        req.detectedLng = req[decorator][key]
      }
      next()
    }
  }
}

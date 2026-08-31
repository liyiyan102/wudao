/** 统一响应 */
function ok(res, data) {
  res.json({ code: 0, data: data === undefined ? null : data })
}
function fail(res, code, msg, httpStatus) {
  res.status(httpStatus || 200).json({ code, msg: msg || 'error' })
}
function wrap(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
}
module.exports = { ok, fail, wrap }

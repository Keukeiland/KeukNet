var indices = {}
var endpoints = ['addserver','resetdns','user']

var _
exports.init = function (global) {
    ({_} = global)

    for (path of endpoints) {
        indices[path] = require('./api/'+path)
        indices[path].init(global)
    }
}

exports.main = function (req, res) {
    var location = req.path.shift()
    if (!endpoints.includes(location)) {
        res.writeHead(404)
        res.end()
        return
    }
    indices[location].main(req, res)
}

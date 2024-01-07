var content, data
exports.init = function (global) {
    ({content, data} = global)
}


exports.main = function (req, res) {
    if (req.args.ip) {
        data.whoOwnsIp(req.args.ip, function (id) {
            res.writeHead(200, content['json'])
            res.end(JSON.stringify({"name":id}))
        })
    }
}
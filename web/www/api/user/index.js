exports.main = function (req, res, global) {
    const {data, content} = global
    if (req.args.ip) {
        data.whoOwnsIp(req.args.ip, function (id) {
            res.writeHead(200, content['json'])
            res.end(JSON.stringify({"name":id}))
        })
    }
}
var data
exports.init = function (global) {
    ({data} = global)
}


exports.main = function (req, res) {
    uuid = Object.keys(req.args)[0]
    console.log(uuid)
    data.getConf(uuid, function (data, err) {
        if (err) {
            res.writeHead(404)
            res.end()
            return
        }
        res.writeHead(200, {"Content-Type": "text/plain charset utf-8", "Content-Disposition": `attachment; filename="keuknet.conf"`})
        res.end(data)
    })
}
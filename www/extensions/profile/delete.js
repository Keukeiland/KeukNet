var data
exports.init = function (global) {
    ({data} = global)
}


exports.main = function (req, res) {
    if (!req.context.user) {
        res.writeHead(401)
        res.end()
        return
    }
    if (!req.args.uuid) {
        res.writeHead(404)
        res.end()
        return
    }
    data.deleteProfile(req.context.user, req.args.uuid, function (err) {
        if (err) {
            console.error(err)
            res.writeHead(500)
            res.end()
            return
        }
        res.writeHead(307, {Location: "/"})
        res.end()
        return
    })
}
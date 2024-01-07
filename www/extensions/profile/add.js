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
    // Add user to database
    data.addProfile(req.context.user, function (err) {
        if (err) {
            res.writeHead(500)
            res.end()
            return
        }
        res.writeHead(307, {Location: "/profile"})
        res.end()
        return
    })
}
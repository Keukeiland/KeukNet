var content, nj
exports.init = function (global) {
    ({content, nj} = global)
}


exports.main = function (req, res) {
    req.context.host = req.headers.host
    req.context.auth = req.headers.authorization
    nj.render('profile/install.html', req.context, function(err, data) {
        if (err) {
            res.writeHead(500)
            res.end()
            return
        }
        res.writeHead(200, content['html'])
        res.end(data)
    })
}
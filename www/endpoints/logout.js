var content, nj
exports.init = function (global) {
    ({content,nj} = global)
}

exports.main = function (req, res) {
    // if user is logged out
    if (!req.context.user) {
        res.writeHead(307, {"Location": "/"})
        res.end()
        return
    }
    // log user out and redirect
    nj.render('snippets/redirect.html', {destination:"/"}, function(err, data) {
        if (err) {
            res.writeHead(500)
            res.end()
            return
        }
        res.writeHead(401, content['html'])
        res.end(data)
    })
}
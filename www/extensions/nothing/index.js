exports.requires_login = function (path) {
    return true
}

var content, nj
exports.init = function (global) {
    ({content, nj} = global)
}

exports.main = function (req, res) {
    req.context.extension = {
        name: "Nothing"
    }
    nj.render('nothing/index.html', req.context, function(err, data) {
        if (err) {
            res.writeHead(500)
            res.end()
            return
        }
        res.writeHead(200, content['html'])
        res.end(data)
    })
}
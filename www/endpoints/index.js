var content, nj
exports.init = function (global) {
    ({content,nj} = global)
}

exports.main = function (req, res) {
    if (!req.context.user) {
        nj.render('content/index.html', req.context, function(err, data) {
            if (err) {
                res.writeHead(500)
                res.end()
                return
            }
            res.writeHead(200, content['html'])
            res.end(data)
        })
    }
    else {
        nj.render('content/user.html', req.context, function(err, data) {
            if (err) {
                res.writeHead(500)
                res.end()
                return
            }
            res.writeHead(200, content['html'])
            res.end(data)
        })
    }
}

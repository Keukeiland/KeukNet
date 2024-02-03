/* Some useful shortcuts */
var nj, content
exports.init = function (global) {
    ({nj,content} = global)
}

exports.end_nj = function (req, res, path) {
    nj.render(path + '.html', req.context, function(err, data) {
        if (err) {
            res.writeHead(404)
            res.end()
            return
        }
        res.writeHead(200, content['html'])
        res.end(data)
        return
    })
}

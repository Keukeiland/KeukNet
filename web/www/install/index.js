exports.main = function (req, res, global) {
    const {fetch, html, content} = global
    if (!req.args.device) req.args.device = "nodevice"

    fetch.file(__dirname + '/index.html', function (d, err) {
        if (err) {
            res.writeHead(500)
            res.end()
            return
        }
        fetch.file(__dirname + `/${req.args.device}.html`, function (d1, err) {
            if (err) {
                res.writeHead(404)
                res.end()
                return
            }
            d2 = fetch.mergeRaw(d, d1)
            response = html.patch(d2, req, ['default','uuid'])
            res.writeHead(200, content['html'])
            res.end(response)
        })
    })
}
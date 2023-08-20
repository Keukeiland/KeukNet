const { servers } = require("../global")

exports.main = function (req, res, global) {
    const {data, fetch, content, html} = global

    req.user ??= data.authenticate(req.headers.authorization)
    if (!req.user) {
        fetch.file(__dirname + '/index.html', function (data, err) {
            if (err) {
                res.writeHead(500)
                res.end()
                return
            }
            fetch.merge(data, 'index.noauth.html', function (data) {
                res.writeHead(200, content['html'])
                res.end(data)
            })
        })
    }
    else {
        req.status = req.ip.startsWith("fdbe:126:f8f7:") ? 'Connected' : 'Disconnected'
        fetch.file(__dirname + '/index.html', function (d, err) {
            if (err) {
                res.writeHead(500)
                res.end()
                return
            }
            fetch.merge(d, 'index.html', function (d) {
                d = fetch.mergeRaw(d, data.getProfiles(req.user))

                servers.getHtml(function (serverhtml) {
                    d = fetch.mergeRaw(d, serverhtml)
                    response = html.patch(d, req, ['default'])

                    res.writeHead(200, content['html'])
                    res.end(response)
                })
            })
        })
    }
}
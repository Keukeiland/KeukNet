const global = require('./global')
const {fetch, content, html, favicons, data} = global
global.salt = ( {salt} = require('./config') )

var indices = {}

const _callExternal = function (req, res, global, callback) {
    if (!indices[req.url]) {
        try {
            indices[req.url] = require('./www/' + req.url.slice(0, -3))
        }
        catch(err) {
            callback(err)
            return
        }
    }

    try {
        indices[req.url].main(req, res, global)
        return
    }
    catch(err) {
        callback(err)
        return
    }
}
exports.init = function () {return}

exports.main = function (req, res) {
    if (req.headers.authorization) req.user = data.authenticate(req.headers.authorization)

    if (req.url.endsWith("index.js")) {
        res.writeHead(403)
        res.end()
        return
    }

    else if (req.url.endsWith("/") || !req.url.includes('.')) {
        if (req.url.endsWith('/')) req.url = req.url + "index.js"
        else req.url = req.url + "/index.js"

        _callExternal(req, res, global, function (err) {
            if (err) {
                req.url = req.url.substring(0, req.url.lastIndexOf('/')) + "/index.html"
                fetch.file(__dirname + "/www" + req.url, function (data, err) {
                    if (err) {
                        res.writeHead(404)
                        res.end()
                        return
                    }
                    html.patch(data, req, ['default'])
                    res.writeHead(200, content['html'])
                    res.end(data)
                    return
                })
            }
            return
        })
    }

    else {
        filetype = req.url.slice(req.url.lastIndexOf('.')+1)
        
        if (favicons.includes(req.url.substring(req.url.lastIndexOf('/')+1))) {
            fetch.fileRaw(__dirname + "/favicons" + req.url, function (data, err) {
                if (err) {
                    console.error(err)
                    res.writeHead(404)
                    res.end()
                    return
                }
                res.writeHead(200, content[filetype])
                res.end(data)
                return
            })
        }
        else if (['png','jpg','mp3'].includes(filetype)) {
            fetch.fileRaw(__dirname + "/www" + req.url, function (data, err) {
                if (err) {
                    console.error(err)
                    res.writeHead(404)
                    res.end()
                    return
                }
                res.writeHead(200, content[filetype])
                res.end(data)
                return
            })
        }
        else {
            fetch.file(__dirname + "/www" + req.url, function (data, err) {
                if (err) {
                    console.error(err)
                    res.writeHead(404)
                    res.end()
                    return
                }
                if (filetype == "html" || filetype == "md") {
                    html.patch(data, req, ['default'])
                }
                res.writeHead(200, content[filetype])
                res.end(data)
                return
            })
        }
    }
}

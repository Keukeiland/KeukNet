var content, nj, data, fetch
exports.init = function (global) {
    ({content, nj, data,microfetch} = global)
    fetch = new microfetch.Fetch(__dirname)
}

exports.main = function (req, res) {
    console.log(req.data)
    req.context.extension = {
        name: "Servers"
    }
    var location = req.path.shift()
    if (!location) {
        if (req.args.server) {
            data.getServer(req.args.server, function (server, err) {
                if (err) {
                    res.writeHead(500)
                    res.end()
                    return
                }
                req.context.server = server
                nj.render('servers/server.html', req.context, function(err, data) {
                    if (err) {
                        res.writeHead(500)
                        res.end()
                        return
                    }
                    res.writeHead(200, content['html'])
                    res.end(data)
                })
            })
            return
        }
        data.getServers(function (servers, err) {
            req.context.servers = servers
            nj.render('servers/serverlist.html', req.context, function(err, data) {
                if (err) {
                    res.writeHead(500)
                    res.end()
                    return
                }
                res.writeHead(200, content['html'])
                res.end(data)
            })
        })
        return
    }
    if (location == "addserver") {
        if (req.context.user.is_admin) {
            if (req.data) {
                console.log(req.data)
                if (req.data.name && req.data.admin_id && req.data.description && req.data.ip) {
                    data.addServer(req.data.name, req.data.admin_id, req.data.description, req.data.ip, req.data.url, function (err) {
                        if (err) {
                            console.log(err)
                            res.writeHead(500)
                            res.end()
                            return
                        }
                        res.writeHead(200)
                        res.end()
                    })
                    return
                }
            }
            nj.render('servers/addserver.html', req.context, function(err, data) {
                if (err) {
                    res.writeHead(500)
                    res.end()
                    return
                }
                res.writeHead(200, content['html'])
                res.end(data)
            })
            return
        }
        res.writeHead(403)
        res.end()
        return
    }
    else {
        fetch.file(location, function (data,filetype,err) {
            if (err) {
                res.writeHead(404)
                res.end()
                return
            }
            res.writeHead(200, content[filetype])
            res.end(data)
        })
    }
}
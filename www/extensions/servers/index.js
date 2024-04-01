module.exports = (Extension) => {return class extends Extension {
    name = 'servers'
    title = 'Servers'
    tables = true
    dependencies = ['content','nj','fetch']

    requires_admin(path) {
        if (path.at(0) == "addserver") {
            return true
        }
        return false
    }

    handle(req, res) {
        var location = req.path.shift()

        if (!location) {
            if (req.args.server) {
                this.db.select('server', ['*'], 'id=$id', null, [req.args.server], (err, server) => {
                    req.context.server = server[0]
                    this.return_html(req, res, 'server', err ?? !server[0], 404)
                })
                return
            }
            this.db.select('server', ['*'], null, null, [], (err, servers) => {
                req.context.servers = servers
                this.return_html(req, res, 'serverlist', err)
            })
            return
        }
        if (location == "addserver") {
            if (req.data) {
                if (req.data.name && req.data.admin_id && req.data.description && req.data.ip) {
                    this.db.insert('server', ['name','admin_id','description','ip','url'], [req.data.name,req.data.admin_id,req.data.description,req.data.ip,req.data.url], (err) => {
                        this.return(res, err)
                    })
                    return
                }
            }
            return this.return_html(req, res, 'addserver')
        }
        else {
            return this.return_file(res, location)
        }
    }
}}

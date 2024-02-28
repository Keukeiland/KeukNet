module.exports = (Extension) => {return class extends Extension {
    name = 'servers'
    title = 'Servers'
    dependencies = ['data','content','nj','fetch']

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
                this.data.getServer(req.args.server, (server, err) => {
                    req.context.server = server
                    this.return_html(req, res, 'server', err ?? !server)
                })
                return
            }
            this.data.getServers((servers, err) => {
                req.context.servers = servers
                this.return_html(req, res, 'serverlist', err)
            })
            return
        }
        if (location == "addserver") {
            if (req.data) {
                if (req.data.name && req.data.admin_id && req.data.description && req.data.ip) {
                    this.data.addServer(req.data.name, req.data.admin_id, req.data.description, req.data.ip, req.data.url, (err) => {
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

module.exports = class Extension {
    admin_only = false
    tables = false
    dependencies = []

    constructor(global, path) {
        if (this.constructor == Extension) {
            throw new Error("Abstract classes can't be instantiated.");
        }
        // Runs after child has been constructed
        setTimeout(() => {
            // Init dependencies
            for (const dep of this.dependencies) {
                if (dep != 'fetch') {
                    this[dep] = global[dep]
                }
                else {
                    this['fetch'] = new global.microfetch.Fetch(path)
                }
            }
            // Init db
            if (this.tables) {
                // create interface
                this.db = new global.DB(global.db(), this.name)
                // init tables
                new ((require(`${path}tables`))(global.Tables))(global.db(), this.db, this.name)
            }
        }, 0)
    }

    /**
     * @param {Array} path The current path being visited
     * @returns true if the path requires being logged in, else false
     */
    requires_login(path) {
        return true
    }

    requires_admin(path) {
        return this.admin_only
    }

    handle_req(req, res) {
        req.context.extension = this
        return this.handle(req, res)
    }

    handle(req, res) {
        throw new Error(`Method 'handle()' must be implemented.`);
    }

    return(res, err, location, err_code=500) {
        if (err) {
            res.writeHead(err_code)
            return res.end()
        }
        let code = 200
        let args = {}
        
        if (location) {
            code = 307
            args['Location'] = location
        }
        
        res.writeHead(code, args)
        return res.end()
    }

    return_text(req, res, item) {
        req.context.__render_item = this.texts[item]
        this.nj.renderString(
            '{% extends "layout.html" %}{% block body %}{{__render_item |safe}}{% endblock %}',
            req.context, (err, data) => {
                console.log(err, data)
                if (err) {
                    res.writeHead(500)
                    return res.end()
                }
                res.writeHead(200, this.content['html'])
                return res.end(data)
        })
    }

    return_html(req, res, item, err, err_code=500, success_code=200, headers=null) {
        if (err) {
            res.writeHead(err_code)
            return res.end()
        }

        headers = {...this.content['html'], ...headers}

        this.nj.render(this.name+'/'+item+'.html', req.context, (err, data) => {
            if (err) {
                res.writeHead(err_code)
                return res.end()
            }
            res.writeHead(success_code, headers)
            return res.end(data)
        })
    }

    return_file(res, file) {
        this.fetch.file(file, (data,filetype,err) => {
            if (err) {
                res.writeHead(404)
                res.end()
                return
            }
            res.writeHead(200, this.content[filetype])
            res.end(data)
        })
    }

    return_data(res, data, err, headers, err_code=404) {
        if (err) {
            res.writeHead(err_code)
            return res.end()
        }
        let args = {"Content-Type": "text/plain charset utf-8"}

        if (headers) {
            args = headers
        }
        
        res.writeHead(200, args)
        return res.end(data)
    }
}

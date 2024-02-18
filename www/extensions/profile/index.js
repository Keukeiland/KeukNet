module.exports = (Extension) => {return class extends Extension {
    name = 'profile'
    title = 'Network'
    dependencies = ['data','content','nj','fetch']

    endpoints = [
        'getconf','delete','add',
        'install','rename'
    ]
    indices = []

    constructor(global) {
        super(...arguments)
        for (const path of this.endpoints) {
            this.indices[path] = require('./'+path)
            this.indices[path].init(global)
        }
    }

    requires_login(path) {
        if (path.at(0) == 'getconf') {
            return false
        }
        return true
    }

    handle(req, res) {
        var location = req.path.shift()
        if (!location) {
            this.data.getProfiles(req.context.user.id, (profiles, err) => {
                req.context.profiles = profiles
                this.return_html(req, res, 'index')
            })
        }
        else if (this.endpoints.includes(location)) {
            return this.indices[location].main(req,res)
        }
        else {
            return this.return_file(res, location)
        }
    }
}}

module.exports = (Extension) => {return class extends Extension {
    name = 'profile'
    title = 'Network'
    dependencies = ['data','content','nj','fetch']

    requires_login(path) {
        if (path.at(0) == 'getconf') {
            return false
        }
        return true
    }

    handle(req, res) {
        var location = req.path.shift()
        switch (location) {
            case '':
            case undefined:
                this.data.getProfiles(req.context.user.id, (profiles, err) => {
                    req.context.profiles = profiles
                    this.return_html(req, res, 'index', err)
                })
                break
            
            case 'delete':
                if (!req.args.uuid) {
                    return this.return(res, true, 404)
                }
                this.data.deleteProfile(req.context.user, req.args.uuid, (err) => {
                    return this.return(res, err, location='/profile')
                })
                break
            
            case 'add':
                this.data.addProfile(req.context.user, (err) => {
                    return this.return(res, err, location='/profile')
                })
                break
            
            case 'getconf':
                let uuid = Object.keys(req.args)[0]
                this.data.getConf(uuid, (data, err) => {
                    return this.return_data(res, data, err, {"Content-Type": "text/plain charset utf-8", "Content-Disposition": `attachment; filename="keuknet.conf"`})
                })
                break
            
            case 'install':
                req.context.host = req.headers.host
                return this.return_html(req, res, 'install')
                break
            
            case 'rename':
                if (!req.args.uuid) {
                    res.writeHead(404)
                    res.end()
                    return
                }
                if (req.data) {
                    this.data.renameProfile(req.context.user, req.args.uuid, req.post_data, (err) => {
                        return this.return(res, err, location='/profile')
                    })
                }
                else {
                    this.nj.render('snippets/post.html', {item:"new name",action:req.url,destination:"/profile"}, (err, data) => {
                        return this.return_data(res, data, err, this.content['html'], 500)
                    })
                }
                break

            default:
                return this.return_file(res, location)
        }
    }
}}

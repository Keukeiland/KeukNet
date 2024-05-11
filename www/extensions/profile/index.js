module.exports = (Extension) => {return class extends Extension {
    name = 'profile'
    title = 'Network'
    tables = true
    dependencies = ['content','nj','fetch']
    crypto = require('crypto')
    wg = require('./wireguard')
    wg_config = null

    constructor (global, path, data_path) {
        super(global, path)
        this.wg.init(data_path, global.wg_config, global.config.tmp_dir)
        this.wg_config = global.wg_config
    }


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
            case undefined: {
                this.db.select('device', ['*'], 'user_id=$id', null, [req.context.user.id], (err, profiles) => {
                    req.context.profiles = profiles
                    req.context.connected_ip = req.ip.startsWith(this.wg_config.subnet) ? req.ip : false
                    this.return_html(req, res, 'index', err)
                })
                break
            }
            case 'delete': {
                // Check ownership
                this.owns(req.context.user, req.args.uuid, (user_owns) => {
                    if (!user_owns) return this.return(res, true, 404)
                    // Delete db entry
                    this.db.delete('device', 'uuid=$uuid', [req.args.uuid], (err) => {
                        // Delete wireguard profile
                        this.wg.delete(req.args.uuid, () => {
                            return this.return(res, err, location='/profile')
                        })
                    })
                })
                break
            }
            case 'add': {
                // Get uuid
                let uuid = this.crypto.randomUUID()
                // Get IP suffix
                this.db.select('device', ['MAX(id)'], null, null, [], (err, data) => {
                    let id = data[0]['MAX(id)'] +2
                    // Register wireguard link
                    this.wg.create(uuid, id, (ip, err) => {
                        if (err) return callback(err)
                        // Insert in db
                        this.db.insert('device', ['user_id','uuid','ip'], [req.context.user.id, uuid, ip], (err) => {
                            return this.return(res, err, location='/profile')
                        })
                    })
                })
                break
            }
            case 'getconf': {
                // Get uuid
                let uuid = Object.keys(req.args)[0]
                // Get config
                this.wg.getConfig(uuid, (data, err) => {
                    if (err) return this.return(res, true, 404)
                    // Mark as installed
                    this.db.update('device', ['installed=TRUE'], 'uuid=$uuid', [uuid], (err) => {
                        return this.return_data(res, data, err, {"Content-Type": "text/plain charset utf-8", "Content-Disposition": `attachment; filename="keuknet.conf"`})
                    })
                })
                break
            }
            case 'install': {
                req.context.host = req.headers.host
                return this.return_html(req, res, 'install')
                break
            }
            case 'rename': {
                if (req.data) {
                // Check ownership
                this.owns(req.context.user, req.args.uuid, (user_owns) => {
                    if (!user_owns) return this.return(res, true, 404)
                    // Change name
                    this.db.update('device', ['name=$name'], 'uuid=$uuid', [req.post_data,req.args.uuid], (err) => {
                        return this.return(res, err, location='/profile')
                    })
                })
                }
                else {
                    this.nj.render('snippets/post.html', {item:"new name",action:req.url,destination:"/profile"}, (err, data) => {
                        return this.return_data(res, data, err, this.content['html'], 500)
                    })
                }
                break
            }
            default: {
                return this.return_file(res, location)
            }
        }
    }

    owns = (user, uuid, callback) => {
        if (!uuid) return callback(undefined)
        this.db.select('device', ['1'], 'user_id=$id AND uuid=$uuid', null, [user.id, uuid], (err, data) => {
            return callback(data[0] ? Object.hasOwn(data[0], '1') : false)
        })
    }
}}

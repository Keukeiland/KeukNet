import crypto from 'crypto'
import { ExtensionBase } from '../../modules'

export default class extends ExtensionBase {
    name = 'profile'
    title = 'Network'
    tables = true
    dependencies = ['content','nj','fetch']
    wg = null
    wg_config = null


    async init(context) {
        let config = context.modules.config
        let data_path = context.data_path
        this.wg_config = context.modules.wg_config

        this.wg = await import('./wireguard')
        this.wg.init(data_path, this.wg_config, config.tmp_dir)

        return ExtensionBase.init(this, context)
    }

    requires_login(path) {
        if (path.at(0) == 'getconf') {
            return false
        }
        return true
    }

    handle(ctx, deps) {
        let [db] = deps.massGet('DB')
        var location = ctx.path.shift()

        switch (location) {
            case '':
            case undefined: {
                db.select('device', ['*'], 'user_id=$id', null, [ctx.context.user.id], (err, profiles) => {
                    ctx.context.profiles = profiles
                    ctx.context.connected_ip = ctx.ip.startsWith(this.wg_config.subnet) ? ctx.ip : false
                    this.return_html(ctx, 'index', err)
                })
                break
            }
            case 'delete': {
                // Check ownership
                this.owns(ctx.context.user, ctx.args.get('uuid'), (user_owns) => {
                    if (!user_owns) return this.return(ctx, true, 404)
                    // Delete db entry
                    db.delete('device', 'uuid=$uuid', [ctx.args.get('uuid')], (err) => {
                        // Delete wireguard profile
                        this.wg.remove(ctx.args.get('uuid'), () => {
                            return this.return(ctx, err, location='/profile')
                        })
                    })
                })
                break
            }
            case 'add': {
                // Get uuid
                let uuid = crypto.randomUUID()
                // Get IP suffix
                db.select('device', ['MAX(id)'], null, null, [], (err, data) => {
                    let id = data[0]['MAX(id)'] +2
                    // Register wireguard link
                    this.wg.create(uuid, id, (ip, err) => {
                        if (err) return callback(err)
                        // Insert in db
                        db.insert('device', ['user_id','uuid','ip'], [ctx.context.user.id, uuid, ip], (err) => {
                            return this.return(ctx, err, location='/profile')
                        })
                    })
                })
                break
            }
            case 'getconf': {
                // Get uuid
                let uuid = ctx.args.keys().next().value
                // Get config
                this.wg.getConfig(uuid, (data, err) => {
                    if (err) return this.return(ctx, true, 404)
                    // Mark as installed
                    db.update('device', ['installed=TRUE'], 'uuid=$uuid', [uuid], (err) => {
                        return this.return_data(ctx, data, err, {"Content-Type": "text/plain charset utf-8", "Content-Disposition": `attachment; filename="keuknet.conf"`})
                    })
                })
                break
            }
            case 'install': {
                ctx.context.device = ctx.args.get('device')
                ctx.context.uuid = ctx.args.get('uuid')
                return this.return_html(ctx, 'install')
            }
            case 'rename': {
                if (ctx.data) {
                // Check ownership
                this.owns(ctx.context.user, ctx.args.get('uuid'), (user_owns) => {
                    if (!user_owns) return this.return(ctx, true, 404)
                    // Change name
                    db.update('device', ['name=$name'], 'uuid=$uuid', [ctx.data.form.post_data,ctx.args.get('uuid')], (err) => {
                        return this.return(ctx, err, location='/profile')
                    })
                })
                }
                else {
                    ctx.context = {item:"new name",action:ctx.req.url,destination:"/profile"}
                    this.return_html(ctx, 'edit')
                }
                break
            }
            default: {
                return this.return_file(ctx, location)
            }
        }
    }

    owns = (user, uuid, callback) => {
        let db = this.initialized_deps.get('DB')

        if (!uuid) return callback(undefined)
        db.select('device', ['1'], 'user_id=$id AND uuid=$uuid', null, [user.id, uuid], (err, data) => {
            return callback(data[0] ? Object.hasOwn(data[0], '1') : false)
        })
    }
}

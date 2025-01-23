import crypto from 'crypto'
import { ExtensionBase, Knex } from '../../modules.ts'
import { unpack } from '../../util.ts'

export default class extends ExtensionBase {
    override name = 'profile'
    override title = 'Network'
    override tables = true
    wg: any = null
    wg_config: any = null


    override init: Extension['init'] = async (context) => {
        let config = context.modules.config
        let data_path = context.data_path
        this.wg_config = context.modules.wg_config

        this.wg = await import('./wireguard.js')
        this.wg.init(data_path, this.wg_config, config.tmp_dir)

        return ExtensionBase.init(this, context)
    }

    override requires_login: Extension['requires_login'] = (path) => {
        if (path.at(0) == 'getconf') {
            return false
        }
        return true
    }

    override handle: Extension['handle'] = async (ctx) => {
        let [knex]: [Knex] = this.get_dependencies('Knex')
        var location = ctx.path.shift()

        switch (location) {
            case '':
            case undefined: {
                const [profiles, err] = await knex.query('_device')
                    .select('*')
                    .where('user_id', ctx.context.user?.id)
                    .then(unpack<any[]>)

                ctx.context.profiles = profiles
                ctx.context.connected_ip = ctx.ip.startsWith(this.wg_config.subnet) ? ctx.ip : false
                return this.return_html(ctx, 'index', err)
            }
            case 'delete': {
                // Check ownership
                let user_owns = await this.owns(ctx.context.user, ctx.args.get('uuid'))
                if (!user_owns)
                    return this.return(ctx, new Error(), undefined, 404)

                // Delete db entry
                await knex.query('_device').delete().where('uuid', ctx.args.get('uuid'))

                // Delete wireguard profile
                this.wg.remove(ctx.args.get('uuid'), () => {
                    return this.return(ctx, undefined, location='/profile')
                })
                break
            }
            case 'add': {
                // Get uuid
                let uuid = crypto.randomUUID()

                // Get IP suffix
                let [data, err] = await knex.query('_device')
                    .max('id')
                    .then(unpack<any>)
                let id = (data[0]['max(`id`)'] ?? 0) +2

                // Register wireguard link
                this.wg.create(uuid, id, async (ip: string, err: Error) => {
                    if (err) return this.return(ctx, err)
                    // Insert in db
                    await knex.query('_device').insert({user_id: ctx.context.user?.id, uuid, ip} as never)

                    return this.return(ctx, undefined, location='/profile')
                })
                break
            }
            case 'getconf': {
                // Get uuid
                let uuid = ctx.args.get('uuid')

                // Get config
                this.wg.getConfig(uuid, async (data: FileData, err: Error) => {
                    if (err)
                        return this.return(ctx, new Error(), undefined, 404)

                    // Mark as installed
                    await knex.query('_device')
                        .update({installed: true} as never)
                        .where('uuid', uuid)
                    
                    return this.return_data(ctx, data, undefined, {"Content-Type": "text/plain charset utf-8", "Content-Disposition": `attachment; filename="keuknet.conf"`})
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
                    let user_owns = await this.owns(ctx.context.user, ctx.args.get('uuid'))
                    if (!user_owns)
                        return this.return(ctx, new Error(), undefined, 404)
                    
                    // Change name
                    await knex.query('_device')
                        .update({name: ctx.data.form.post_data} as never)
                        .where('uuid', ctx.args.get('uuid'))

                    return this.return(ctx, undefined, location='/profile')
                }
                else {
                    ctx.context = {...ctx.context, item:"new name",action:ctx.req.url,destination:"/profile"}
                    this.return_html(ctx, 'edit')
                }
                break
            }
            default: {
                return this.return_file(ctx, location)
            }
        }
    }

    owns = async (user?: User, uuid?: string) => {
        let [knex]: [Knex] = this.get_dependencies('Knex')

        if (!uuid)
            return false

        const [data, err] = await knex.query('_device')
            .select('id')
            .where('user_id', user?.id)
            .andWhere('uuid', uuid)
            .first()
            .then(unpack<any>)

        return !!data
    }
}

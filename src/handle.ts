import { load } from "./extman.ts"
import Log from "./modules/log.ts"
import { unpack } from "./util.ts"

let log = new Log(true)

export default class implements Handle {
    extensions_list = [
        'profile','nothing','admin','chat'
    ]
    root: RootExtension
    wg_config: any
    extensions = new Map<string, Extension>()
    admin_extensions = new Map<string, Extension>()

    constructor(modules: any) {
        let config = modules.config
        this.wg_config = modules.wg_config
        let nj: Environment = modules.nj
        nj.addGlobal('dicebear_host', config.dicebear_host)
        nj.addGlobal('client_location', config.client_location)
    }

    init: Handle['init'] = async (modules, knex) => {
        this.root = await load(modules, 'root', knex) as RootExtension
    
        for (const path of this.extensions_list) {
            try {
                this.extensions.set(path, await load(modules, path, knex) as Extension)
            } catch (err: any) {
                log.err(`Unable to load extension '${path}':\n\t${err.message}\n${err.stack}`)
            }
        }
        
        this.extensions.forEach((extension, name, m) => {
            if (extension.admin_only) {
                this.admin_extensions.set(name, extension)
                this.extensions.delete(name)
            }
        })
    }
    
    main: Handle['main'] = async (partial_ctx: PartialContext) => {
        let location = partial_ctx.path.shift() ?? ''
    
        // set request context
        let ctx: Context = {
            ...partial_ctx,
            context: {
                ...partial_ctx.args,
                extensions: this.extensions,
                location,
            }
        }
        
        // Authenticate using user&pass, else using ip
        const [user, err] = await this.root.authenticate(ctx.req.headers.authorization as BasicAuth|undefined, ctx.ip, this.wg_config.subnet).then(unpack<User>)

        ctx.context.user = user
        ctx.context.auth_err = err

        if (user && user.is_admin)
            ctx.context.extensions = {...ctx.context.extensions, ...this.admin_extensions}
    
        // Extension
        const selected_extension = ctx.context.extensions.get(location)
        if (selected_extension) {
            // If login required
            if (!user && selected_extension.requires_login(ctx.path)) {
                ctx.res.writeHead(307, {Location: "/login"})
                ctx.res.end()
            }
            else if (user && !user.is_admin && selected_extension.requires_admin(ctx.path)) {
                ctx.res.writeHead(307, {Location: "/"})
                ctx.res.end()
            }
            else
                selected_extension.handle_req(ctx)
        }
        // Root extension
        else {
            ctx.path.unshift(location)
            this.root.handle_req(ctx)
        }
    }
}

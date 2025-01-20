/** @ts-ignore 2305 */
import { load } from "./extman.cjs"
import Log from "./modules/log.ts"

let log = new Log(true)

export default class implements Handle {
    extensions_list = [
        'profile','nothing','admin','chat'
    ]
    root: RootExtension
    wg_config: any
    extensions = new Map<string, Extension>()
    admin_extensions = new Map<string, Extension>()

    constructor(modules: any, database: any) {
        let config = modules.config
        this.wg_config = modules.wg_config
        let nj: Environment = modules.nj
        nj.addGlobal('dicebear_host', config.dicebear_host)
        nj.addGlobal('client_location', config.client_location)
    
        this.root = load(modules, database, 'root') as RootExtension
    
        for (const path of this.extensions_list) {
            try {
                this.extensions.set(path, load(modules, database, path) as Extension)
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
    
    main: Handle['main'] = (partial_ctx: PartialContext) => {
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
        this.root.authenticate(ctx.req.headers.authorization as BasicAuth|undefined, ctx.ip, this.wg_config.subnet, (user, err) => {
            ctx.context.user = user
            if (err) ctx.context.auth_err = err
            if (user && user.is_admin) ctx.context.extensions = {...ctx.context.extensions, ...this.admin_extensions}
        
            // Extension
            if (ctx.context.extensions.has(location)) {
                let ext = ctx.context.extensions.get(location) as Extension
                // If login required
                if (!user && ext.requires_login(ctx.path)) {
                    ctx.res.writeHead(307, {Location: "/login"})
                    return ctx.res.end()
                }
                else if (user && !user.is_admin && ext.requires_admin(ctx.path)) {
                    ctx.res.writeHead(307, {Location: "/"})
                    return ctx.res.end()
                }
                ext.handle_req(ctx)
            }
            // Root extension
            else {
                ctx.path.unshift(location)
                this.root.handle_req(ctx)
            }
        })
    }
}

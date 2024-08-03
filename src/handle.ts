import { load } from "./extman"
import Log from "./modules/log"

let log = new Log(true)

export default class implements Handle {
    extensions_list = [
        'profile','nothing','admin','chat'
    ]
    root: RootExtension
    wg_config: any
    extensions: Record<string, Extension>
    admin_extensions: Record<string, Extension>

    constructor(modules: any, database: any) {
        let config = modules.config
        this.wg_config = modules.wg_config
        let nj: Environment = modules.nj
        nj.addGlobal('dicebear_host', config.dicebear_host)
        nj.addGlobal('client_location', config.client_location)
    
        this.root = load(modules, database, 'root') as RootExtension
    
        this.extensions = {}
        for (const path of this.extensions_list) {
            console.log(path)
            try {
                this.extensions[path] = load(modules, database, path) as Extension
            } catch (err) {
                log.err(`Unable to load extension '${path}':\n\t${err}`)
            }
        }
        
        this.admin_extensions = {}
        for (const ext of Object.keys(this.extensions)) {
            if (this.extensions[ext].admin_only) {
                this.admin_extensions[ext] = this.extensions[ext]
                delete this.extensions[ext]
            }
        }
    }
    
    main: Handle['main'] = (ctx: Context) => {
        var location = ctx.path.shift() || ''
    
        // set request context
        ctx.context = {...ctx.args}
        ctx.context.extensions = this.extensions
        ctx.context.location = location
        
        // Authenticate using user&pass, else using ip
        this.root.authenticate(ctx.req.headers.authorization as BasicAuth|undefined, ctx.ip, this.wg_config.subnet, (user, err) => {
            ctx.context.user = user
            if (err) ctx.context.auth_err = err
            if (user && user.is_admin) ctx.context.extensions = {...ctx.context.extensions, ...this.admin_extensions}
        
            // Extension
            if (location in ctx.context.extensions) {
                let ext = ctx.context.extensions[location]
                // If login required
                if (!user && ext.requires_login(ctx.path)) {
                    ctx.res.writeHead(307, {Location: "/login"})
                    return ctx.res.end()
                }
                if (user && !user.is_admin && ext.requires_admin(ctx.path)) {
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

import { load } from "./extman.ts"
import Log from "./modules/log.ts"
import { unpack } from "./util.ts"
import { readdir } from "fs/promises"
import wg_config from "../config/wireguard.ts"

let log = new Log(true)

export default class Handle {
    root: RootExtension
    extensions = new Map<string, Extension>()
    admin_extensions = new Map<string, Extension>()
    libs = new Map<string, any>()

    async init() {
        let root = await load('root')
        this.libs.set("root", await root.lib())
        
        for (const path of await readdir(`${import.meta.dirname}/extensions`)) {
            if (path == 'root')
                continue
            
            try {
                let lib = await (await load(path)).lib()
                if (lib == null) {
                    continue
                }
                else {
                    this.libs.set(path, lib)
                }
            } catch (err: any) {
                log.err(`Unable to load library '${path}':\n\t${err.message}\n${err.stack}`)
            }
        }
        
        Object.freeze(this.libs)
        
        this.root = await root.main(this.libs) as unknown as RootExtension

        for (const path of await readdir(`${import.meta.dirname}/extensions`)) {
            if (path == 'root')
                continue

            try {
                let extension_loader = await load(path)
                let extension = await extension_loader.main(this.libs) as Extension | null
                if (extension == null) {
                    continue
                }
                if (extension.admin_only) {
                    this.admin_extensions.set(extension.name, extension)
                }
                else {
                    this.extensions.set(extension.name, extension)
                }
            } catch (err: any) {
                log.err(`Unable to load extension '${path}':\n\t${err.message}\n${err.stack}`)
            }
        }
    }
    
    async main(partial_ctx: PartialContext) {
        let location = partial_ctx.path.shift() ?? ''
    
        // set request context
        let ctx: Context = {
            ...partial_ctx,
            context: {
                ...partial_ctx.args,
                extensions: new Map(this.extensions),
                location,
            }
        }
        
        // Authenticate using user&pass, else using ip
        const [user, err] = await this.root.authenticate(ctx.req.headers.authorization as BasicAuth|undefined, ctx.ip, wg_config.subnet).then(unpack<User>)

        ctx.context.user = user
        ctx.context.auth_err = err

        if (user && user.is_admin)
            this.admin_extensions.forEach((v, k) => ctx.context.extensions.set(k, v))
    
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

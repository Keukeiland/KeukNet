import LibProxy from "./libproxy.ts"

export abstract class ExtensionBase<Libraries extends {} = {[key: string]: any}> implements Extension {
    admin_only = false
    tables = false
    disabled = false
    hidden = false
    libs: LibProxy<Libraries> = null as any
    name: Extension['name'] = "default_name"
    title: Extension['title'] = "Default Title"

    static async init<Libraries extends {}>(inst: Extension<Libraries>, context: InitContext, libs: ReadonlyMap<string, any>): Promise<void> {
        inst.libs = new LibProxy(context, inst, libs)
    }

    init: Extension['init'] = (context, libs) => {
        return ExtensionBase.init(this, context, libs)
    }

    /**
     * @returns true if the path requires being logged in, else false
     */
    requires_login: Extension['requires_login'] = (path) => {
        return true
    }

    requires_admin: Extension['requires_admin'] = (path) => {
        return this.admin_only
    }

    handle_req: Extension['handle_req'] = async (ctx: Context) => {
        ctx.context.extension = this as unknown as Extension
        return await this.handle(ctx)
    }

    abstract handle: Extension['handle']

    return: Extension['return'] = (ctx, err, location, err_code=500) => {
        const {res} = ctx
        if (err) {
            res.writeHead(err_code)
            return res.end()
        }
        let code = 200
        let args: any = {}
        
        if (location) {
            code = 307
            args['Location'] = location
        }
        
        res.writeHead(code, args)
        return res.end()
    }
}

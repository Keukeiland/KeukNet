import { Environment } from "nunjucks"
import { Tables } from "./tables.ts"

export abstract class ExtensionBase implements Extension {
    admin_only = false
    tables = false
    dependencies: Extension['dependencies'] = []
    initialized_deps: DependencyMap = new DependencyMapImpl()
    name: Extension['name'] = "default_name"
    title: Extension['title'] = "Default Title"

    static init(inst: ExtensionBase, context: InitContext): void | Promise<void> {
        let global: any = context.modules
        let path = context.path
        let database = context.database

        inst.initialized_deps = new DependencyMapImpl(global, context)

        // Init db
        if (inst.tables) {
            // init tables
            let tables = new (require(`${path}tables`).default)(database, inst.initialized_deps.get('DB'), inst.name) as Tables
            let result = tables.migrate()
            return result
        }
    }

    abstract init: Extension['init']

    /**
     * @returns true if the path requires being logged in, else false
     */
    requires_login: Extension['requires_login'] = (path) => {
        return true
    }

    requires_admin: Extension['requires_admin'] = (path) => {
        return this.admin_only
    }

    handle_req: Extension['handle_req'] = (ctx: Context) => {
        ctx.context.extension = this as unknown as Extension
        return this.handle(ctx, this.initialized_deps)
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

    return_text: Extension['return_text'] = (ctx, item) => {
        const {req, res} = ctx
        let [texts, nj, content]: [any, Environment, any] = this.initialized_deps.massGet('texts', 'nj', 'content')

        ctx.context.__render_item = texts[item]
        nj.renderString(
            '{% extends "layout.html" %}{% block body %}{{__render_item |safe}}{% endblock %}',
            ctx.context, (err: Error | null, data: FileData) => {
                if (err) {
                    res.writeHead(500)
                    return res.end()
                }
                res.writeHead(200, content.HTML)

                if (data !== null)
                    return res.end(data)
                else
                    return res.end()
        })
    }

    return_html: Extension['return_html'] = (ctx, item, err, err_code=500, success_code=200, headers=undefined) => {
        const {req, res} = ctx
        let [nj, content] = this.initialized_deps.massGet('nj', 'content')
        
        if (err) {
            res.writeHead(err_code)
            return res.end()
        }
        
       headers = {...content.HTML, ...headers}

        nj.render(this.name+'/'+item+'.html', ctx.context, (err: null|Error, data: FileData) => {
            if (err) {
                res.writeHead(err_code)
                return res.end()
            }
            res.writeHead(success_code, headers)

            if (data !== null)
                return res.end(data)
            else
                return res.end()
        })
    }

    return_file: Extension['return_file'] = (ctx, file) => {
        const {res} = ctx
        let [fetch, content]: [Fetch, ContentType] = this.initialized_deps.massGet('Fetch', 'content')

        fetch.file(file, (data?: FileData, filetype?: string, err?: Error) => {
            if (err) {
                res.writeHead(404)
                res.end()
                return
            }
            // @ts-ignore
            res.writeHead(200, content[filetype])

            if (data != null)
                return res.end(data)
            else
                return res.end()
        })
    }

    return_data: Extension['return_data'] = (ctx, data, err, headers, err_code=404) => {
        const {res} = ctx

        if (err) {
            res.writeHead(err_code)
            return res.end()
        }
        let args: any = {"Content-Type": "text/plain charset utf-8"}

        if (headers)
            args = headers
        
        res.writeHead(200, args)
        return res.end(data)
    }

    set_cookie: Extension['set_cookie'] = (key, value, secure=false) => {
        let cookie = this.initialized_deps.get('cookie')

        if (secure)
            return cookie.serialize(
                key,
                value, {
                    secure: true,
                    httpOnly: true
                }
            )
        else
            return cookie.serialize(
                key,
                value
            )
    }

    del_cookie: Extension['del_cookie'] = (key) => {
        let cookie = this.initialized_deps.get('cookie')

        return cookie.serialize(
            key,
            '', {
                expires: new Date(1)
            }
        )
    }
}

class DependencyMapImpl implements DependencyMap {
    private global: any
    private context: InitContext | {}
    private map = new Map<string, any>()

    constructor(global?: any, context?: InitContext) {
        if (global !== undefined && context !== undefined) {
            this.global = global
            this.context = context
        }
        else {
            this.global = {}
            this.context = {}
        }
    }

    forEach = this.map.forEach
    has = this.map.has

    set(key: string, value: any): this {
        if (!this.map.has(key))
            this.map.set(key, value)
        return this
    }

    get(key: string) {
        if (!this.map.has(key)) {
            // Assumes type of not instantiated modules to be `Function`
            let dep: any
            if (typeof this.global[key] === typeof Function) {
                dep = new this.global[key]
                dep.init(this.context)
            }
            else
                dep = this.global[key]

            this.map.set(key, dep)
        }
        return this.map.get(key)
    }

    massGet<S extends string[]>(...items: S): VariableSizeArray<S, any> {
        let result = [] as VariableSizeArray<S, any>
        items.forEach((v, _, __) => 
            result.push(this.get(v))
        )
        return result
    }
}

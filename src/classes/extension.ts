export abstract class ExtensionBase implements Extension {
    admin_only = false
    tables = false
    dependencies: Extension['dependencies']
    initialized_deps = new DependencyMapImpl()
    name: Extension['name']
    title: Extension['title']

    static init(inst: ExtensionBase, context: InitContext): ResultStatus {
        let global: any = context.modules
        let path = context.path
        let database = context.database

        // Init dependencies
        for (const dep of inst.dependencies) {
            switch (dep) {
                case 'fetch': {
                    inst.initialized_deps.set('fetch', new global.Fetch(path))
                    break
                }
                default: {
                    inst.initialized_deps.set(dep, global[dep])
                }
            }
        }
        // Init db
        if (inst.tables) {
            // create interface
            inst.initialized_deps.set('db', new global.DB(database, this.name))
            // init tables
            new ((require(`${path}tables`))(global.Tables))(database, inst.initialized_deps.get('db'), this.name)
        }

        return [true]
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
        let [texts, nj, content] = this.initialized_deps.massGet('texts', 'nj', 'content')

        ctx.context.__render_item = texts[item]
        nj.renderString(
            '{% extends "layout.html" %}{% block body %}{{__render_item |safe}}{% endblock %}',
            ctx.context, (err: null|Error, data: FileData) => {
                if (err) {
                    res.writeHead(500)
                    return res.end()
                }
                res.writeHead(200, content.HTML)
                return res.end(data)
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
            return res.end(data)
        })
    }

    return_file: Extension['return_file'] = (ctx, file) => {
        const {res} = ctx
        let [fetch, content] = this.initialized_deps.massGet('fetch', 'content')

        fetch.file(file, (data: FileData, filetype: string, err?: Error) => {
            if (err) {
                res.writeHead(404)
                res.end()
                return
            }
            res.writeHead(200, content[filetype])
            res.end(data)
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

class DependencyMapImpl extends Map<string, any> implements DependencyMap {
    override set(key: string, value: any): this {
        if (!this.has(key))
            super.set(key, value)
        return this
    }

    override delete(key: string): boolean {
        return false
    }
    
    override clear(): void {}

    massGet(...items: string[]): any[] {
        let result: any[] = []
        items.forEach((v, _, __) => 
            result.push(this.get(v))
        )
        return result
    }
}

import crypto from 'crypto'
import { ExtensionBase, Knex } from "../../modules.ts"
import { readdirSync } from "fs"
import { unpack } from '../../util.ts'


export default class extends ExtensionBase implements RootExtension {
    override name = 'root'
    override title = 'Home'
    override tables = true

    favicons: string[] = []
    favicons_path: string

    ip_scope: string
    salt: string


    override init = (context: InitContext) => {
        let modules = context.modules
        let data_path = context.data_path
        this.ip_scope = context.modules.wg_config.ip_scope
        this.salt = context.modules.config.salt

        this.favicons_path = data_path+'favicons/'
        try {
            this.favicons.push(...readdirSync(this.favicons_path))
        } catch {
            (new modules.Log as Log).err(`No favicons found in '${this.favicons_path}'`)
        }

        return ExtensionBase.init(this, context)
    }

    override requires_login: Extension['requires_login'] = (path) => {
        if (path.at(0) == '_') {
            return true
        }
        return false
    }

    override handle: Extension['handle'] = async (ctx) => {
        var location = ctx.path.shift()
        let [knex]: [Knex] = this.get_dependencies('Knex')

        switch (location) {
            case '':
            case undefined: {
                if (!ctx.context.user) {
                    return this.return_text(ctx, 'index')
                }
                return this.return_html(ctx, 'user')
            }
            case 'login': {
                // If user not logged in
                if (!ctx.context.user) {
                    // Attempt
                    if (ctx.data) {
                        let form: {login?: string, register?: string, username?: string, password?: string} = ctx.data.form
                        // Login
                        if (form.login) {
                            let auth = '';
                            if (form.username && form.password) {
                                auth = Buffer.from(form.username+":"+form.password).toString('base64')
                            }
                            return this.return_html(ctx, 'login', undefined, 500, 303, {
                                "Location": "/login",
                                "Set-Cookie": this.set_cookie('auth', 'Basic '+auth, true)
                            })
                        }
                        // Register
                        else if (form.register) {
                            if (form.username && form.password) {
                                form.username = form.username.substring(0, 32)
                                this.addUser(form.username, form.password, (err?: Error) => {
                                    // if invalid credentials
                                    if (err) {
                                        ctx.context.auth_err = err
                                        return this.return_html(ctx, 'login')
                                    }
                                    // success
                                    else {
                                        let auth = Buffer.from(form.username+":"+form.password).toString('base64')
                                        return this.return_html(ctx, 'login', undefined, 500, 303, {
                                            "Location": "/",
                                            "Set-Cookie": this.set_cookie('auth', 'Basic '+auth, true)
                                        })
                                    }
                                })
                            }
                            return
                        }
                    }
                    // First load
                    return this.return_html(ctx, 'login', undefined, 500, 200, {
                        "Set-Cookie": this.del_cookie('auth')
                    })
                }
                // if logged in
                ctx.res.writeHead(307, {"Location": "/"})
                ctx.res.end()
                return
            }
            case 'logout': {
                if (ctx.context.user) {
                    // log user out and redirect
                    ctx.res.writeHead(307, {
                        "Location": "/",
                        "Set-Cookie": this.del_cookie('auth')
                    })
                    ctx.res.end()
                    return
                }
                // if user is logged out
                ctx.res.writeHead(307, {"Location": "/"})
                ctx.res.end()
                return
            }
            case '_': {
                if (ctx.context.user) {
                    var item = ctx.path.shift()
                    switch (item) {
                        case 'pfp': {
                            var args = ctx.req.url.split('?').at(1)
                            if (args) {
                                try {
                                    args = decodeURIComponent(args)
                                } catch {}
                                
                                const head: [number, {}] = await knex.query('user')
                                    .update('pfp_code', args)
                                    .where('id', ctx.context.user.id)
                                    .then(
                                        () => [307, {"Location": "/"}],
                                        () => [500, {}]
                                    )

                                ctx.res.writeHead(...head)
                                ctx.res.end()
                                return
                            }
                            else
                                return this.return_html(ctx, 'pfp')
                        }
                    }
                }
                break
            }
            default: {
                // Templated html
                if (location.startsWith('~'))
                    return this.return_html(ctx, 'content/'+location.split('~')[1], undefined, 404)
                // Favicon
                else if (this.favicons.includes(location))
                    return this.return_file(ctx, this.favicons_path+location)
                // File
                else
                    return this.return_file(ctx, location)
            }
        }
    }

    authenticate: RootExtension['authenticate'] = async (auth, ip, subnet) => {
        let [knex]: [Knex] = this.get_dependencies('Knex')

        if (auth) {
            // Try to get name and password
            const val = this.decrypt_auth(auth)
            if (val instanceof Error)
                return val

            const [name, password] = val

            // Auth using name and password
            const [user, err] = await knex
                .query('user')
                .select<User>('*')
                .where('name', name)
                .first()
                .then(unpack<User>)

            if (user && password == user.password)
                return user
            else
                return new Error('Wrong name or password')
        }
        else if (ip.startsWith(subnet)) {
            // Try using IP-address if no name and password
            const user = await knex
                .query({u: 'user', p: '_profile_device'})
                .select<User>('u.*')
                .join('_profile_device', 'u.id', '=', 'p.user_id')
                .where('p.ip', ip)
                .first()

            return user
        }
    }

    private decrypt_auth(auth: BasicAuth): [name: string, password: string] | Error {
        // decode authentication string
        let data = Buffer.from(auth.slice(6), 'base64').toString('utf-8')
        
        // get name and password
        let [name, password] = data.split(":", 2)
        if (!name || !password) {
            return new Error("Missing name or password")
        }
    
        // hash password
        password = this.hash_pw(password)

        return [name, password]
    }

    private hash_pw(password: string): string {
        return crypto.pbkdf2Sync(password, this.salt, 10000, 128, 'sha512').toString('base64')
    }
    
    addUser(name: User['name'], password: User['password'], callback: (err?: Error) => void) {
        let [knex]: [Knex] = this.get_dependencies('Knex')

        password = this.hash_pw(password)
        // Check if username is already taken
        this.exists(name, (exists, err) => {
            if (err) return callback(err)
            if (exists) return callback(new Error("Username already taken"))
            // add user to db
            knex.query('user')
                // @ts-expect-error
                .insert({name, password, pfp_code: `seed=${name}`})
                .then(() => callback(), (err) => callback(err))
        })
    }

    private exists(name: User['name'], callback: (exists: boolean, err?: Error) => void): void {
        let [knex]: [Knex] = this.get_dependencies('Knex')

        // check if name already exists
        knex.query('user')
            .select('id')
            .where('name', name)
            .then((value) => {
                callback(!!value.length)
            }, (err) => {
                callback(false, err)
            })
    }
}

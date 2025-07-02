import crypto from 'crypto'
import { ExtensionBase } from "../../classes/extension.ts"
import { readdirSync } from "fs"
import { unpack } from '../../util.ts'
import NJ from '../nj/lib.ts'
import HTTP from '../http/lib/index.ts'
import Cookie from '../cookie/lib.ts'
import Knex from '../knex/lib.ts'
import config from '../../../config/config.ts'
import Log from '../../modules/log.ts'

type Libraries = {
    nj: NJ,
    http: HTTP,
    cookie: Cookie,
    knex: Knex,
}

export default class extends ExtensionBase<Libraries> implements RootExtension {
    override name = 'root'
    override title = 'Home'
    override tables = true

    favicons: string[] = []
    favicons_path: string

    salt: string


    override init: Extension['init'] = (context, libs) => {
        ExtensionBase.init(this, context, libs)

        let data_path = context.data_path
        this.salt = config.salt

        this.favicons_path = data_path+'favicons/'
        try {
            this.favicons.push(...readdirSync(this.favicons_path))
        } catch {
            (new Log).err(`No favicons found in '${this.favicons_path}'`)
        }

        // Initialize database tables
        this.libs.knex;
    }

    override requires_login: Extension['requires_login'] = (path) => {
        if (path.at(0) == '_') {
            return true
        }
        return false
    }

    override handle: Extension['handle'] = async (ctx) => {
        var location = ctx.path.shift()
        const {nj, http, cookie, knex} = this.libs

        switch (location) {
            case '':
            case undefined: {
                if (!ctx.context.user) {
                    return nj.return_text(ctx, 'index')
                }
                return nj.return_html(ctx, 'user')
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
                            return nj.return_html(ctx, 'login', undefined, 500, 303, {
                                "Location": "/login",
                                "Set-Cookie": cookie.set('auth', 'Basic '+auth, true)
                            })
                        }
                    }
                    // First load
                    return nj.return_html(ctx, 'login', undefined, 500, 200, {
                        "Set-Cookie": cookie.delete('auth')
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
                        "Set-Cookie": cookie.delete('auth')
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
                                return nj.return_html(ctx, 'pfp')
                        }
                    }
                }
                break
            }
            default: {
                // Templated html
                if (location.startsWith('~'))
                    return nj.return_html(ctx, 'content/'+location.split('~')[1], undefined, 404)
                // Favicon
                else if (this.favicons.includes(location))
                    return http.return_file(ctx, this.favicons_path+location)
                // File
                else
                    return http.return_file(ctx, location)
            }
        }
    }

    authenticate: RootExtension['authenticate'] = async (auth, ip, subnet) => {
        const {knex} = this.libs

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
        // else if (ip.startsWith(subnet)) {
        //     // Try using IP-address if no name and password
        //     const user = await knex
        //         .query({u: 'user', p: '_profile_device'})
        //         .select<User>('u.*')
        //         .join('_profile_device', 'u.id', '=', 'p.user_id')
        //         .where('p.ip', ip)
        //         .first()

        //     return user
        // }
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
        let {knex} = this.libs

        password = this.hash_pw(password)
        // Check if username is already taken
        this.exists(name, (exists, err) => {
            if (err) return callback(err)
            if (exists) return callback(new Error("Username already taken"))
            // add user to db
            knex.query('user')
                .insert({name, password, pfp_code: `seed=${name}`})
                .then(() => callback(), (err) => callback(err))
        })
    }

    private exists(name: User['name'], callback: (exists: boolean, err?: Error) => void): void {
        let {knex} = this.libs

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

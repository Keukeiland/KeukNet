import crypto from 'crypto'
import { ExtensionBase } from "../../modules"
import { readdirSync } from "fs"


export default class extends ExtensionBase implements RootExtension {
    override name = 'root'
    override title = 'Home'
    override tables = true
    override dependencies = ['content','nj','fetch','texts','cookie']

    favicons: string[] = []
    favicons_path: string

    ip_scope: string
    salt: string

    db: Database


    override init = (context: InitContext) => {
        let modules = context.modules
        let data_path = context.data_path
        this.ip_scope = context.modules.wg_config.ip_scope
        this.salt = context.modules.config.salt
        this.db = context.database

        this.favicons_path = data_path+'favicons/'
        try {
            this.favicons.push(...readdirSync(this.favicons_path))
        } catch {
            (new modules.Log as Log).err(`No favicons found in '${this.favicons_path}'`)
        }

        let status = ExtensionBase.init(this, context)

        return status
    }

    override requires_login = (path: string[]) => {
        if (path.at(0) == '_') {
            return true
        }
        return false
    }

    override handle = (ctx: Context, deps: DependencyMap) => {
        var location = ctx.path.shift()
        let [db, data] = deps.massGet('db', 'data')

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
                        let form = ctx.data.form
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
                var item = ctx.path.shift()
                switch (item) {
                    case 'pfp': {
                        var args = ctx.req.url.split('?').at(1)
                        if (args) {
                            try {
                                args = decodeURIComponent(args)
                            } catch {}
                            db.update('user', ['pfp_code=$args'], 'id=$id', [args, ctx.context.user.id], (err?: Error) => {
                                if (err)
                                    ctx.res.writeHead(500)
                                else
                                    ctx.res.writeHead(307, {"Location": "/"})
                                ctx.res.end()
                            })
                            return
                        }
                        else
                            return this.return_html(ctx, 'pfp')
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

    authenticate(auth: BasicAuth | undefined, ip: string, subnet: string, callback: (user: undefined|User, err?: Error) => void): void {
        if (auth) {
            // Try to get name and password
            this.decrypt_auth(auth, (name, password, err) => {
                if (err) {
                    return callback(undefined, err)
                }
                // Auth using name and password
                this.db.get("SELECT * FROM user WHERE name=$name", name, (err?: Error|null, user?: User) => {
                    if (err === null) err = undefined
    
                    if (user) {
                        if (password == user.password) {
                            return callback(user, err)
                        }
                    }
                    return callback(undefined, new Error("Wrong name or password"))
                })
            })
        }
        else if (ip.startsWith(subnet)) {
            // Try using IP-address if no name and password
            this.db.get("SELECT u.* FROM user u JOIN _profile_device p ON p.user_id = u.id WHERE p.ip=$ip", ip, function (err?: Error|null, user?: User) {
                if (err === null) err = undefined
                return callback(user, err)
            })
        }
        else
            return callback(undefined, undefined)
    }

    private decrypt_auth(auth: BasicAuth, callback: (name?: string, password?: string, err?: Error) => void): void {
        // decode authentication string
        let data = Buffer.from(auth.slice(6), 'base64').toString('utf-8')
        
        // get name and password
        let [name, password] = data.split(":", 2)
        if (!name || !password) {
            return callback(undefined, undefined, new Error("Missing name or password"))
        }
    
        // hash password
        password = this.hash_pw(password)

        return callback(name, password)
    }

    private hash_pw(password: string): string {
        return crypto.pbkdf2Sync(password, this.salt, 10000, 128, 'sha512').toString('base64')
    }
    
    addUser(name: User['name'], password: User['password'], callback: (err?: Error) => void) {
        password = this.hash_pw(password)
        // Check if username is already taken
        this.exists(name, (exists, err) => {
            if (err) return callback(err)
            if (exists) return callback(new Error("Username already taken"))
            // add user to db
            this.db.run("INSERT INTO user(name,password,pfp_code) VALUES($name,$password,$pfp_code)", [name, password, 'seed='+name], (err?: Error|null) => {
                if (err === null) err = undefined
                return callback(err)
            })
        })
    }

    private exists(name: User['name'], callback: (exists: boolean, err?: Error) => void): void {
        // check if name already exists
        this.db.get("SELECT EXISTS(SELECT 1 FROM user WHERE name=$name)", name, function (err?: Error|null, result?: Object) {
            if (err === null) err = undefined
            let exists = false
            if (result) exists = !!Object.values(result)[0]
            return callback(exists, err)
        })
    }
}

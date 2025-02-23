import crypto from 'crypto'
import { ExtensionBase, Knex } from '../../modules.ts'
import { unpack } from '../../util.ts'
import minecraft from '../minecraft/index.ts'

export default class extends ExtensionBase {
    override name = 'invite'
    override title = 'Invite'
    override tables = true
    override hidden = true

    salt: string

    override init = (context: InitContext) => {
        this.salt = context.modules.config.salt
        return ExtensionBase.init(this, context)
    }

    override requires_admin: Extension['requires_admin'] = (path) => {
        if (['register', 'create_acc', 'register.css'].includes(path.at(0)??'')) {
            return false
        }
        return true
    }
    override requires_login: Extension['requires_login'] = (path) => {
        if (['register', 'create_acc', 'register.css'].includes(path.at(0)??'')) {
            return false
        }
        return true
    }

    override handle: Extension['handle'] = async (ctx) => {
        let [knex]: [Knex] = this.get_dependencies('Knex')
        let location = ctx.path.shift()
        
        switch (location) {
            case '':
            case undefined:{
                let [invite_links, err] = await knex
                .query('_invite')
                .select<string[]>('*')
                .then(unpack<string[]>)

                ctx.context.invite_links = invite_links
                return this.return_html(ctx, 'index')
            }
            case 'create':{

                const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
                let random_chars = ''
                for (let i = 0; i < 10; i++) {
                    random_chars += chars.charAt(Math.floor(Math.random() * chars.length));
                }
                
                let code =  random_chars
                await knex.query('_invite')
                // @ts-expect-error
                .insert({code: code})

                return this.return(ctx, undefined, location='/invite')
            }
            case 'register': {
                const invite_code = ctx.args.get('code')
                if (!invite_code)
                    return

                if (await this.inviteCodeValid(invite_code)){
                    ctx.context.invite_code = invite_code
                    return this.return_html(ctx, 'register', undefined, 500, 200, {
                        "Set-Cookie": this.del_cookie('auth')
                    })
                }
                return this.return(ctx, undefined, "/")
            }
            case 'create_acc':{
                if (ctx.data)
                {
                    let form: {invite_code?: string, username?: string, password?: string, minecraft_name?: string} = ctx.data.form
                    const valid_invite_code = await this.inviteCodeValid(form.invite_code)
                    if (form.username && form.password && valid_invite_code) {
                        form.username = form.username.substring(0, 32)
                        
                        this.addUser(form.username, form.password, async (id?: number, err?: Error) => {
                            // if invalid credentials
                            if (err) {
                                ctx.context.auth_err = err
                                return this.return_html(ctx, 'login')
                            }
                            // success
                            else {
                                let auth = Buffer.from(form.username+":"+form.password).toString('base64')
                                await knex
                                .query('_invite')
                                // @ts-expect-error
                                .update({
                                    used: true,
                                    user_id: id
                                })
                                .where('code', form.invite_code)
                                .then()
                                if (form.minecraft_name)//If a minecraft name was entered
                                {
                                    await knex
                                    .query('_minecraft_minecraft')
                                    // @ts-expect-error
                                    .insert({minecraft_name: form.minecraft_name, user_id: id})
                                    
                                    ;(ctx.context.extensions.get('minecraft') as any)?.update_whitelist()
                                }

                                return this.return_html(ctx, 'login', undefined, 500, 303, {
                                    "Location": "/",
                                    "Set-Cookie": this.set_cookie('auth', 'Basic '+auth, true)
                                })
                            }
                    })
                }
                }
                return
            }
            default: {
                    return this.return_file(ctx, location)
                }
        }
        
    }

    private hash_pw(password: string): string {
        return crypto.pbkdf2Sync(password, this.salt, 10000, 128, 'sha512').toString('base64')
    }
    
    addUser(name: User['name'], password: User['password'], callback: (id?: number, err?: Error) => void) {
        let [knex]: [Knex] = this.get_dependencies('Knex')

        password = this.hash_pw(password)
        // Check if username is already taken
        this.exists(name, (exists, err) => {
            if (err) return callback(undefined, err)
            if (exists) return callback(undefined, new Error("Username already taken"))
            // add user to db
            knex.query('user')
                // @ts-expect-error
                .insert({name, password, pfp_code: `seed=${name}`})
                .then((id) => callback(id[0] as unknown as number), (err) => callback(undefined, err))
        })
    }

    async inviteCodeValid(code?: string): Promise<boolean>{
        if (code === undefined)
            return false
        let [knex]: [Knex] = this.get_dependencies('Knex')

        let [invite, err] = await knex
            .query('_invite')
            .select<any>('used')
            .where('code', code)
            .first()
            .then(unpack<any>)
        
        if (!err && !invite?.used)
            return true
        else
            return false
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

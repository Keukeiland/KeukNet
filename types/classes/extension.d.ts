declare interface Extension<Libraries extends object = {}> {
    admin_only: boolean
    tables: boolean
    disabled: boolean
    hidden: boolean
    libs: LibProxy<Libraries>

    name: string
    title: string

    init(context: InitContext, libs: ReadonlyMap<string, any>): void | Promise<void>

    requires_login(path: string[]): boolean

    requires_admin(path: string[]): boolean

    handle_req(ctx: Context): Promise<void | Error>
    
    handle(ctx: Context): void | Error | Promise<void | Error>

    return(ctx: Context, err?: Error, location?: string, err_code?: number): void
}

declare interface RootExtension extends Extension {
    authenticate(auth: BasicAuth|undefined, ip: string, subnet: string): Promise<undefined | User | Error>
    addUser(name: User['name'], password: User['password'], callback: (err?: Error) => void): void
}

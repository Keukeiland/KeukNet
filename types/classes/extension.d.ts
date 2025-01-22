declare interface Extension {
    admin_only: boolean
    tables: boolean
    dependencies: string[]

    name: string
    title: string

    init(context: InitContext): void | Promise<void>

    requires_login(path: string[]): boolean

    requires_admin(path: string[]): boolean

    handle_req(ctx: Context): Promise<void | Error>
    
    handle(ctx: Context): void | Error | Promise<void | Error>

    return(ctx: Context, err?: Error, location?: string, err_code?: number): void

    return_text(ctx: Context, item: string): void

    return_html(ctx: Context, item: string, err?: Error, err_code?: number, success_code?: number, headers?: any): void

    return_file(ctx: Context, file: string): void

    return_data(ctx: Context, data: any, err?: Error, headers?: {}, err_code?: number): void

    set_cookie(key: string, value: any, secure?: boolean): string

    del_cookie(key: string): string

    get_dependencies: DependencyMap['massGet']
}

declare interface RootExtension extends Extension {
    authenticate(auth: BasicAuth|undefined, ip: string, subnet: string): Promise<undefined | User | Error>
    addUser(name: User['name'], password: User['password'], callback: (err?: Error) => void): void
}

declare interface DependencyMap<K=string, V=any> {
    forEach(callbackfn: (value: V, key: K, map: Map<K, V>) => void, thisArg?: any): void
    has(key: K): boolean
    set(key: string, value: any): void
    get(key: string): any
    massGet<T extends string[]>(...items: T): { [K in keyof T]: any }
}
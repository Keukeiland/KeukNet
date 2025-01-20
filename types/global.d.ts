declare type Http2ServerRequest = import('http2').Http2ServerRequest
declare type Http2ServerResponse = import('http2').Http2ServerResponse
declare type Environment = import('nunjucks').Environment
declare type Database = import('sqlite3').Database

declare type HttpHeader = {
    "Content-Type"?: string,
    "Cache-Control"?: string
}

declare type BasicAuth = `Basic ${string}`

declare type FileData = string | null

declare type Context = {
    req: Http2ServerRequest
    res: Http2ServerResponse
    
    ip: string
    cookies: Record<string, string>
    path: string[]
    args: Map<string, string>
    data?: {bytes: Buffer, raw: string, form: any}
    context: {
        user?: User
        extensions: Map<string, Extension>
        location: string
        [any: string]: any
    }
}

declare type PartialContext = {
    req: Http2ServerRequest
    res: Http2ServerResponse
    
    ip: string
    cookies: Record<string, string>
    path: string[]
    args: Map<string, string>
    data?: {bytes: Buffer, raw: string, form: any}
}

declare type User = {
    id: number,
    name: string,
    password: string,
    regdate: Date,
    is_admin: boolean,
    pfp_code: string
}

declare type InitContext = {
    modules: any,
    database: Database,
    path: string,
    data_path: string,
    name: string,
}

declare type ResultStatus = [Okay: false, Error: Error] | [Okay: true]

declare type VariableSizeArray<S, T> = { [K in keyof S]: T }

declare interface Module {
    init(context: InitContext): ResultStatus
}

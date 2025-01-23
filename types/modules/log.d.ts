declare interface Log {
    con(req: any, ctx: any): void,
    con_err(req: any): void,
    status(msg: string): void,
    err(err: string): void,
    serverStart(type: string, domain: string, host: string, port: number): void
}

export function load(modules: any, database: Database, namespace: string): unknown {
    let context: InitContext = {
        modules,
        database,
        path: `${__dirname}/extensions/${namespace}/`,
        data_path: `${__dirname}/../data/${namespace}/`,
    }

    let ext = new (require(`./extensions/${namespace}/index`).default)
    let status = ext.init(context)

    if (status.Okay == false) {
        throw new Error(`Failed initializing: ${status.Error}`)
    }

    return ext
}

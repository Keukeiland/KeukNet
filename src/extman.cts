module.exports.load = (modules: any, database: Database, namespace: string): unknown => {
    let context: InitContext = {
        modules,
        database,
        path: `${__dirname}/extensions/${namespace}/`,
        data_path: `${__dirname}/../data/${namespace}/`,
        name: namespace,
    }

    let ext = new (require(`./extensions/${namespace}/index`).default) as Extension
    let status = ext.init(context)

    if (status instanceof Promise)
        status.catch(err => console.error(`Failed initializing [${namespace}]: ${err}`))

    return ext
}

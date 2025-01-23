import { Knex } from "knex"

export async function load(modules: any, namespace: string, knex: Knex): Promise<unknown> {
    let context: InitContext = {
        modules,
        path: `${import.meta.dirname}/extensions/${namespace}/`,
        data_path: `${import.meta.dirname}/../data/${namespace}/`,
        name: namespace,
        knex,
    }

    let ext = new (await import(`./extensions/${namespace}/index`)).default as Extension
    let status = ext.init(context)

    if (status instanceof Promise)
        status.catch(err => console.error(`Failed initializing [${namespace}]: ${err}`))

    return ext
}

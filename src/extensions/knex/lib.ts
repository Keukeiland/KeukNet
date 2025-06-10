import { Knex as KnexDB, default as knexFactory } from "knex"
import { Tables } from "./tables.ts"
import { LibraryBase } from "../../classes/library.ts"

// Shared knex instance
let knex_inst: KnexDB

type Libraries = {
}

export default class Knex extends LibraryBase<Libraries> {
    self: KnexDB
    prefix: string

    override init: Library['init'] = (context, host, libproxy) => {
        LibraryBase.init(this, context, host, libproxy)

        if (!knex_inst) {
            // init database
            knex_inst = knexFactory({
                client: 'sqlite3',
                connection: {
                    filename: context.db_path
                },
                pool: {
                    afterCreate: (con: any, cb: any) => {
                       con.run('PRAGMA foreign_keys = ON', cb)
                    },
                },
                /**
                 * `_<name>_<table>` => selects `_<name>_<table>`
                 * `_<table>`        => selects `_<prefix>_<table>`
                 * `<table>`         => selects `<table>`
                 */
                wrapIdentifier(value, origImpl, queryContext) {
                    if (queryContext !== undefined && 'prefix' in queryContext) {
                        if (value.startsWith('_')) {
                            if (!value.substring(1).includes('_')) {
                                value = `_${queryContext.prefix}${value}`
                            }
                        }
                    }
                    return origImpl(value)
                },
            })
        }

        this.self = knex_inst
        this.prefix = context.name
        
        new Promise(async (resolve) => {
            if (host?.name == 'root') {
                // prepare database
                if (!await this.self.schema.hasTable('db_table_versions')) {
                    await this.self.schema
                        .createTable('db_table_versions', (table) => {
                            table.string('table_id').notNullable().unique()
                            table.integer('version').notNullable().defaultTo(1)
                        })
                }
            }
    
            // Init db
            if (host?.tables) {
                // init tables
                let tables = new ((await import(`${context.path}tables`)).default)(this.self, this, context.name) as Tables
                let result = await tables.migrate()
                return resolve(result)
            }
        })
    }

    raw(value: any): KnexDB.Raw {
        return this.self.raw(value)
    }

    query(table: string | object): KnexDB.QueryBuilder {
        return this.self(table as never).queryContext({prefix: this.prefix})
    }

    schema(): KnexDB.SchemaBuilder {
        return this.self.schema.queryContext({prefix: this.prefix})
    }
}

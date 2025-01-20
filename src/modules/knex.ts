import { Knex } from "knex"

export default class implements Module {
    private knex: Knex
    private prefix: string

    init: Module['init'] = (context: InitContext) => {
        this.knex = context.knex
        this.prefix = context.name
        return [true]
    }

    raw = (value: any) => {
        return this.knex.raw(value)
    }

    query = (table: string | object) => {
        // switch (typeof table) {
        //     case 'string': {
        //         table = this.parseTableName(table)
        //         break
        //     }
        //     case 'object': {
        //         Object.keys(table).forEach((key) => {
        //             // @ts-expect-error
        //             table[key] = this.parseTableName(table[key])
        //         })
        //         break
        //     }
        // }
        return this.knex(table as never).queryContext({prefix: this.prefix})
    }

    schema = () => {
        return this.knex.schema.queryContext({prefix: this.prefix})
    }

    private parseTableName(name: string): string {
        if (name.startsWith('_'))
            return name
        else {
            return `_${this.prefix}_${name}`
        }
    }
}

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
        return this.knex(table as never).queryContext({prefix: this.prefix})
    }

    schema = () => {
        return this.knex.schema.queryContext({prefix: this.prefix})
    }
}

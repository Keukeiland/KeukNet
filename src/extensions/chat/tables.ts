import { MigrationMap, Tables, VersionMap } from '../knex/tables.ts'
import type Knex from '../knex/lib.ts'

export default class extends Tables {
    override versions(versions: VersionMap) {
        versions.set('message', 0)

        return versions
    }

    override migrations(knex: Knex, migrations: MigrationMap) {
        migrations.set('message', {
            0: async ()=>{
                await knex.schema()
                    .createTable('_message', (table) => {
                        table.increments('id').primary()
                        table.integer('user_id').notNullable()
                        table.foreign('user_id', 'fk_user_id').references('user.id')
                        table.timestamp('created_at').notNullable().defaultTo(knex.raw('CURRENT_TIMESTAMP'))
                        table.string('content').notNullable()
                    })
            },
        })

        return migrations
    }
}

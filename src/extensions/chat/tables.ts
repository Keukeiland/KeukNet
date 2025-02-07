import { MigrationMap, Tables, VersionMap } from '../../classes/tables.ts'
import { Knex } from '../../modules.ts'

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
                        table.string('user_id').notNullable()
                        table.string('created_at').notNullable().defaultTo(knex.raw('CURRENT_TIMESTAMP'))
                        table.timestamp('content').notNullable()
                    })
            },
        })

        return migrations
    }
}

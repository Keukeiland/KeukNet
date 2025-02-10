import { MigrationMap, Tables, VersionMap } from '../../classes/tables.ts'
import { Knex } from '../../modules.ts'

export default class extends Tables {
    override versions(versions: VersionMap) {
        versions.set('invite', 0)

        return versions
    }

    override migrations(knex: Knex, migrations: MigrationMap) {
        migrations.set('invite', {
            0: async ()=>{
                await knex.schema()
                    .createTable('_invite', (table) => {
                        table.increments('id').primary()
                        table.string('link').notNullable()
                        table.timestamp('created_at').notNullable().defaultTo(knex.raw('CURRENT_TIMESTAMP'))
                        table.boolean('used').notNullable().defaultTo(false)
                    })
            },
        })

        return migrations
    }
}

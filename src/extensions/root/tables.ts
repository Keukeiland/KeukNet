import { MigrationMap, Tables, VersionMap } from '../../classes/tables.ts'
import { Knex } from '../../modules.ts'

export default class extends Tables {
    override versions(versions: VersionMap) {
        versions.set('user', 1)

        return versions
    }

    override migrations(knex: Knex, migrations: MigrationMap) {
        migrations.set('user', {
            0: async ()=>{
                await knex.schema()
                    .createTable('user', (table) => {
                        table.increments('id').primary()
                        table.string('name').notNullable().unique()
                        table.string('password').notNullable()
                        table.timestamp('registration_date').notNullable().defaultTo(knex.raw('CURRENT_TIMESTAMP'))
                        table.boolean('is_admin').notNullable().defaultTo(false).checkIn(['0','1'])
                    })
            },
            1: async ()=>{
                await knex.schema()
                    .alterTable('user', (table) => {
                        table.string('pfp_code')
                    })
            },
        })

        return migrations
    }
}

import { MigrationMap, Tables, VersionMap } from '../../classes/tables.ts'
import { Knex } from '../../modules.ts'

export default class extends Tables {
    override versions(versions: VersionMap) {
        versions.set('device', 0)

        return versions
    }

    override migrations(knex: Knex, migrations: MigrationMap) {
        migrations.set('device', {
            0: async ()=>{
                await knex.schema().createTable('_device', (table) => {
                    table.increments('id').primary()
                    table.integer('user_id').notNullable()
                    table.foreign('user_id', 'fk_user_id').references('_root_user.id')
                    table.string('name')
                    table.uuid('uuid').notNullable()
                    table.string('ip').notNullable()
                    table.boolean('installed').notNullable().defaultTo(false).checkIn(['0','1'])
                })
            }
        })

        return migrations
    }
}

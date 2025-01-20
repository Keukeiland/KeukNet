import { Knex as rawKnex } from "knex"
import { Knex } from "../modules.ts"

export abstract class Tables {
    raw_knex: rawKnex
    knex: Knex
    prefix: string
    
    constructor(raw_knex: rawKnex, knex: Knex, prefix: string) {
        this.raw_knex = raw_knex
        this.knex = knex
        this.prefix = prefix
    }
    
    migrate(): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            let versions = this.versions(new Map())
            let migrations = this.migrations(this.knex, new Map())

            // Serialize??
            this.raw_knex('db_table_versions')
                .select('table_id', 'version')
                .then(async (data) => {
                    let current_versions = new Map<string, number>()
                    for (const row of data) {
                        current_versions.set(row.table_id, row.version)
                    }
    
                    for (var [table, latest] of versions) {
                        let table_id: TableId | string = `_${this.prefix}_${table}`

                        if (!current_versions.has(table_id)) {
                            console.log(`Adding table ${table_id}`)

                            if (!migrations.has(table))
                                return reject(`Missing entry in migrations for table '${table_id}'`)
                            let migration = migrations.get(table) as MigrationRecord
                            if (!migration[0])
                                return reject(`Missing migration entry 0 for table '${table}'`)
                            await migration[0]()

                            current_versions.set(table_id, 0)
                            this.raw_knex('db_table_versions')
                                .insert({
                                    table_id,
                                    version: current_versions.get(table_id),
                                })
                                .then(
                                    () => {
                                        console.log(`Added table ${table_id}`)
                                    }, (err) => {
                                        if (err) return reject(`Failed adding table version identifier. ${err}`)
                                    }
                                )
                        }

                        let current_version: number
                        while (true) {
                            current_version = current_versions.get(table_id) ?? -1
                            if (current_version < 0 || current_version == latest) break
                            let new_version = current_version +1

                            console.log(`Upgrading table ${table_id} from ${current_version} to ${new_version}`)
                            try {
                                let migration = Tables.getMigration(migrations, table, new_version)
                                if (migration instanceof Error) return reject(migration)
                                await migration()
                            }
                            catch (err) {
                                console.error(err)
                                break
                            }
    
                            current_versions.set(table_id, new_version)

                            this.raw_knex('db_table_versions')
                                .update({
                                    version: new_version,
                                })
                                .whereIn('table_id', [table_id])
                                .then(
                                    () => {
                                        console.log(`Upgraded table ${table_id} to ${new_version}`)
                                    },
                                    (err) => {
                                        return reject(`Failed updating table version identifier. ${err}`)
                                    }
                                )
                        }
                    }
                })
            resolve()
        })
    }

    private static getMigration(migrations: MigrationMap, table: string, version: number): Migration | Error {
        if (migrations.has(table)) {
            let migration = migrations.get(table) as MigrationRecord
            let result = migration[version]
            if (!(result === undefined)) {
                return result as Migration
            }
            else
                return new Error(`Missing migration entry ${version} for table '${table}'`)
        }
        else
            return new Error(`Missing entry in migrations for table '${table}'`)
    }

    versions(versions: VersionMap): VersionMap {
        return versions
    }
    migrations(knex: Knex, migrations: MigrationMap): MigrationMap {
        return migrations
    }
}

export type Migration = Function
export type MigrationRecord = Record<number, Migration>
export type MigrationMap = Map<string, MigrationRecord>
export type VersionMap = Map<string, number>

type TableId = `${string}.${string}`

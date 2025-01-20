export abstract class Tables {
    static readonly SPECIAL = ['user', 'db_table_versions']
    private raw_db: Database
    db: DB
    prefix: string

    constructor(raw_db: Database, db: DB, prefix: string) {
        this.raw_db = raw_db
        this.db = db
        this.prefix = prefix
    }

    migrate(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            let versions = this.versions(new Map())
            let migrations = this.migrations(this.db, new Map())

            this.raw_db.serialize(()=> {
                this.db.select('db_table_versions', ['table_id','version'], null, null, [], (err, data) => {
                    if (err instanceof Error) { // Should only occur on this one missing and root called first
                        let migration = Tables.getMigration(migrations, 'db_table_versions', 0)
                        if (migration instanceof Error) return reject(migration)
                        else migration = migration as Migration
                        migration()
                    }
                    else {
                        let current_versions = new Map<string, number>()
                        for (const row of data) {
                            current_versions.set(row.table_id, row.version)
                        }
        
                        for (var [table, latest] of versions) {
                            let table_id: TableId | string = this.db.formatTableName(table)
                            if (!current_versions.has(table_id)) {
                                console.log(`Adding table ${table_id}`)

                                if (!migrations.has(table))
                                    return reject(`Missing entry in migrations for table '${table_id}'`)
                                let migration = migrations.get(table) as MigrationRecord
                                if (!migration[0])
                                    return reject(`Missing migration entry 0 for table '${table}'`)
                                migration[0]()

                                current_versions.set(table_id, 0)
                                this.raw_db.run("INSERT INTO db_table_versions (table_id, version) VALUES ($table, $version)", [table_id, current_versions.get(table_id)], (err) => {
                                    if (err) return reject(`Failed adding table version identifier. ${err}`)
                                    console.log(`Added table ${table_id}`)
                                })
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
                                    migration()
                                }
                                catch (err) {
                                    console.error(err)
                                    break
                                }
        
                                current_versions.set(table_id, new_version)

                                this.raw_db.run("UPDATE db_table_versions SET version=$version WHERE table_id=$table", [new_version, table_id], (err) => {
                                    if (err)
                                        return reject(`Failed updating table version identifier. ${err}`)
                                    console.log(`Upgraded table ${table_id} to ${new_version}`)
                                })
                            }
                        }
                    }
                })
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
    migrations(db: DB, migrations: MigrationMap): MigrationMap {
        return migrations
    }
}

export type Migration = Function
export type MigrationRecord = Record<number, Migration>
export type MigrationMap = Map<string, MigrationRecord>
export type VersionMap = Map<string, number>

type TableId = `_${string}_${string}`

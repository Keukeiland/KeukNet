module.exports = class Tables {
    tables = {}

    constructor(raw_db, db, prefix) {
        if (this.constructor == Tables) {
            throw new Error("Abstract classes can't be instantiated.");
        }
        this.db = db
        
        // Runs after child has been constructed
        setTimeout(() => {
            raw_db.serialize(()=> {
                db.select('db_table_versions', ['table_id','version'], null, null, [], (err, data) => {
                    if (!data) { // Should only occur on this one missing and root called first
                        this['db_table_versions']['0']()
                    }
                    else {
                        let table_versions = {}
                        for (const row of data) {
                            table_versions[row.table_id] = row.version
                        }
        
                        for (var [table, latest] of Object.entries(this.tables)) {
                            let table_id = `_${prefix}_${table}`
                            if (!Object.hasOwn(table_versions, table_id)) {
                                console.log(`Adding table ${table_id}`)
                                try {
                                    this[table][0]()
                                }
                                catch {
                                    throw new Error(`Missing ${table} version 0`)
                                }
                                table_versions[table_id] = 0
                                raw_db.run("INSERT INTO db_table_versions (table_id, version) VALUES ($table, $version)", [table_id, table_versions[table_id]], (err) => {
                                    if (err) throw new Error(`Failed adding table version identifier. ${err}`)
                                    console.log(`Added table ${table_id}`)
                                })
                            }
                            while (table_versions[table_id] < latest) {
                                console.log(`Upgrading table ${table_id} to ${table_versions[table_id]+1}`)
                                try {
                                    this[table][table_versions[table_id] +1]()
                                }
                                catch {
                                    throw new Error(`Missing ${table} version ${table_versions[table_id] +1}`)
                                }
        
                                table_versions[table_id]++
                                raw_db.run("UPDATE db_table_versions SET version=$version WHERE table_id=$table", [table_versions[table_id], table_id], (err) => {
                                    if (err) throw new Error(`Failed updating table version identifier. ${err}`) 
                                    console.log(`Upgraded table ${table_id} to ${table_versions[table_id]}`)
                                })
                            }
                        }
                    }
                })
            })
        }, 0)
    }
}
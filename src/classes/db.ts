export class DB {
    special_tables = [
        'user',
        'db_table_versions'
    ]
    db: any
    prefix: string

    constructor(db: any, prefix: string) {
        this.db = db
        this.prefix = '_'+prefix+'_'
    }

    __formatTableName = (name: string) => {
        if (
            this.special_tables.includes(name)
            || name.startsWith('_')
        )
            return name
        return this.prefix + name
    }

    // Table modifications
    createTable = (table: string, columns: string[]) => {
        table = this.__formatTableName(table)
        let columns_str = columns.join(', ')
        this.db.run(`CREATE TABLE IF NOT EXISTS ${table} (${columns_str})`, [], (err?: Error) => {
            if (err) throw new Error(`Failed creating new table ${table}. ${err}`)
        })
    }

    dropTable = (table: string) => {
        table = this.__formatTableName(table)
        this.db.run(`DROP TABLE ${table}`, [], (err?: Error) => {
            if (err) throw new Error(`Failed dropping table ${table}. ${err}`)
        })
    }

    // Column modifications
    addColumn = (table: string, column: string, callback: (err?: Error) => void) => {
        table = this.__formatTableName(table)
        this.db.run(`ALTER TABLE ${table} ADD COLUMN ${column}`, [], callback)
    }

    dropColumn = (table: string, column: string, callback: (err?: Error) => void) => {
        table = this.__formatTableName(table)
        this.db.run(`ALTER TABLE ${table} DROP COLUMN ${column}`, [], callback)
    }

    renameColumn = (table: string, old_column: string, new_column: string, callback: (err?: Error) => void) => {
        table = this.__formatTableName(table)
        this.db.run(`ALTER TABLE ${table} RENAME COLUMN ${old_column} to ${new_column}`, [], callback)
    }
    
    // Standard functions
    select = (table: string, columns: string[], where: string, order_by: string, params: any, callback: (err: null|Error, data: null|any) => void) => {
        table = this.__formatTableName(table)
        let columns_str = columns.join(', ')
        // Construct query
        let query = `SELECT ${columns_str} FROM ${table}`
        if (where) query += ` WHERE ${where}`
        if (order_by) query += ` ORDER BY ${order_by}`
        // Get result
        this.db.all(query, params, callback)
    }

    insert = (table: string, columns: string[], values: any[], callback: (err?: Error) => void) => {
        table = this.__formatTableName(table)
        let columns_str = columns.join(', ')
        let values_str = `$${columns.join(', $')}`
        // Run query
        this.db.run(`INSERT INTO ${table} (${columns_str}) VALUES (${values_str})`, values, callback)
    }

    update = (table: string, columns: string[], where: string, values: any, callback: (err?: Error) => void) => {
        table = this.__formatTableName(table)
        let columns_str = columns.join(', ')
        // Run query
        this.db.run(`UPDATE ${table} SET ${columns_str} WHERE ${where}`, values, callback)
    }

    delete = (table: string, where: string, values: any, callback: (err?: Error) => void) => {
        table = this.__formatTableName(table)
        // Run query
        this.db.run(`DELETE FROM ${table} WHERE ${where}`, values, callback)
    }
}

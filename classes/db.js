module.exports = class DB {
    special_tables = [
        'user',
        'db_table_versions'
    ]

    constructor(db, prefix) {
        this.db = db
        this.prefix = '_'+prefix+'_'
    }

    __formatTableName = (name) => {
        if (this.special_tables.includes(name)) {
            return name
        }
        else if (name.startsWith('_')) {
            return name
        }
        return this.prefix + name
    }

    // Table modifications
    createTable = (table, columns) => {
        table = this.__formatTableName(table)
        columns = columns.join(', ')
        this.db.run(`CREATE TABLE IF NOT EXISTS ${table} (${columns})`, [], (err) => {
            if (err) throw new Error(`Failed creating new table ${table}. ${err}`)
        })
    }

    dropTable = (table) => {
        table = this.__formatTableName(table)
        this.db.run(`DROP TABLE ${table}`, [], (err) => {
            if (err) throw new Error(`Failed dropping table ${table}. ${err}`)
        })
    }

    // Column modifications
    addColumn = (table, column, callback) => {
        table = this.__formatTableName(table)
        this.db.run(`ALTER TABLE ${table} ADD COLUMN ${column}`, [], (err) => {
            callback(err)
        })
    }

    dropColumn = (table, column, callback) => {
        table = this.__formatTableName(table)
        this.db.run(`ALTER TABLE ${table} DROP COLUMN ${column}`, [], (err) => {
            callback(err)
        })
    }

    renameColumn = (table, old_column, new_column, callback) => {
        table = this.__formatTableName(table)
        this.db.run(`ALTER TABLE ${table} RENAME COLUMN ${old_column} to ${new_column}`, [], (err) => {
            callback(err)
        })
    }
    
    // Standard functions
    select = (table, columns, where, order_by, params, callback) => {
        table = this.__formatTableName(table)
        columns = columns.join(', ')
        // Construct query
        let query = `SELECT ${columns} FROM ${table}`
        if (where) query += ` WHERE ${where}`
        if (order_by) query += ` ORDER BY ${order_by}`
        // Get result
        this.db.all(query, params, (err, data) => {
            callback(err, data)
        })
    }

    insert = (table, columns, values, callback) => {
        table = this.__formatTableName(table)
        let columns_str = columns.join(', ')
        let values_str = `$${columns.join(', $')}`
        // Run query
        this.db.run(`INSERT INTO ${table} (${columns_str}) VALUES (${values_str})`, values, (err) => {
            callback(err)
        })
    }

    update = (table, columns, where, values, callback) => {
        table = this.__formatTableName(table)
        columns = columns.join(', ')
        // Run query
        this.db.run(`UPDATE ${table} SET ${columns} WHERE ${where}`, values, (err) => {
            callback(err)
        })
    }

    delete = (table, where, values, callback) => {
        table = this.__formatTableName(table)
        // Run query
        this.db.run(`DELETE FROM ${table} WHERE ${where}`, values, (err) => {
            callback(err)
        })
    }
}

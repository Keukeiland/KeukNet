declare interface DB {
    special_tables: string[]
    db: any
    prefix: string

    formatTableName(name: string): string

    createTable(table: string, columns: string[]): void

    dropTable(table: string): void

    addColumn(table: string, column: string, callback: (err: Error|null) => void): void

    dropColumn(table: string, column: string, callback: (err: Error|null) => void): void

    renameColumn(table: string, old_column: string, new_column: string, callback: (err: Error|null) => void): void
    
    select(table: string, columns: string[], where: string|null, order_by: string|null, params: {}, callback: (err: Error|null, data: any) => void): void

    insert(table: string, columns: string[], values: [], callback: (err: Error|null) => void): void

    update(table: string, columns: string[], where: string, values: {}, callback: (err: Error|null) => void): void

    delete(table: string, where: string, values: {}, callback: (err: Error|null) => void): void
}

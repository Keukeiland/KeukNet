declare interface Handle {
    init(modules: any, knex: import('knex').Knex): Promise<void>
    main(ctx: PartialContext): void,
}

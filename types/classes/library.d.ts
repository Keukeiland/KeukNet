declare interface Library<Libraries extends object = {}> {
    libs: LibProxy<Libraries>

    init(context: InitContext, host: Extension|null, libproxy: LibProxy<Libraries>): void
}

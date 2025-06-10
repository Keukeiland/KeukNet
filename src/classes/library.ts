import LibProxy from "./libproxy.ts"

export abstract class LibraryBase<Libraries extends {} = {[key: string]: any}> implements Library {
    libs: LibProxy<Libraries> = new LibProxy()

    static init<Libraries extends {}>(inst: LibraryBase<Libraries>, context: InitContext, host: Extension|null, libproxy: LibProxy<Libraries>): void {
        inst.libs = libproxy
    }

    init: Library['init'] = (context, host, libproxy) => {
        return LibraryBase.init(this, context, host, libproxy)
    }
}

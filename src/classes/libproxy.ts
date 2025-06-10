export default (class {
    cache: Map<string, any> = new Map()

    constructor (context: InitContext, host: Extension|null, libs: ReadonlyMap<string, any>) {
        const self_proxy = new Proxy(
            this, {
                get(self, key: string, target) {
                    if (!libs.has(key)) {
                        console.error(`Extension '${context.name}' tried to import library '${key}' but it does not exist!\n\t(this will return null)`)
                        return null
                    }
                    if (!self.cache.has(key)) {
                        let lib: Library = new (libs.get(key))()
                        lib.init(context, host, self_proxy)
                        self.cache.set(key, lib)
                    }
                    return self.cache.get(key)
                }
            }
        )
        return self_proxy
    }
}) as any

import { exec } from "child_process"
import { existsSync } from "fs"

export async function load(namespace: string) {
    const context: InitContext = {
        path: `${import.meta.dirname}/extensions/${namespace}/`,
        data_path: `${import.meta.dirname}/../data/${namespace}/`,
        name: namespace,
        db_path: `${import.meta.dirname}/../data/db.sqlite`,
    }

    if (existsSync(`${context.path}package.json`)) {
        await new Promise((resolve) => {
            exec('npm install', {cwd: context.path}, resolve)
        })
    }

    return {
        lib: async () => {
            let path: string | null = null
            if (existsSync(`${context.path}lib.ts`) || existsSync(`${context.path}lib.js`)) {
                path = `${context.path}lib`
            }
            else if (existsSync(`${context.path}lib/index.ts`) || existsSync(`${context.path}lib/index.js`)) {
                path = `${context.path}lib/index`
            }
            else {
                return null
            }
        
            let lib_class = (await import(path))?.default
            return lib_class
        },
        main: async (libs: ReadonlyMap<string, any>): Promise<Extension | null> => {
            let path: string | null = null
            if (existsSync(`${context.path}index.ts`) || existsSync(`${context.path}index.js`)) {
                path = `${context.path}index`
            }
            else {
                return null
            }

            let ext_class = (await import(path))?.default
            if (!ext_class) {
                return null
            }

            let ext = new ext_class()
            if (ext.disabled) {
                return null
            }
            
            let status = ext.init(context, libs)
        
            if (status instanceof Promise)
                await status.catch(err => console.error(`Failed initializing [${namespace}]: ${err}`))
        
            return ext
        },
    }
}

import { readFile } from "fs/promises"
import * as path from "path"
import { unpack } from "../../../util.ts"

type FileData = string | null

export default class Fetch {
    /** File extensions of binary filetypes */
    private readonly binary_file_name_extensions: Set<string> = new Set(['png','jpg','mp3'])
    /** Caches processed files */
    private cache: Map<string, FileData> = new Map()
    private root: string

    
    constructor(context: InitContext) {
        this.root = path.join(context.path, "/static/")
    }

    async file(file_path: string): Promise<[FileData, string] | Error> {
        // Ensure path is absolute
        if (!path.isAbsolute(file_path))
            file_path = path.join(this.root, file_path)

        file_path = path.normalize(file_path)
        let filetype = path.extname(file_path).substring(1)

        // load from cache if available
        if (this.cache.has(file_path))
            return [this.cache.get(file_path) as string, filetype]

        // read the file
        const [raw_data, err] = await readFile(file_path).then(unpack<Buffer>, unpack<Error>)
        if (err)
            return err
        
        // cache and return the data
        let data: FileData = (()=>{
            if (this.binary_file_name_extensions.has(filetype))
                return raw_data as unknown as string
            else
                return raw_data.toString('utf8')
        })()

        this.cache.set(file_path, data)
        return [data, filetype]
    }
}

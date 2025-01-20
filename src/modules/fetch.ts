import { readFile } from "fs/promises"
import * as path from "path"

export default class implements Module, Fetch {
    /** File extensions of binary filetypes */
    private readonly BIN_EXTS: Set<string> = new Set(['png','jpg','mp3'])
    /** Caches processed files */
    private cache: Map<string, FileData> = new Map()
    private root: string

    

    init: Module['init'] = (context) => {
        this.root = path.join(context.path, "/static/")
        return [true]
    }

    file: Fetch['file'] = (file_path, callback) => {
        // Ensure path is absolute
        if (!path.isAbsolute(file_path))
            file_path = path.join(this.root, file_path)

        file_path = path.normalize(file_path)
        let filetype = path.extname(file_path).substring(1)

        // load from cache if available
        if (this.cache.has(file_path))
            return callback(this.cache.get(file_path), filetype)

        // read the file
        readFile(file_path)
            // cache and return the data
            .then((raw_data: Buffer) => {
                let data: FileData = null
                if (this.BIN_EXTS.has(filetype))
                    data = raw_data as unknown as string
                else
                    data = raw_data.toString('utf8')

                this.cache.set(file_path, data)
                return callback(data, filetype)
            })
            // error if file can't be read
            .catch(err => {
                return callback(undefined, undefined, err)
            })
    }
}

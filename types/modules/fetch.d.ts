declare interface Fetch {
    file(file_path: string): Promise<[FileData, string] | Error>
}

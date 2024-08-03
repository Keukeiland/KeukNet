declare interface Fetch {
    file(file_path: string, callback: (data?: FileData, type?: string, err?: Error) => void): void
}

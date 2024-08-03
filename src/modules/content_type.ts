// Source: https://stackoverflow.com/a/51398471/15181929

export default (class {
    static readonly HTML = {"Content-Type": "text/html"}
    static readonly ASCII = {"Content-Type": "text/plain charset us-ascii"}
    static readonly TXT = {"Content-Type": "text/plain charset utf-8"}
    static readonly JSON = {"Content-Type": "application/json"}
    static readonly ICO = {"Content-Type": "image/x-icon", "Cache-Control": "private, max-age=3600"}
    static readonly CSS = {"Content-Type": "text/css", "Cache-Control": "private, max-age=3600"}
    static readonly GIF = {"Content-Type": "image/gif", "Cache-Control": "private, max-age=3600"}
    static readonly JPG = {"Content-Type": "image/jpeg", "Cache-Control": "private, max-age=3600"}
    static readonly JS = {"Content-Type": "text/javascript", "Cache-Control": "private, max-age=3600"}
    static readonly PNG = {"Content-Type": "image/png", "Cache-Control": "private, max-age=3600"}
    static readonly MD = {"Content-Type": "text/x-markdown"}
    static readonly XML = {"Content-Type": "application/xml"}
    static readonly SVG = {"Content-Type": "image/svg+xml", "Cache-Control": "private, max-age=3600"}
    static readonly WEBMANIFEST = {"Content-Type": "application/manifest+json", "Cache-Control": "private, max-age=3600"}
    static readonly MP3 = {"Content-Type": "audio/mpeg", "Cache-Control": "private, max-age=3600"}
    static readonly EXE = {"Content-Type": "application/vnd.microsoft.portable-executable", "Cache-Control": "private, max-age=3600"}
    static readonly PY = {"Content-Type": "text/x-python", "Cache-Control": "private, max-age=3600"}

    // Force singleton
    private constructor(private readonly key: string, public readonly value: any) {
    }
}) as ContentType

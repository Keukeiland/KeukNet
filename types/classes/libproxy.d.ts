declare type LibProxy<T extends {}> = {
    [key in keyof T]: T[key]
}

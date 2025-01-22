export function unpack<S>(val: S): [S, undefined] | [undefined, Error] {
    if (val instanceof Error) return [undefined, val]
    else return [val, undefined]
}

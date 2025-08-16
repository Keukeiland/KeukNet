import { Configuration } from "webpack"

export default (path: string): Configuration => ({
    mode: 'development',
    entry: path + '/src/index.ts',
    output: {
        filename: 'lib.js',
        path: path + '/static/build/',
    },
    cache: {
        type: 'filesystem',
    },
    module: {
        rules: [
            {
                test: /\.ts?$/,
                use: path + '/node_modules/ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.js']
    }
})

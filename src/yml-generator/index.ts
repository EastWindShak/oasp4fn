
import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';
import * as yml from 'js-yaml';

const DEFAULTS = {
    path: 'handlers',
    provider: {name: 'aws', runtime: 'nodejs6.10', region: 'us-west-2'},
    plugins: ['serverless-webpack', 'serverless-offline']
};

const WEBPACK =
`var path = require('path');
var nodeExternals = require('webpack-node-externals');

module.exports = {
    target: 'node',
    module: {
        loaders: [
            { test: /\.ts(x?)$/, loader: 'ts-loader' },
            { test: /.json$/, loaders: ['json'] }
        ]
    },
    resolve: {
        extensions: ['.ts', '.js', '.tsx', '.jsx', '']
    },
    output: {
        libraryTarget: 'commonjs',
        path: path.join(__dirname, '.webpack'),
        filename: '[name].js'
    },
    externals: [ nodeExternals() ],
    entry: {\n`;

export function run() {
    let dirs = fs.readdirSync(DEFAULTS.path);
    dirs = _.reduceRight(<any>dirs, (accumulator: any, value) => {
        let aux = `${DEFAULTS.path}${path.sep}${value}`;
        if (fs.statSync(aux).isDirectory())
            accumulator.push(aux);
        return accumulator;
    }, []);
    let files = extractFiles(dirs, []);
    let tscParser: Function;
    switch (DEFAULTS.provider.name) {
        case 'aws':
            tscParser = require('./aws').tscParser;
            break;
        default:
            tscParser = require('./aws').tscParser;
    }
    let serverless_yml = serviceName(DEFAULTS);
    serverless_yml = tscParser(files, serverless_yml);
    generateYaml(serverless_yml);
    generateWebpack(files);
}

let extractFiles = (paths: string[], files: string[]): string[] => {
    if (paths.length === 0)
        return files;
    else {
        let aux_dir = <string>paths.pop();
        let paths_aux = _.reduceRight(fs.readdirSync(aux_dir), (accumulator: any, value: string) => {
            let aux = `${aux_dir}${path.sep}${value}`;
            if (fs.statSync(aux).isFile())
                files.push(aux);
            else
                accumulator.push(aux);
            return accumulator;
        }, []);
        return extractFiles(_.concat(paths, paths_aux), files);
    }
};

let serviceName = (obj: any) => {
    if (!obj.service) {
        let dirs = process.cwd().split(path.sep);
        obj.service = dirs[dirs.length - 1];
    }
    return _.omit(obj, 'path');
};

let generateYaml = (obj: any) => {
    let dump = yml.safeDump(obj);
    fs.writeFile('serverless.yml', dump, (err) => {
        if (err)
            console.log('Error creating severless.yml');
        else {
            console.log('serverless.yml created succesfully');
            console.log(dump);
        }
    });
};

let generateWebpack = (files: any) => {
    let out = _.reduceRight(files, (accumulator: string, file: string) => {
        let str = _.replace(file, /\\/g, '/');
        return `${accumulator}\t\t'${_.trimEnd(`/${str}`, '.ts')}': './${str}',\n`;
    }, WEBPACK);
    out = `${out}\t}\n};`;
    fs.writeFile('webpack.config.js', out, (err) => {
        if (err)
            console.log('Error creating webpack.config.json');
        else {
            console.log('webpack.config.json created succesfully');
            console.log(out);
        }
    });
};
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from "@rollup/plugin-typescript";
import replace from '@rollup/plugin-replace';
import size from 'rollup-plugin-size';
import eslint from '@rollup/plugin-eslint';
import alias from "@rollup/plugin-alias";
import globals from 'rollup-plugin-node-globals';
import inject from "@rollup/plugin-inject";
import { visualizer } from 'rollup-plugin-visualizer';

//import { writeFileSync } from "fs";

const production = !process.env.ROLLUP_WATCH;

export function emitModulePackageFile() {
	return {
		name: 'emit-module-package-file',
		generateBundle() {
			this.emitFile({ type: 'asset', fileName: 'package.json', source: `{"type":"module"}` });
		}
	};
}

// const commitHash = (function () {
//     try {
//         return fs.readFileSync('.commithash', 'utf-8');
//     } catch (err) {
//         return 'unknown';
//     }
// })();

const prodBuild = process.env.prodbuild || false;
console.log("Prod build: ", prodBuild);

const now = new Date(
    process.env.SOURCE_DATE_EPOCH ? process.env.SOURCE_DATE_EPOCH * 1000 : new Date().getTime()
).toUTCString();

const onwarn = warning => {
    // eslint-disable-next-line no-console
    if (warning.code && warning.code === "CIRCULAR_DEPENDENCY" && warning.importer.indexOf('node_modules') < 0 && warning.importer.indexOf("internals.ts") >= 0)
        return; // TMP: don't get flooded by our "internals" circular dependencies for now

    if (warning.code && warning.code === "THIS_IS_UNDEFINED")
        return; // TMP: don't get flooded by this for now

    if (warning.code && warning.code === "EVAL")
        return; // TMP: don't get flooded by this for now

    console.warn("Rollup build warning:", warning);
};

const treeshake = {
    moduleSideEffects: false,
    propertyReadSideEffects: false,
    tryCatchDeoptimization: false
};

const nodePlugins = [
    nodeResolve({
        preferBuiltins: true
    }),
    json({}),
    replace({
        delimiters: ['', ''],
        preventAssignment: true,
        exclude: [
            '/node_modules/rollup-plugin-node-polyfills/**/*.js',
            '/node_modules/rollup-plugin-polyfill-node/**/*.js',
        ],
        values: {
            // Replace readable-stream with stream (polyfilled) because it uses dynamic requires and this doesn't work well at runtime
            // even if trying to add "readable-stream" to "dynamicRequireTargets" in commonJs().
            // https://github.com/rollup/rollup/issues/1507#issuecomment-340550539
            'require(\'readable-stream\')': 'require(\'stream\')',
            'require("readable-stream")': 'require("stream")',
            'require(\'readable-stream/writable\')': 'require(\'stream\').Writable',
            'require("readable-stream/writable")': 'require("stream").Writable',
            'require(\'readable-stream/readable\')': 'require(\'stream\').Readable',
            'require("readable-stream/readable")': 'require("stream").Readable',
            'LegacyTransportStream = require(\'./legacy\')': 'LegacyTransportStream = null',
            'LegacyTransportStream = require(\'winston-transport/legacy\')': 'LegacyTransportStream = null'
        }
    }),
    commonjs({}),
    typescript({
        sourceMap: !prodBuild,
        exclude: "*.browser.ts"
    }),
    size()
];

/**
 * main building routine here
 */

const rollupSourceFile = 'src/index.ts';

export default command => {
    //const { collectLicenses, writeLicense } = getLicenseHandler();
    const commonJSBuild = {
        input: {
            'feeds-sdk.js': rollupSourceFile
        },
        onwarn,
        plugins: [
            ...nodePlugins,
            //!command.configTest && collectLicenses()
            eslint()
        ],
        // fsevents is a dependency of chokidar that cannot be bundled as it contains binary code
        external: [
            'ipfs-http-client',
            '@elastosfoundation/did-js-sdk',
            '@elastosfoundation/hive-js-sdk'
        ],
        treeshake,
        strictDeprecations: true,
        output: {
            //banner,
            chunkFileNames: 'shared/[name].js',
            dir: 'dist',
            entryFileNames: '[name]',
            externalLiveBindings: true,
            format: 'cjs',
            freeze: false,
            // TODO: delete occurences of fsevents - not used in did sdk
            interop: id => {
                if (id === 'fsevents') {
                    return 'defaultOnly';
                }
                return 'default';
            },
            manualChunks: { did: [rollupSourceFile] },
            sourcemap: !prodBuild
        }
    };

    if (command.configTest) {
        return commonJSBuild;
    }

    const esmBuild = {
        ...commonJSBuild,
        input: { 'feeds-sdk.js': rollupSourceFile },
        plugins: [
            ...nodePlugins,
            emitModulePackageFile(),
            //collectLicenses()
        ],
        external: [
            'ipfs-http-client',
            '@elastosfoundation/did-js-sdk',
            '@elastosfoundation/hive-js-sdk'
        ],
        output: {
            ...commonJSBuild.output,
            dir: 'dist/es',
            format: 'es',
            sourcemap: !prodBuild,
            minifyInternalExports: false
        }
    };

    const browserBuilds = {
        input: rollupSourceFile,
        onwarn,
        external: [
            'ipfs-http-client',
            'stream',
            '@elastosfoundation/essentials-connector-client-browser',
            '@elastosfoundation/did-js-sdk'
            //'browserfs'
            /* 'readable-stream',
            'readable-stream/transform' */
        ],
        plugins: [
            // IMPORTANT: DON'T CHANGE THE ORDER OF THINGS BELOW TOO MUCH! OTHERWISE YOU'LL GET
            // GOOD HEADACHES WITH RESOLVE ERROR, UNEXPORTED CLASSES AND SO ON...
            json(),
            // Replace fs with browser implementation.
            replace({
                delimiters: ['', ''],
                preventAssignment: true,
                include: [
                    'src/utils/storage/file.ts'
                ],
                values: {
                    'fs from "./fs"' : 'fs from "./fs.browser.ts"'
                }
            }),
            // Dirty circular dependency removal atttempt
            replace({
                delimiters: ['', ''],
                preventAssignment: true,
                include: [
                    'node_modules/assert/build/internal/errors.js'
                ],
                values: {
                    'require(\'../assert\')': 'null',
                }
            }),
            // Dirty hack to remove circular deps between brorand and crypto-browserify as in browser,
            // brorand doesn't use 'crypto' even if its source code includes it.
            replace({
                delimiters: ['', ''],
                preventAssignment: true,
                include: [
                    'node_modules/brorand/**/*.js'
                ],
                values: {
                    'require(\'crypto\')': 'null',
                }
            }),
            // Circular dependencies tips: https://github.com/rollup/rollup/issues/3816
            replace({
                delimiters: ['', ''],
                preventAssignment: true,
                values: {
                    // Replace readable-stream with stream (polyfilled) because it uses dynamic requires and this doesn't work well at runtime
                    // even if trying to add "readable-stream" to "dynamicRequireTargets" in commonJs().
                    // https://github.com/rollup/rollup/issues/1507#issuecomment-340550539
                    'require(\'readable-stream\')': 'require(\'stream\')',
                    'require("readable-stream")': 'require("stream")',
                    'require(\'readable-stream/writable\')': 'require(\'stream\').Writable',
                    'require("readable-stream/writable")': 'require("stream").Writable',
                    'require(\'readable-stream/readable\')': 'require(\'stream\').Readable',
                    'require("readable-stream/readable")': 'require("stream").Readable',
                    'LegacyTransportStream = require(\'./legacy\')': 'LegacyTransportStream = null',
                    'LegacyTransportStream = require(\'winston-transport/legacy\')': 'LegacyTransportStream = null'
                }
            }),
            alias({
                "entries": [
                    { "find": "buffer", "replacement": "buffer-es6" },
                    { "find": "process", "replacement": "process-es6" },
                    //{ "find": "fs", "replacement": "browserfs/dist/shims/fs" },
                    { "find": "path", "replacement": "path-browserify" },
                    { "find": "crypto", "replacement": "crypto-browserify" },
                    { "find": "util/", "replacement": "node_modules/util/util.js" },
                    { "find": "util", "replacement": "node_modules/util/util.js" },
                    { "find": "stream", "replacement": "./src/utils/browser/stream.js" },
                    { "find": "string_decoder/", "replacement": "node_modules/string_decoder/lib/string_decoder.js" },
                    { "find": "string_decoder", "replacement": "node_modules/string_decoder/lib/string_decoder.js" },
                    { "find": "events", "replacement": "node_modules/events/events.js" },
                    { "find": "assert", "replacement": "node_modules/assert/build/assert.js" }
                ]
            }),
            nodeResolve({
                mainFields: ['browser', 'module', 'jsnext:main', 'main'],
                browser: true,
                preferBuiltins: true,
                dedupe: ['bn.js', 'browserfs', 'buffer-es6', 'process-es6', 'crypto-browserify', 'assert', 'events', 'browserify-sign']
            }),
            // Polyfills needed to replace readable-stream with stream (circular dep)
            commonjs({
                esmExternals: true,
                //requireReturnsDefault: "true", // "true" will generate build error: TypeError: Cannot read property 'deoptimizePath' of undefined
                //requireReturnsDefault: "auto", // namespace, true, false, auto, preferred
                transformMixedEsModules: true, // TMP trying to solve commonjs "circular dependency" errors at runtime
                dynamicRequireTargets: [],
            }),
            globals(), // Defines process, Buffer, etc
            typescript({
                exclude: "*.node.ts"
            }),
            /* nodePolyfills({
                stream: true
                // crypto:true // Broken, the polyfill just doesn't work. We have to use crypto-browserify directly in our TS code instead.
            }), */ // To let some modules bundle NodeJS stream, util, fs ... in browser
            inject({
                "BrowserFS": "browserfs"
            }),
            size(),
            visualizer({
                filename: "./browser-bundle-stats.html"
            }) // To visualize bundle dependencies sizes on a UI.
            // LATER terser({ module: true, output: { comments: 'some' } })
        ],
        treeshake,
        strictDeprecations: true,
        output: [
            {
                file: 'dist/es/feeds-sdk.browser.js',
                format: 'es',
                sourcemap: !prodBuild,
            },
        ]
    };

    return [ commonJSBuild, esmBuild, browserBuilds];
};
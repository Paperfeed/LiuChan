const webpack = require("webpack");
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ChromeExtensionReloader = require('webpack-chrome-extension-reloader');
const ZipPlugin = require('zip-webpack-plugin');
const path = require('path');

// Read package.json and set version for build
const packageJSON = require("./package.json");
const VERSION = packageJSON.version;

const options = {
    entry: {
        options: ['./src/js/Options.ts', './src/js/lib/color-picker.min.js'],
        background: './src/js/background/Background.ts',
        content: './src/js/content/LiuChanContent.ts'
    },
    output: {
        path: path.resolve(__dirname, './release/dist/' + VERSION),
        chunkFilename: "[name].js",
        filename: 'js/[name].js'
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                options: {
                    transpileOnly: true // IMPORTANT! use transpileOnly mode to speed-up compilation
                }
            }
        ]
    },
    optimization: {
        minimize: true,
        /*splitChunks: {
            chunks: 'all'
        }*/
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    }
};


// Plugin operations (with variables to make dev/prod easier to separate
const TypeScriptChecker = new ForkTsCheckerWebpackPlugin();
const cleanOperation = new CleanWebpackPlugin(["release/dist/" + VERSION]);
const copyOperation = new CopyWebpackPlugin([
    { from: 'css/*', ignore: ['*.scss'] },
    { from: 'data/*' },
    { from: 'html/*', },
    { from: 'images/*' },
    { from: 'manifest.json' }
], { context: 'src/' });
const zipOperation = new ZipPlugin({ filename: 'v' + VERSION + '.zip' });
const chromeExtensionReloadWatch = new ChromeExtensionReloader({
    port: 9099,
    reloadPage: true,
    entries: {
        contentScript: 'content',
        background: 'background'
    }
});


// Switch operations depending on whether we started in development or production mode
// Development will automatically reload the extension in Chrome.
// It also won't clean the development directory to prevent Chrome from disabling the addon
if (process.env.NODE_ENV === "development") {
    options.output.path = path.resolve(__dirname, './release/dist/dev');
    options.mode = "development";
    options.devtool = "source-map"; //"cheap-module-eval-source-map";
    options.optimization.minimize = false;
    cleanOperation.paths = ["release/dist/dev"];
    options.plugins = [
        //cleanOperation,
        TypeScriptChecker,
        copyOperation,
        chromeExtensionReloadWatch
    ];
} else {
    options.mode = "production";
    options.plugins = [
        TypeScriptChecker,
        cleanOperation,
        copyOperation,
        zipOperation
    ];
}


module.exports = options;
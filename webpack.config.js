import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { fileURLToPath } from 'url';
import CopyWebpackPlugin from 'copy-webpack-plugin'; // Import the plugin

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
    mode: 'development', // Change to 'production' for builds
    entry: './src/main.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
        assetModuleFilename: 'assets/[name][ext]',
    },
    devServer: {
        static: {
            directory: path.join(__dirname, 'public'), // Serve static files from the "public" directory
            publicPath: '/',
        },
        port: 8080,
        hot: true,
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
                type: 'asset/resource',
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/index.html',
            inject: 'body',
            scriptLoading: 'defer',
        }),
        new CopyWebpackPlugin({  // Configure CopyWebpackPlugin
            patterns: [
                { from: 'src/assets', to: 'assets' }, // Copy assets from src/assets to dist/assets
                 // Add other directories or files you want to copy here
            ],
        }),
    ],
    resolve: {
        extensions: ['.js', '.css', '.svg', '.png'],
    },
};
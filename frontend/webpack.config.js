const path = require('path');
module.exports = {
    entry: "./src/app.ts",
    plugins: [],
    module: { rules: [] },
    resolve: { extensions: [".ts", ".js"] },
    mode: "development",
    module: {
        rules: [
            {
                test: /\.ts$/i,
                //use: ["ts-loader",MiniCssExtractPlugin.loader, 'css-loader'],
                // to use MiniCssExtractPlugin.loader, 'css-loader' on css files only, use this:
                use: [
                    {
                        loader: 'ts-loader',
                        options: { allowTsInNodeModules: true }
                    }
                ],
            },
        ]
    },
    devServer: {
        static: {
            directory: path.join(__dirname, 'dist'),
        },
        compress: true,
        port: 9001,
    },
};
/* eslint-disable */
const CopyWebpackPlugin = require("copy-webpack-plugin");
const GenerateJsonPlugin = require("generate-json-webpack-plugin");
const GitRevisionPlugin = require("git-revision-webpack-plugin");
const gitRevisionPlugin = new GitRevisionPlugin();

module.exports = {
    mode: "production",
    devtool: false,
    resolve: {
        symlinks: false,
        mainFields: ["browser", "main", "module"]
    },
    node: {
        fs: "empty"
    },
    plugins: [
        new GenerateJsonPlugin("appinfo.json", {
            version: process.env.npm_package_version,
            gitCommitHash: gitRevisionPlugin.commithash()
        }),
        new CopyWebpackPlugin({ patterns: [
            //{ from: "src/demo/**/*.{html,css}" },
            { from: "assets/", to: "assets/" },
            { from: "index.html", transform(content) {
                return content.toString().replace("src=\"node_modules/steal/steal.js\" main=\"lib/main/Hyperloop\"",
                    "src=\"index.js\"");
            }},
            { from: "style.css" }
        ]})
    ]
};

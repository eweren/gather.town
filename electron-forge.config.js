/* eslint-disable */
const os = require("os");
const path = require("path");

// Package name for macOS should be different.
const packageName = os.platform() === "darwin" ? "Gather" : "gather";

module.exports = {
    packagerConfig: {
        name: packageName,
        // https://electron.github.io/electron-packager/master/interfaces/electronpackager.win32metadataoptions.html
        win32metadata: {
            FileDescription: "A small 2D action platformer with handcrafted pixel art, an emphasis on mood, and a blasting original soundtrack.",
            ProductName: "Gather"
        },
        icon: path.resolve(__dirname, "assets", "appicon.iconset"),
        appCopyright: "Copyright (C) 2021 Nico Hülscher",
        appVersion: require(path.resolve(__dirname, "package.json")).version
    },
    makers: [
        {
            name: "@electron-forge/maker-squirrel",
            config: {
                name: "gather"
            }
        },
        {
            name: "@electron-forge/maker-zip",
            platforms: [
                "darwin"
            ]
        },
        {
            name: "@electron-forge/maker-deb",
            config: {
                icon: "./assets/appicon.iconset/icon_256x256.png",
                productName: "Gather",
                genericName: "Gather",
                categories: [
                    "Game"
                ]
            }
        },
        {
            name: "@electron-forge/maker-rpm",
            config: {}
        }
    ],
    plugins: [
        [
            "@electron-forge/plugin-webpack",
            {
                mainConfig: "./webpack.app.config.js",
                renderer: {
                    config: "./webpack.renderer.config.js",
                    entryPoints: [
                        {
                            js: "./lib/main/Gather.js",
                            name: "./"
                        }
                    ]
                }
            }
        ]
    ]
}

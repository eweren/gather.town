/* eslint-disable */
const os = require("os");
const path = require("path");

// Package name for macOS should be different.
const packageName = os.platform() === "darwin" ? "Hyperloop" : "hyperloop";

module.exports = {
    packagerConfig: {
        name: packageName,
        // https://electron.github.io/electron-packager/master/interfaces/electronpackager.win32metadataoptions.html
        win32metadata: {
            FileDescription: "A small 2D action platformer with handcrafted pixel art, an emphasis on mood, and a blasting original soundtrack.",
            ProductName: "Hyperloop"
        },
        icon: path.resolve(__dirname, "assets", "appicon.iconset"),
        appCopyright: "Copyright (C) 2020 Eduard But, Nico Hülscher, Stephanie Jahn, Benjamin Jung, Nils Kreutzer, Bastian Lang, Ranjit Mevius, Markus Over, Klaus Reimer, Vladimir Sakhovski, Christina Schneider, Lisa Tsakiris, Jennifer van Veen, Moritz Vieth, Matthias Wetter",
        appVersion: require(path.resolve(__dirname, "package.json")).version
    },
    makers: [
        {
            name: "@electron-forge/maker-squirrel",
            config: {
                name: "hyperloop"
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
                productName: "Hyperloop",
                genericName: "Hyperloop",
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
                            js: "./lib/main/Hyperloop.js",
                            name: "./"
                        }
                    ]
                }
            }
        ]
    ]
}

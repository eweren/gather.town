import { app, BrowserWindow } from "electron";
import { GAME_HEIGHT, GAME_WIDTH } from "./constants";
import path from "path";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) { // eslint-disable-line global-require
    app.quit();
}

app.on("certificate-error", (event, webContents, url, error, certificate, callback) => {
    console.log("Error");
    // On certificate error we disable default behavior (stop loading the page)
    // and we then say "it is all fine - true" to the callback
    event.preventDefault();
    callback(true);
});

app.name = "Gather";
app.allowRendererProcessReuse = true;

const createWindow = () => {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
        minWidth: GAME_WIDTH,
        minHeight: GAME_HEIGHT,
        fullscreen: true,
        title: "Gather",
        icon: path.join(__dirname, "../renderer/assets/appicon.iconset/icon_256x256.png")
    });

    // and load the index.html of the app.
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));

    // Open the DevTools.
    // mainWindow.webContents.openDevTools();

    // Hide menu
    mainWindow.setMenu(null);
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    // For this game though, the situation is a bit different and
    // we *do want* to quit the app once the last window is gone.
    app.quit();
});

app.on("activate", () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

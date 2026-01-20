const { autoUpdater } = require("electron-updater");
const { app, dialog } = require("electron");
const logger = require("./logger");

autoUpdater.autoDownload = false;

autoUpdater.on("error", (error) => {
  // Silently ignore update errors (e.g., no update server configured)
  logger.debug("updater", `Update error: ${error?.message || "unknown"}`);
});

autoUpdater.on("update-available", async () => {
  const { response } = await dialog.showMessageBox({
    type: "question",
    title: "Found Updates",
    message: "Found a new version, do you want update now?",
    defaultId: 0,
    cancelId: 1,
    buttons: ["Yes", "No"],
  });

  if (response === 0) {
    logger.debug("updater", "update available");
    await autoUpdater.downloadUpdate();
  }
});

autoUpdater.on("update-downloaded", async () => {
  const { response } = await dialog.showMessageBox({
    type: "question",
    title: "Update Download",
    buttons: ["Install and Relaunch", "Later"],
    defaultId: 0,
    cancelId: 1,
    message: `A new version of ${app.getName()} has been downloaded!`,
  });

  if (response === 0) {
    setImmediate(() => autoUpdater.quitAndInstall());
  }
});

autoUpdater.on("download-progress", (progressObj) =>
  logger.debug(
    "updater",
    `Update Download progress: ${JSON.stringify(progressObj)}`
  )
);

async function _simpleCheck() {
  const result = await _update();
  if (!result?.updateInfo) {
    await dialog.showMessageBox({
      type: "info",
      message: "Auto-update not available",
      detail: "Check GitHub releases for new versions.",
    });
    return;
  }

  const { updateInfo } = result;
  const currentVersion = app.getVersion();

  logger.debug(
    "updater",
    `Current Version: ${currentVersion} | Server Version: ${updateInfo.version}`
  );

  if (updateInfo.version === currentVersion) {
    await dialog.showMessageBox({
      type: "info",
      message: "You're up-to-date!",
      detail: `${app.getName()} ${updateInfo.version} is currently the newest version available.`,
    });
  }
}

async function _update() {
  try {
    autoUpdater.logger = logger.log;
    return await autoUpdater.checkForUpdates();
  } catch (err) {
    // Auto-updater not configured, skip silently
    logger.debug("updater", "Auto-update not available");
    return null;
  }
}

exports.update = _update;
exports.simpleCheck = _simpleCheck;

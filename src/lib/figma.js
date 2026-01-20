const psList = require("ps-list");
const winInfo = require("@bberger/win-info-fork");
const fs = require("fs");

const logger = require("./logger");
const util = require("./util");

function getSettingsPath() {
  if (process.platform === "darwin") {
    return `${util.getHomePath()}/Library/Application Support/Figma/settings.json`;
  }
  return `${util.getPath("appData")}/Figma/settings.json`;
}

async function getFigmaMetaData() {
  let currentFigmaFilename = null;
  let shareLink = null;

  try {
    const settingsPath = getSettingsPath();

    if (!fs.existsSync(settingsPath)) {
      return { currentFigmaFilename, shareLink };
    }

    const figmaDataFile = fs.readFileSync(settingsPath, "utf-8");
    const figmaData = JSON.parse(figmaDataFile);

    if (!figmaData.windows || figmaData.windows.length === 0) {
      return { currentFigmaFilename, shareLink };
    }

    // Find the most recently viewed tab across all windows
    let activeTab = null;
    let latestViewTime = 0;

    for (const window of figmaData.windows) {
      if (!window.tabs) continue;

      for (const tab of window.tabs) {
        const viewTime = tab.lastViewedAt || 0;
        if (viewTime > latestViewTime && tab.title) {
          latestViewTime = viewTime;
          activeTab = tab;
        }
      }
    }

    if (activeTab) {
      currentFigmaFilename = activeTab.title;
      const { path, params } = activeTab;
      if (path) {
        shareLink = encodeURI(
          `https://www.figma.com${path}${params ? params : ""}`
        );
      }
    }
  } catch (err) {
    logger.error("figma", err.message);
  }

  return { currentFigmaFilename, shareLink };
}

async function getIsFigmaRunning() {
  let isRunning = false;
  const processList = await psList();

  if (process.platform === "darwin") {
    isRunning =
      processList.filter((p) =>
        p.cmd.includes("Figma.app/Contents/MacOS/Figma")
      ).length > 0;
  } else if (process.platform === "win32") {
    isRunning =
      processList.filter((p) => p.name.includes("Figma.exe")).length > 0;
  }

  return isRunning;
}

async function getIsFigmaActive() {
  let isActive = false;

  try {
    const activeWin = await winInfo.getActive();
    isActive = activeWin?.owner?.name.includes("Figma") || false;
  } catch (err) {}

  return isActive;
}

module.exports = {
  getFigmaMetaData,
  getIsFigmaRunning,
  getIsFigmaActive,
};

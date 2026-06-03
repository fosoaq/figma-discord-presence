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

// Cache for settings.json contents — invalidated by mtime
let cachedSettings = null;
let cachedMtime = 0;

function readSettings() {
  const settingsPath = getSettingsPath();

  try {
    const stat = fs.statSync(settingsPath);
    const mtime = stat.mtimeMs;

    if (cachedSettings !== null && mtime === cachedMtime) {
      return cachedSettings;
    }

    const raw = fs.readFileSync(settingsPath, "utf-8");
    cachedSettings = JSON.parse(raw);
    cachedMtime = mtime;
    return cachedSettings;
  } catch (err) {
    logger.error("figma", err.message);
    return null;
  }
}

async function getFigmaMetaData() {
  let currentFigmaFilename = null;
  let shareLink = null;
  let editorType = "design";
  let isBranch = false;

  try {
    const figmaData = readSettings();

    if (!figmaData || !figmaData.windows || figmaData.windows.length === 0) {
      return { currentFigmaFilename, shareLink, editorType, isBranch };
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
      editorType = activeTab.editorType || "design";
      isBranch = activeTab.isBranch || false;
    }
  } catch (err) {
    logger.error("figma", err.message);
  }

  return { currentFigmaFilename, shareLink, editorType, isBranch };
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

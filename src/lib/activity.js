const EventEmitter = require("events");
const { Client } = require("@xhayper/discord-rpc");

const {
  getIsFigmaRunning,
  getFigmaMetaData,
  getIsFigmaActive,
} = require("./figma");
const logger = require("./logger");
const config = require("./config");
const events = require("./events");

const CLIENT_ID = "866719067092418580";

const RECONNECT_BASE_DELAY = 5000;
const RECONNECT_MAX_DELAY = 60000;
const RECONNECT_MAX_ATTEMPTS = 10;

class Activity extends EventEmitter {
  constructor() {
    super();

    this.client = null;
    this.setActivityInterval = null;
    this.startTime = null;
    this.reconnectAttempts = 0;
    this.reconnectTimer = null;
    this.isManualDisconnect = false;
  }

  async login() {
    this.emit(events.DISCORD_CONNECTING);
    this.client = new Client({ clientId: CLIENT_ID });

    this.client.on("ready", () => {
      this.reconnectAttempts = 0;
      this.emit(events.DISCORD_READY);
      this.setActivity();
      this.startInterval();
    });

    this.client.on("disconnected", () => {
      this.emit(events.DISCORD_DISCONNECTED);
      this.client = null;
      this.stopInterval();
      if (!this.isManualDisconnect) {
        this.scheduleReconnect();
      }
    });

    try {
      await this.client.login();
    } catch (err) {
      logger.error("activity", err.message);
      this.emit(events.DISCORD_LOGIN_ERROR);
      this.client = null;
    }
  }

  async setActivity() {
    if (this.client === null) return;

    try {
      const isFigmaRunning = await getIsFigmaRunning();

      if (isFigmaRunning) {
        if (!this.startTime) {
          this.startTime = new Date();
        }
      } else {
        await this.client.user?.clearActivity();
        this.startTime = null;
        return;
      }

      const { currentFigmaFilename, shareLink, editorType, isBranch } = await getFigmaMetaData();

      if (currentFigmaFilename === null) {
        return;
      }

      const isFigmaActive = await getIsFigmaActive();

      // Gather Config Options
      const isHideFilenames = config.get("hideFilenames");
      const isHideStatus = config.get("hideStatus");
      const isHideViewButton = config.get("hideViewButton");

      const isFigJam = editorType === "figjam";
      const largeImageKey = isFigJam ? "figjam" : "logo";
      const largeImageText = isFigJam ? "Jamming in FigJam" : "Designing in Figma";
      const viewButtonLabel = isFigJam ? "View in FigJam" : "View in Figma";

      // Build detail string
      const statusText = !isHideStatus ? (isFigmaActive ? "Active" : "Idle") : "";
      const fileText = !isHideFilenames
        ? `${isBranch ? "[branch] " : ""}${currentFigmaFilename}`
        : null;
      const details = [
        statusText,
        statusText && fileText ? " " : "",
        fileText ? `in: "${fileText}"` : "",
      ].join("") || undefined;

      await this.client.user?.setActivity({
        details,
        startTimestamp: this.startTime,
        largeImageKey,
        largeImageText,
        buttons:
          !isHideViewButton && shareLink
            ? [{ label: viewButtonLabel, url: shareLink }]
            : undefined,
      });
    } catch (err) {
      logger.error("activity", `Failed to setActivity: ${err}`);
    }
  }

  scheduleReconnect() {
    if (this.reconnectAttempts >= RECONNECT_MAX_ATTEMPTS) {
      logger.debug("activity", "max reconnect attempts reached, giving up");
      this.reconnectAttempts = 0;
      return;
    }

    const delay = Math.min(
      RECONNECT_BASE_DELAY * Math.pow(2, this.reconnectAttempts),
      RECONNECT_MAX_DELAY
    );
    this.reconnectAttempts++;
    logger.debug("activity", `reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      await this.login();
    }, delay);
  }

  startInterval() {
    const intervalMs = (config.get("updateInterval") || 15) * 1000;
    this.setActivityInterval = setInterval(() => {
      this.setActivity();
    }, intervalMs);
  }

  async stopInterval() {
    clearInterval(this.setActivityInterval);
    this.setActivityInterval = null;
    this.startTime = null;
  }

  async updateOptions() {
    await this.setActivity();
  }

  async connect() {
    this.isManualDisconnect = false;
    this.reconnectAttempts = 0;
    await this.login();
  }

  async disconnect() {
    this.isManualDisconnect = true;
    await this.destroy();
  }

  async destroy() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    try {
      await this.client?.user?.clearActivity();
      await this.client?.destroy();
    } catch {}

    this.client = null;
    this.stopInterval();
  }
}

module.exports = Activity;

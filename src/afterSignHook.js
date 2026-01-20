const fs = require("fs");
const path = require("path");
const { notarize } = require("@electron/notarize");

require("dotenv").config();
module.exports = async function (params) {
  // Only notarize the app on Mac OS only and on CI.
  if (process.platform !== "darwin" || process.env.NODE_ENV === "development") {
    return;
  }

  console.log("afterSign hook triggered", params);

  // Same appId in electron-builder.
  let appId = "com.bryanberger.figma-discord-presence";
  let appPath = path.join(
    params.appOutDir,
    `${params.packager.appInfo.productFilename}.app`
  );

  if (!fs.existsSync(appPath)) {
    throw new Error(`Cannot find application at: ${appPath}`);
  }

  console.log(`Notarizing ${appId} found at ${appPath}`);
  try {
    await notarize({
      teamId: process.env.APPLE_TEAM_ID,
      appBundleId: appId,
      appPath: appPath,
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_ID_PASSWORD,
    });
  } catch (error) {
    console.error(error);
  }
  console.log(`Done notarizing ${appId}`);
};

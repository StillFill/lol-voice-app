const {
  app,
  BrowserWindow,
  ipcMain,
  screen,
  Menu,
  Tray,
  nativeImage,
} = require("electron");
const https = require("https");
const { RtcTokenBuilder, RtcRole } = require("agora-access-token");
const path = require("path");

const appId = "6f47de0b99a04020974097b299acc5f3";
let isQuiting = false;
let win;
// const urlToLoad = "http://localhost:3000/";
const urlToLoad = "https://coral-app-4256a.ondigitalocean.app/";

var AutoLaunch = require("auto-launch");
var autoLauncher = new AutoLaunch({
  name: "LolVoice",
  isHidden: true,
});
// Checking if autoLaunch is enabled, if not then enabling it.
autoLauncher
  .isEnabled()
  .then(function (isEnabled) {
    console.log("IS ENABLED?", isEnabled);
    if (isEnabled) return;
    autoLauncher.enable();
  })
  .catch(function (err) {
    throw err;
  });

const startApplication = (activePlayer, allPlayers) => {
  let loginSettings = app.getLoginItemSettings();

  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  if (!activePlayer) {
    win = new BrowserWindow({
      // fullscreen: true,
      height: 200,
      width: 600,
      minimizable: true,
      maximizable: false,
      fullscreenable: false,
      resizable: false,
      icon: "resources/headset.png",
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    // win.webContents.openDevTools();
    win.setMenu(null);

    win.loadURL(urlToLoad);

    // console.log(__dirname + "/../extraResources/");

    // console.log(path.join(process.resourcePath, "extraResources", ""));
    const configFile = path.join(path.dirname(__dirname), "headset.png");
    console.log(configFile);

    const tray = new Tray(configFile);

    tray.addListener("click", () => {
      win.show();
    });

    tray.setContextMenu(
      Menu.buildFromTemplate([
        {
          label: "Fechar",
          click: () => {
            isQuiting = true;
            app.quit();
          },
        },
      ])
    );

    // if (!loginSettings.wasOpenedAtLogin) {
    //   win.hide();
    // }

    win.on("minimize", function (event) {
      event.preventDefault();
      win.hide();
    });

    win.on("close", function (event) {
      if (!isQuiting) {
        event.preventDefault();
        win.hide();
      }

      return false;
    });

    ipcMain.handle("get-game-data", async () => {
      return null;
    });

    return;
  }

  console.log("ACTIVE PLAYER: ", activePlayer);
  console.log("ALL PLAYERS: ", allPlayers);
  const userSummonnerName = activePlayer.summonerName.split("#")[0];

  const userOnList = allPlayers.find(
    (a) => a.summonerName === userSummonnerName
  );

  const { team: userTeam } = userOnList;
  const teamMates = allPlayers.filter((a) => a.team === userTeam);

  const roomName = teamMates.reduce((a, b) => a + b.summonerName + ":", "");

  console.log(roomName);

  const token = generateToken(appId, userSummonnerName, roomName);

  ipcMain.handle("get-game-data", async () => {
    return {
      token,
      roomName,
      appId,
      userSummonnerName,
      players: teamMates,
    };
  });

  console.log("TRAY");

  console.log("WIN");

  win = new BrowserWindow({
    // fullscreen: true,
    height: height,
    width: width * 0.9,
    minimizable: true,
    maximizable: true,
    fullscreenable: true,
    icon: "resources/headset.png",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.setMenu(null);

  win.loadURL(urlToLoad);
};

const delay = (timeout) =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve(null);
    }, timeout);
  });

let status = null; // match | waiting | null;

const getGameData = () => {
  var request = require("request");

  request(
    "https://127.0.0.1:2999/liveclientdata/allgamedata",
    {
      agent: new https.Agent({
        rejectUnauthorized: false,
      }),
    },
    async (error, _, body) => {
      let isInMatch = true;
      let playerData;

      if (error) {
        isInMatch = false;
      } else if (body) {
        playerData = JSON.parse(body);
        const { activePlayer, allPlayers } = playerData;
        if (!activePlayer || !allPlayers) isInMatch = false;
      }

      const newStatus = isInMatch ? "match" : "waiting";
      console.log("STATUS: ", status);
      console.log("NEW STATUS: ", newStatus);
      if (status === newStatus) return;

      if (win) {
        win.hide();
        win = undefined;
        ipcMain.removeHandler("get-game-data");

        await delay(2000);
      }

      if (isInMatch) {
        status = "match";
        const { activePlayer, allPlayers } = playerData;
        startApplication(activePlayer, allPlayers);
      } else {
        status = "waiting";
        startApplication();
      }
    }
  );
};

app.whenReady().then(async () => {
  for (let i = 0; i < Infinity; i++) {
    getGameData();
    await delay(5000);
  }
});

const generateToken = (appId, userSummonnerName, roomName) => {
  const appCertificate = "4442dd32aee342b3bd4e8adb68bcd09b";

  const currentTime = Math.floor(Date.now() / 1000);
  const privilegeExpireTime = currentTime + 3600;

  try {
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      roomName,
      userSummonnerName,
      RtcRole.PUBLISHER,
      privilegeExpireTime
    );

    console.log(token);

    return token;
  } catch (err) {
    console.log("ERRRO TOKEN: ", err);
  }
};

if (require("electron-squirrel-startup")) app.quit();

module.exports = {
  packagerConfig: {
    asar: true,
    icon: "resources/headset.png",
    extraResource: ["./resources/headset.png"],
  },
  rebuildConfig: {},
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        loadingGif: "resources/loading.gif",
        icon: "resources/headset.ico",
        setupIcon: "resources/headset.ico",
        iconUrl: "https://coral-app-4256a.ondigitalocean.app/headset.jpg",
      },
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin"],
    },
    {
      name: "@electron-forge/maker-deb",
      config: {
        options: {
          icon: "resources/headset.png",
        },
      },
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {
        icon: "resources/headset.ico",
      },
    },
  ],
  plugins: [
    {
      name: "@electron-forge/plugin-auto-unpack-natives",
      config: {
        icon: "resources/headset.ico",
      },
    },
  ],
};

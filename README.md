# Figma Discord Presence

> Update your Discord activity status with rich presence from Figma.

This is a maintained fork of [bryanberger/figma-discord-presence](https://github.com/bryanberger/figma-discord-presence) with fixes for modern macOS/Windows and Figma versions.

![demo](.github/demo.png?raw=true)

## Download

Download the latest version from [Releases](https://github.com/fosoaq/figma-discord-presence/releases):

- **macOS (Apple Silicon):** `Figma Discord Presence-x.x.x-arm64.dmg`
- **macOS (Intel):** `Figma Discord Presence-x.x.x.dmg`
- **Windows:** `Figma Discord Presence Setup x.x.x.exe`

> Note: macOS builds are unsigned. On first launch, right-click the app and select "Open" to bypass Gatekeeper warning.

## What's Fixed

The original project was abandoned and stopped working on modern systems. This fork fixes:

- Updated Discord RPC library (`@xhayper/discord-rpc`) - the old one no longer compiles
- Fixed Figma file detection - now reads directly from Figma's `settings.json` instead of deprecated `windows.plist`
- Updated Electron to v28 for compatibility with modern Node.js
- Removed deprecated dependencies

## Features

- Shows what you're working on in Figma
- Menubar/tray application for convenient control and configuration
- Privacy options for hiding filenames, activity status, and Figma view buttons
- Idle and active indication based on Figma focus state
- Manual reconnect to Discord Gateway
- Enable/disable presence reporting at will

## Requirements

- macOS or Windows
- Figma Desktop app
- Discord with Activity Status enabled

## Building from Source

```bash
# Clone this repository
git clone https://github.com/fosoaq/figma-discord-presence
cd figma-discord-presence

# Install dependencies
npm install

# Run the app
npm start

# Build distributables
npm run dist:mac   # macOS
npm run dist:win   # Windows
```

## Troubleshooting

- **Activity not showing in Discord?** Make sure Activity Status is enabled in Discord settings (Settings → Activity Privacy → Share your activity)
- **macOS permission prompts?** The app needs permission to detect active windows - grant it in System Preferences → Privacy & Security → Accessibility
- **Figma file not detected?** Make sure Figma Desktop is installed and has been opened at least once

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Credits

Original project by [Bryan Berger](https://github.com/bryanberger).

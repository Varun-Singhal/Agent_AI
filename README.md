# Smart Tab Manager - Chrome Extension

A powerful Chrome extension that automatically manages your tabs by closing unused and redundant ones, helping you maintain a clean and efficient browsing experience.

## 🎯 Features

### Core Functionality
- **Duplicate Tab Detection**: Automatically detects and closes tabs with the same URL, keeping only the most recently active one
- **Inactive Tab Management**: Closes tabs that haven't been used for a configurable period (default: 15 minutes)
- **Pinned Tab Protection**: Never closes pinned tabs, ensuring important tabs stay open
- **Domain Whitelist**: Add domains to a whitelist that will never be auto-closed (e.g., Gmail, YouTube, Docs)

### User Controls
- **Options Page**: Comprehensive settings interface for configuring all aspects of the extension
- **Quick Popup**: Fast access to toggle the extension and view statistics
- **Real-time Statistics**: Track how many tabs have been closed today and overall
- **Restore Functionality**: Restore recently closed tabs (up to 10)

### Advanced Features
- **Smart Notifications**: Get notified when tabs are auto-closed (optional)
- **Activity Tracking**: Monitors tab usage to make intelligent closing decisions
- **Configurable Timeouts**: Set custom inactivity periods (1-120 minutes)
- **Background Monitoring**: Continuous monitoring without impacting performance

## 🚀 Installation

### Method 1: Load as Unpacked Extension (Development)

1. **Download the Extension**
   - Download all the extension files to a folder on your computer

2. **Open Chrome Extensions Page**
   - Open Google Chrome
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top-right corner

3. **Load the Extension**
   - Click "Load unpacked"
   - Select the folder containing the extension files
   - The extension should now appear in your extensions list

4. **Pin the Extension**
   - Click the puzzle piece icon in Chrome's toolbar
   - Find "Smart Tab Manager" and click the pin icon

### Method 2: Create Extension Package

1. **Package the Extension**
   - Zip all the extension files (manifest.json, background.js, options.html, etc.)
   - Rename the zip file to have a `.crx` extension

2. **Install the Package**
   - Drag and drop the `.crx` file onto the Chrome extensions page
   - Confirm the installation when prompted

## ⚙️ Configuration

### Initial Setup

1. **Open Settings**
   - Click the Smart Tab Manager icon in your toolbar
   - Click "⚙️ Open Settings"

2. **Configure Basic Settings**
   - **Enable Smart Tab Manager**: Toggle the extension on/off
   - **Inactivity Timeout**: Set how long tabs should be inactive before closing (1-120 minutes)
   - **Auto-close Duplicates**: Enable/disable automatic duplicate tab closing
   - **Show Notifications**: Choose whether to get notified when tabs are closed

3. **Set Up Whitelist**
   - Add domains you want to protect from auto-closing
   - Examples: `gmail.com`, `youtube.com`, `docs.google.com`
   - Click "Add" after entering each domain

### Quick Controls

Use the popup interface for quick access to:
- Toggle the extension on/off
- View daily statistics
- Manually close duplicate tabs
- Restore recently closed tabs

## 📁 File Structure

```
smart-tab-manager/
├── manifest.json          # Extension manifest
├── background.js          # Main service worker
├── options.html           # Settings page
├── options.js            # Settings page logic
├── popup.html            # Quick access popup
├── popup.js              # Popup logic
├── styles.css            # UI styling
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # This file
```

## 🔧 Technical Details

### Permissions Used
- `tabs`: Monitor and manage browser tabs
- `storage`: Save user preferences and statistics
- `notifications`: Show notifications for closed tabs
- `activeTab`: Access current tab information

### Browser Compatibility
- Chrome 88+ (Manifest V3)
- Chromium-based browsers (Edge, Brave, etc.)

### Performance
- Lightweight background monitoring
- Efficient tab activity tracking
- Minimal memory footprint
- Non-blocking operations

## 🛠️ Development

### Prerequisites
- Google Chrome 88+
- Basic knowledge of JavaScript and Chrome Extension APIs

### Building from Source
1. Clone or download the source code
2. Make any desired modifications
3. Load as unpacked extension in Chrome
4. Test your changes
5. Package for distribution

### Key Components

#### Background Script (`background.js`)
- Main service worker handling tab monitoring
- Implements duplicate detection algorithm
- Manages inactive tab tracking
- Handles tab closing operations

#### Options Page (`options.html` + `options.js`)
- User interface for configuration
- Settings persistence using Chrome Storage API
- Whitelist management
- Statistics display

#### Popup Interface (`popup.html` + `popup.js`)
- Quick access controls
- Real-time statistics
- Manual operations (close duplicates, restore tabs)

## 🐛 Troubleshooting

### Common Issues

**Extension not working:**
- Check if the extension is enabled in `chrome://extensions/`
- Verify all permissions are granted
- Try reloading the extension

**Tabs not being closed:**
- Check the inactivity timeout setting
- Verify the domain isn't whitelisted
- Ensure the tab isn't pinned
- Check if the extension is enabled

**Settings not saving:**
- Check Chrome storage permissions
- Try refreshing the options page
- Clear extension data and reconfigure

### Debug Mode
1. Open Chrome DevTools
2. Go to `chrome://extensions/`
3. Click "Inspect views: background page"
4. Check the console for error messages

## 📊 Statistics

The extension tracks:
- Tabs closed today
- Total tabs closed (stored locally)
- Current active tabs
- Extension uptime

## 🔒 Privacy

- All data is stored locally on your device
- No data is sent to external servers
- Tab URLs are only processed locally for duplicate detection
- Whitelist and settings are synced across devices (if Chrome sync is enabled)

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

## 📞 Support

If you encounter any issues or have questions:
1. Check the troubleshooting section above
2. Review the Chrome extension documentation
3. Submit an issue with detailed information about the problem

---

**Happy browsing with Smart Tab Manager!** 🚀


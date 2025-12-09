# 📝 Interview Question Extractor - Chrome Extension

A beautiful Chrome extension that analyzes Word documents (.docx) and extracts the 5 most important interview questions using Google's Gemini AI.

## ✨ Features

- **📄 Drag & Drop Interface**: Beautiful, intuitive file upload with drag-and-drop support
- **🤖 AI-Powered Analysis**: Uses Google Gemini AI to intelligently extract key questions
- **🎯 Smart Extraction**: Automatically identifies the 5 most important interview questions
- **💫 Beautiful UI**: Modern, dark-themed interface with smooth animations
- **⚡ Fast Processing**: Quick analysis and results display

## 🚀 Installation

1. **Download/Clone** this repository
2. **Open Chrome** and navigate to `chrome://extensions/`
3. **Enable Developer Mode** (toggle in top-right corner)
4. **Click "Load unpacked"** and select the `docx_extension` folder
5. **Pin the extension** to your toolbar for easy access

## 🔧 Configuration

The extension uses a hardcoded Gemini API key for simplicity:

1. **Get your API key** from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. **Open** `docx_extension/background.js`
3. **Replace** the empty `GEMINI_API_KEY` constant with your key:
   ```javascript
   const GEMINI_API_KEY = 'your-api-key-here';
   ```
4. **Reload the extension** in `chrome://extensions/`

## 📖 How to Use

1. **Click** the extension icon in your Chrome toolbar
2. **Upload** a Word document (.docx) by:
   - Dragging and dropping the file onto the upload area
   - Clicking the upload area to browse and select a file
3. **Click** "🔍 Extract Questions" to analyze the document
4. **View** the 5 most important interview questions in a beautiful, numbered list

## 🛠️ Technical Details

- **Manifest Version**: 3 (latest Chrome extension standard)
- **AI Model**: Google Gemini 2.0 Flash
- **File Support**: Microsoft Word documents (.docx)
- **Architecture**: Background service worker + popup UI
- **Storage**: No data stored locally (privacy-focused)

## 📁 File Structure

```
docx_extension/
├── manifest.json          # Extension configuration
├── background.js          # Service worker with AI processing
├── popup.html            # Main UI interface
├── popup.js              # UI logic and file handling
├── options.html          # Settings page
├── options.js            # Settings logic
├── styles.css            # Beautiful styling
├── icons/
│   └── icon.svg          # Extension icon
└── README.md             # This file
```

## 🔒 Privacy & Security

- **No data collection**: The extension doesn't store or transmit your documents
- **Local processing**: File content is processed locally before sending to AI
- **Secure API calls**: All communications with Gemini API use HTTPS
- **No tracking**: No analytics or user tracking implemented

## 🎨 UI Features

- **Dark Theme**: Easy on the eyes with beautiful gradients
- **Responsive Design**: Works perfectly in the Chrome popup
- **Smooth Animations**: Polished user experience
- **Loading States**: Clear feedback during processing
- **Error Handling**: Helpful error messages and recovery

## 🐛 Troubleshooting

**Extension not working?**
- Check that your Gemini API key is correctly set in `background.js`
- Ensure the extension is enabled in `chrome://extensions/`
- Try reloading the extension after making changes

**File upload issues?**
- Make sure your file is a `.docx` format
- Check that the file isn't corrupted or password-protected
- Try with a smaller document first

**API errors?**
- Verify your Gemini API key is valid and has quota remaining
- Check your internet connection
- Ensure the API key has the necessary permissions

## 🤝 Contributing

Feel free to submit issues, feature requests, or pull requests to improve this extension!

## 📄 License

This project is open source and available under the MIT License.

---

**Made with ❤️ for interview preparation**





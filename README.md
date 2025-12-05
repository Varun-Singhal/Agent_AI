# 🎨 AI-Powered Paint Automation Agent

An intelligent agent system that uses **Google Gemini AI** and **Model Context Protocol (MCP)** to automate Microsoft Paint operations and email notifications. The agent interprets natural language commands and executes them through a series of tool calls.

## ✨ Features

- 🤖 **AI-Powered Task Execution**: Uses Gemini 2.0 Flash to interpret and execute natural language commands
- 🎨 **Paint Automation**: Automated interaction with Microsoft Paint through MCP tools
- 📧 **Email Integration**: Send log files and reports via Gmail SMTP
- 🔄 **Persistent Session Management**: Maintains state across multiple tool calls
- 📝 **Comprehensive Logging**: Dual output to console and log file
- 🔧 **Modular Architecture**: Clean separation of concerns with reusable components

## 🏗️ Architecture

```
┌─────────────────┐
│   main.py       │  ← Orchestrator (Gemini AI Agent)
│  (Orchestrator) │
└────────┬────────┘
         │
         ├───► client.py (MCP Client)
         │         │
         │         └───► paint_mcp.py (MCP Server)
         │                    │
         │                    └───► Microsoft Paint
         │
         └───► gmail.py (Email Service)
                   │
                   └───► Gmail SMTP
```

## 📋 Prerequisites

- Python 3.12 or higher
- Windows OS (for Paint automation)
- Google Gemini API key
- Gmail account with App Password enabled

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd assignment
   ```

2. **Install dependencies using uv**
   ```bash
   uv sync
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the project root:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   GMAIL_USER=your_email@gmail.com
   GMAIL_APP_PASSWORD=your_app_password_here
   ```

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Your Google Gemini API key | ✅ Yes |
| `GMAIL_USER` | Your Gmail email address | ✅ Yes |
| `GMAIL_APP_PASSWORD` | Gmail App Password (not regular password) | ✅ Yes |

### Getting Gmail App Password

1. Go to your Google Account settings
2. Enable 2-Step Verification
3. Go to App Passwords
4. Generate a new app password for "Mail"
5. Use this password in your `.env` file

## 📖 Usage

### Running the Agent

```bash
uv run python main.py
```

### Example Query

The agent processes natural language queries like:
```
"Open Paint and fill the canvas with black color and then send 
the log file to my email id 'singhal.varun72@gmail.com'"
```

### Development Mode (MCP Server)

To run the MCP server in development mode:
```bash
uv run mcp dev paint_mcp.py
```

## 📁 Project Structure

```
assignment/
├── main.py              # Main orchestrator with Gemini AI agent
├── client.py            # MCP client with persistent session management
├── paint_mcp.py         # MCP server for Paint automation tools
├── gmail.py             # Email service for sending attachments
├── logger.py            # Logging configuration (console + file)
├── pyproject.toml       # Project dependencies and configuration
├── app.log              # Application logs (generated)
└── README.md           # This file
```

## 🔧 Available Tools

### Paint Tools (MCP)

- **`open_paint()`**: Opens Microsoft Paint maximized on secondary monitor
- **`select_paint_tool()`**: Selects the paint tool in Paint
- **`drop_paint_to_canvas()`**: Drops paint to the canvas at specified coordinates

### Email Tools

- **`send_email_with_attachment(email_id)`**: Sends `app.log` file to the specified email address

## 🧠 How It Works

1. **Query Processing**: The orchestrator (`main.py`) receives a natural language query
2. **Tool Discovery**: Fetches available MCP tools from the server
3. **AI Planning**: Gemini AI analyzes the query and determines the sequence of tool calls
4. **Execution Loop**: 
   - AI generates function call instructions
   - Orchestrator executes the function
   - Results are fed back to AI for next step
   - Process repeats until task completion
5. **State Management**: Persistent MCP session ensures Paint application state is maintained across calls
6. **Logging**: All operations are logged to both console and `app.log` file

## 🛠️ Technologies Used

- **Google Gemini AI** (`google-genai`): Natural language understanding and task planning
- **Model Context Protocol** (`mcp`): Standardized tool interface for AI agents
- **PyWinAuto** (`pywinauto`): Windows application automation
- **Python-dotenv**: Environment variable management
- **SMTP**: Email sending via Gmail

## 📝 Logging

Logs are written to both:
- **Console**: Real-time output during execution
- **app.log**: Persistent log file for debugging and email attachments

Log format: `%(asctime)s - %(name)s - %(levelname)s - %(message)s`

## 🔍 Key Components

### MCPSessionManager (`client.py`)
Manages persistent MCP sessions, ensuring state is maintained across multiple tool calls from different services.

### PaintController (`paint_mcp.py`)
Class-based state management for Paint application instance, ensuring all tools work on the same Paint window.

### Orchestrator (`main.py`)
Main agent loop that:
- Interprets user queries using Gemini AI
- Plans tool execution sequence
- Executes tools iteratively
- Handles errors and timeouts

## 🐛 Troubleshooting

### Paint not opening
- Ensure Paint is available in your Windows system
- Check if secondary monitor is configured (for positioning)

### Email not sending
- Verify Gmail App Password is correct (not regular password)
- Ensure 2-Step Verification is enabled
- Check firewall settings for SMTP port 465

### MCP connection issues
- Ensure `paint_mcp.py` is in the same directory
- Check Python path and dependencies are installed

## 📄 License

This project is part of an assignment/exercise.

## 👤 Author

Varun Singhal

---

**Note**: This project requires Windows OS for Paint automation functionality.


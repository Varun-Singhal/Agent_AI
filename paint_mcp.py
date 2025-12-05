# basic import 
import time
import sys

from mcp.server import fastmcp
from mcp.types import TextContent
from pywinauto.application import Application

import win32gui
import win32con
from win32api import GetSystemMetrics

# Import logger for debug output
from logger import get_logger

# Create logger instance
logger = get_logger("paint_mcp")

# instantiate an MCP server client
mcp = fastmcp.FastMCP("Calculator")

# Paint controller class to manage state
class PaintController:
    def __init__(self):
        self.paint_app = None
    
    def get_paint_window(self):
        """Get the Paint window from the stored paint_app instance"""
        if not self.paint_app:
            return None
        try:
            return self.paint_app.window(class_name='MSPaintApp')
        except Exception:
            return None

# Create a singleton instance
paint_controller = PaintController()

@mcp.tool()
async def select_paint_tool() -> dict:
    """Goes and click on the paint icon"""
    try:
        logger.info("select_paint_tool called")
        logger.debug(f"paint_controller.paint_app: {paint_controller.paint_app}")
        paint_window = paint_controller.get_paint_window()
        if not paint_window:
            logger.warning("Paint window not found")
            return {"content": [TextContent(type="text", text="Paint is not open. Please call open_paint first.")]}
        
        logger.info("Clicking on paint tool icon")
        paint_window.click_input(coords=(300, 82))
        time.sleep(0.2)

        paint_window.set_focus()
        time.sleep(0.2)

        logger.info("Paint tool selected successfully")
        return {"content": [TextContent(type="text", text="Paint selected successfully")]}
    
    except Exception as e:
        logger.error(f"Error selecting paint tool: {str(e)}", exc_info=True)
        return {"content": [TextContent(type="text", text=f"Error selecting paint tool: {str(e)}")]}


@mcp.tool()
async def drop_paint_to_canvas() -> dict:
    """Drops the paint to the canvas"""
    try:
        logger.info("drop_paint_to_canvas called")
        logger.debug(f"paint_controller.paint_app: {paint_controller.paint_app}")
        paint_window = paint_controller.get_paint_window()
        if not paint_window:
            logger.warning("Paint window not found")
            return {
                "content": [
                    TextContent(
                        type="text",
                        text="Paint is not open. Please call open_paint first."
                    )
                ]
            }
        
        # Ensure Paint window is active
        if not paint_window.has_focus():
            paint_window.set_focus()
            time.sleep(0.5)
        
        logger.info("Clicking on canvas")
        paint_window.click_input(coords=(600, 820))
        time.sleep(0.2)
        
        logger.info("Paint dropped to canvas successfully")
        return {
            "content": [
                TextContent(
                    type="text",
                    text="Paint dropped to canvas successfully"
                )
            ]
        }
    except Exception as e:
        logger.error(f"Error dropping paint to canvas: {str(e)}", exc_info=True)
        return {
            "content": [
                TextContent(
                    type="text",
                    text=f"Error: {str(e)}"
                )
            ]
        }

@mcp.tool()
async def open_paint() -> dict:
    """Open Microsoft Paint maximized on secondary monitor"""
    try:
        logger.info("open_paint called")
        logger.debug(f"Current paint_controller.paint_app: {paint_controller.paint_app}")
        # Only start a new Paint instance if one doesn't exist
        if not paint_controller.paint_app:
            logger.info("Starting new Paint application")
            paint_controller.paint_app = Application().start('mspaint.exe')
            time.sleep(0.2)
        else:
            logger.info("Reusing existing Paint application")
        
        # Get the Paint window from the stored instance
        paint_window = paint_controller.paint_app.window(class_name='MSPaintApp')
        logger.debug(f"Paint window handle: {paint_window.handle}")
        
        # Get primary monitor width
        primary_width = GetSystemMetrics(0)
        
        # First move to secondary monitor without specifying size
        win32gui.SetWindowPos(
            paint_window.handle,
            win32con.HWND_TOP,
            primary_width + 1, 0,  # Position it on secondary monitor
            0, 0,  # Let Windows handle the size
            win32con.SWP_NOSIZE  # Don't change the size
        )
        
        # Now maximize the window
        win32gui.ShowWindow(paint_window.handle, win32con.SW_MAXIMIZE)
        time.sleep(0.2)
        
        logger.info("Paint opened successfully")
        return {
            "content": [
                TextContent(
                    type="text",
                    text="Paint opened successfully on secondary monitor and maximized"
                )
            ]
        }
    except Exception as e:
        logger.error(f"Error opening Paint: {str(e)}", exc_info=True)
        return {
            "content": [
                TextContent(
                    type="text",
                    text=f"Error opening Paint: {str(e)}"
                )
            ]
        }

if __name__ == "__main__":
    # Check if running with mcp dev command
    logger.info("STARTING paint_mcp server")
    if len(sys.argv) > 1 and sys.argv[1] == "dev":
        logger.info("Running in dev mode")
        mcp.run()  # Run without transport for dev server
    else:
        logger.info("Running with stdio transport")
        mcp.run(transport="stdio")  # Run with stdio for direct execution

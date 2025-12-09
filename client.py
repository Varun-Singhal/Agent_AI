import asyncio
from typing import Optional

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

from logger import get_logger

logging = get_logger("mcp_client")


class MCPSessionManager:
    """Manages a persistent MCP session that can be reused across multiple calls"""

    def __init__(self):
        self._session: Optional[ClientSession] = None
        self._stdio_client = None
        self._read = None
        self._write = None
        self._lock = asyncio.Lock()
        self._is_closed = False
        self._server_params = StdioServerParameters(
            command="python", args=["paint_mcp.py"]
        )

    async def get_session(self) -> ClientSession:
        """Get or create a persistent session"""
        async with self._lock:
            if self._session is None or self._is_closed:
                logging.info("Creating new MCP session")
                # Cleanup old session if exists
                if self._session is not None:
                    try:
                        await self._session.__aexit__(None, None, None)
                    except Exception:
                        pass

                # Create stdio client
                self._stdio_client = stdio_client(self._server_params)
                self._read, self._write = await self._stdio_client.__aenter__()

                # Create session
                self._session = ClientSession(self._read, self._write)
                await self._session.__aenter__()
                await self._session.initialize()
                self._is_closed = False
                logging.info("MCP session initialized")
            return self._session

    async def close(self):
        """Close the session and cleanup"""
        async with self._lock:
            self._is_closed = True
            if self._session is not None:
                try:
                    await self._session.__aexit__(None, None, None)
                except Exception as e:
                    logging.error(f"Error closing session: {e}")
                self._session = None

            if self._stdio_client is not None:
                try:
                    await self._stdio_client.__aexit__(None, None, None)
                except Exception as e:
                    logging.error(f"Error closing stdio client: {e}")
                self._stdio_client = None
                self._read = None
                self._write = None


# Global session manager instance
_session_manager = MCPSessionManager()


async def get_tools() -> dict:
    """Get available tools from the MCP server"""
    session = await _session_manager.get_session()
    result = await session.list_tools()
    return result.tools


async def call_tool(tool_name: str, arguments: dict = None) -> dict:
    """
    Call a tool using a persistent session.
    Can be called from any service - session is maintained automatically.

    Args:
        tool_name: Name of the tool to call
        arguments: Optional dictionary of arguments for the tool

    Returns:
        Result from the tool call

    Example:
        # Can be called from any service/function
        result = await call_tool("open_paint")
        result = await call_tool("select_paint_tool", arguments={})
    """
    if arguments is None:
        arguments = {}

    logging.debug(f"Client asked to perform {tool_name} with arguments: {arguments}")

    try:
        session = await _session_manager.get_session()
        result = await session.call_tool(tool_name, arguments=arguments)
        logging.info(f"Tool {tool_name} called successfully")
        return result
    except Exception as e:
        logging.error(f"Error calling tool {tool_name}: {e}", exc_info=True)
        # Mark session as closed if there's an error, so it will be recreated next time
        _session_manager._is_closed = True
        raise


async def close_session():
    """Close the persistent session (useful for cleanup)"""
    await _session_manager.close()


async def main():
    """Example usage"""
    try:
        # Call tools - session is automatically maintained
        await call_tool("open_paint")
        await call_tool("select_paint_tool")
        await call_tool("drop_paint_to_canvas")
    finally:
        # Cleanup (optional - session will persist until explicitly closed)
        await close_session()


if __name__ == "__main__":
    asyncio.run(main())

/**
 * MCP Server Configuration
 *
 * Configures and initializes the Model Context Protocol server with
 * tool handlers for Smartlead API operations.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { SmartleadClient } from './smartlead-client.js';
import { ALL_TOOLS, executeTool } from './tools/index.js';

/**
 * Server configuration options
 */
export interface ServerConfig {
  name: string;
  version: string;
}

const DEFAULT_CONFIG: ServerConfig = {
  name: 'smartlead-mcp',
  version: '0.1.0',
};

/**
 * Create and configure the MCP server with all tool handlers
 *
 * @param client - SmartleadClient instance for API operations
 * @param config - Optional server configuration
 * @returns Configured MCP Server instance
 */
export function createServer(
  client: SmartleadClient,
  config: ServerConfig = DEFAULT_CONFIG
): Server {
  const server = new Server(
    {
      name: config.name,
      version: config.version,
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register tool list handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: ALL_TOOLS };
  });

  // Register tool execution handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      return await executeTool(name, client, args);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

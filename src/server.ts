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
      // Categorize and format errors for better debugging
      let errorMessage: string;
      let errorType: string;

      if (error instanceof Error) {
        // Check for Zod validation errors
        if (error.name === 'ZodError') {
          errorType = 'Validation Error';
          errorMessage = `Invalid input: ${error.message}`;
        }
        // Check for API errors (from SmartleadClient)
        else if (error.message.includes('Smartlead API error')) {
          errorType = 'API Error';
          errorMessage = error.message;
        }
        // Check for unknown tool errors
        else if (error.message.includes('Unknown tool')) {
          errorType = 'Tool Error';
          errorMessage = error.message;
        }
        // Generic error
        else {
          errorType = 'Error';
          errorMessage = error.message;
        }
      } else {
        errorType = 'Unknown Error';
        errorMessage = 'An unexpected error occurred';
      }

      // Log error for debugging (excluding sensitive data)
      console.error(`[${errorType}] Tool: ${name} - ${errorMessage}`);

      return {
        content: [
          {
            type: 'text',
            text: `${errorType}: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

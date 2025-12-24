#!/usr/bin/env node

/**
 * Smartlead MCP Server Entry Point
 *
 * Model Context Protocol server that exposes Smartlead API functionality
 * through well-designed tools for campaign management, lead handling,
 * email account management, and analytics.
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SmartleadClient } from './smartlead-client.js';
import { createServer } from './server.js';

/**
 * Initialize and start the MCP server
 */
async function main(): Promise<void> {
  // Validate API key
  const apiKey = process.env.SMARTLEAD_API_KEY;
  if (!apiKey) {
    console.error('Error: SMARTLEAD_API_KEY environment variable is required');
    process.exit(1);
  }

  // Initialize client and server
  const client = new SmartleadClient({ apiKey });
  const server = createServer(client);

  // Connect transport and start
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('Smartlead MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});

# Smartlead MCP Server

A Model Context Protocol (MCP) server that provides AI assistants with access to the Smartlead API for managing email campaigns, leads, email accounts, and analytics.

## Features

This MCP server exposes **28 tools** covering the core Smartlead API functionality:

### Campaign Management (10 tools)
- `create_campaign` - Create a new email campaign
- `get_campaign` - Get campaign details by ID
- `list_campaigns` - List all campaigns
- `update_campaign_schedule` - Update scheduling settings
- `update_campaign_settings` - Update general settings
- `update_campaign_status` - Pause, stop, or start campaigns
- `delete_campaign` - Delete a campaign
- `list_campaign_email_accounts` - List email accounts for a campaign
- `add_campaign_email_accounts` - Add email accounts to a campaign
- `remove_campaign_email_accounts` - Remove email accounts from a campaign

### Lead Management (9 tools)
- `list_campaign_leads` - List leads in a campaign (with pagination)
- `add_leads_to_campaign` - Add up to 100 leads to a campaign
- `pause_lead` - Pause a lead in a campaign
- `resume_lead` - Resume a paused lead
- `delete_lead_from_campaign` - Delete a lead from a campaign
- `unsubscribe_lead_from_campaign` - Unsubscribe lead from specific campaign
- `get_lead_by_email` - Get lead details by email address
- `unsubscribe_lead_globally` - Unsubscribe lead from all campaigns
- `get_lead_campaigns` - Get all campaigns for a lead

### Email Account Management (5 tools)
- `list_email_accounts` - List all email accounts
- `get_email_account` - Get email account details
- `update_warmup_settings` - Configure email warmup settings
- `get_warmup_stats` - Get warmup statistics (last 7 days)
- `reconnect_failed_accounts` - Reconnect failed email accounts

### Analytics (3 tools)
- `get_campaign_statistics` - Get detailed campaign statistics
- `get_campaign_analytics` - Get top-level campaign analytics
- `get_campaign_analytics_by_date` - Get analytics for a date range

## Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Build the project:**
```bash
npm run build
```

3. **Get your Smartlead API key:**
   - Log in to [Smartlead](https://app.smartlead.ai)
   - Navigate to Settings → Integrations
   - Copy your API key

4. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env and add your API key
```

## Configuration

### For Claude Desktop

Add this configuration to your Claude Desktop config file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "smartlead": {
      "command": "node",
      "args": ["/absolute/path/to/smartlead-mcp/build/index.js"],
      "env": {
        "SMARTLEAD_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### For Other MCP Clients

Use the standard MCP server connection with:
- **Command:** `node /path/to/smartlead-mcp/build/index.js`
- **Environment:** `SMARTLEAD_API_KEY=your_api_key_here`

## Usage Examples

Once configured, you can use natural language to interact with Smartlead through your AI assistant:

### Campaign Management
```
"Create a new campaign called 'Q1 Outreach'"
"List all my campaigns"
"Update the campaign schedule to run Monday-Friday 9am-5pm EST"
"Pause campaign 12345"
```

### Lead Management
```
"Add these 5 leads to campaign 12345: [lead data]"
"Show me all leads in campaign 12345"
"Pause lead 67890 in campaign 12345"
"Get all campaigns for the lead with email john@example.com"
```

### Email Accounts
```
"List all my email accounts"
"Get warmup stats for email account 456"
"Enable warmup for email account 456 with 20 emails per day"
```

### Analytics
```
"Get analytics for campaign 12345"
"Show me campaign statistics for campaign 12345 from 2025-01-01 to 2025-01-31"
"Get top-level analytics for campaign 12345"
```

## Development

### Build
```bash
npm run build
```

### Watch mode (for development)
```bash
npm run watch
```

### Project Structure
```
smartlead-mcp/
├── src/
│   ├── index.ts              # Main MCP server entry point
│   ├── smartlead-client.ts   # API client wrapper
│   ├── tools/                # MCP tool implementations
│   │   ├── campaigns.ts      # Campaign management tools
│   │   ├── leads.ts          # Lead management tools
│   │   ├── email-accounts.ts # Email account tools
│   │   └── analytics.ts      # Analytics tools
│   └── types/
│       └── smartlead.ts      # TypeScript type definitions
├── openapi.yaml              # OpenAPI spec reference
├── package.json
├── tsconfig.json
└── README.md
```

## API Reference

This MCP server is built on the Smartlead API. For detailed API documentation, see:
- [Smartlead API Documentation](https://api.smartlead.ai/reference/welcome)
- [Authentication Guide](https://api.smartlead.ai/reference/authentication)

## Security

- **Never commit your API key** to version control
- API keys are passed as query parameters to the Smartlead API (per their API design)
- Store your API key in environment variables only
- The `.env` file is gitignored by default

## Troubleshooting

### API Key Not Found
```
Error: SMARTLEAD_API_KEY environment variable is required
```
**Solution:** Make sure you've set the `SMARTLEAD_API_KEY` environment variable in your MCP client configuration.

### API Errors
The server provides detailed error messages from the Smartlead API. Common issues:
- **401 Unauthorized:** Invalid API key
- **404 Not Found:** Campaign/Lead/Account ID doesn't exist
- **429 Too Many Requests:** Rate limit exceeded (wait and retry)

### Build Errors
```bash
# Clean build directory and rebuild
rm -rf build/
npm run build
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## Support

For Smartlead API issues, contact [Smartlead Support](https://www.smartlead.ai)

For MCP server issues, please open an issue on this repository.


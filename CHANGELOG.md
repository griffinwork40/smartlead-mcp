# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-01-03

### Changed - BREAKING

**All MCP tool responses now return pure JSON instead of human-readable text.**

This is a breaking change for consumers that rely on natural language responses. The change improves programmatic consumption and consistency across all tools.

#### What Changed

**Before (v0.1.x):**
- Data retrieval tools (e.g., `listCampaigns`, `getCampaign`) returned JSON
- Action confirmation tools (e.g., `createCampaign`, `updateCampaignStatus`) returned formatted text:
  - `"Campaign created successfully!\n\nID: 123\nName: My Campaign"`
  - `"Campaign status updated to PAUSED successfully!"`
  - `"Successfully added 3 email accounts to campaign 456."`

**After (v0.2.0):**
- ALL tools now return pure JSON responses:
  - `{"id": 123, "name": "My Campaign", "created_at": "2025-01-01"}`
  - `{"ok": true}`
  - `{"email_account_ids": [1, 2, 3]}`

#### Why This Change

- **Consistency**: All responses now follow the same format
- **Programmatic Use**: JSON is easier to parse and process than formatted text
- **AI Assistants**: MCP servers are designed for AI consumption, which works better with structured data
- **Type Safety**: JSON responses preserve type information (booleans, numbers, etc.)

#### Migration Guide

If you were parsing the response text for human-readable messages:

```typescript
// ❌ Old code (will break):
const result = await createCampaign(client, { name: "Test" });
if (result.content[0].text.includes("successfully")) {
  console.log("Campaign created!");
}

// ✅ New code:
const result = await createCampaign(client, { name: "Test" });
const data = JSON.parse(result.content[0].text);
if (data.id) {
  console.log(`Campaign created with ID: ${data.id}`);
}
```

For action confirmation responses:

```typescript
// ❌ Old code (will break):
const result = await updateCampaignStatus(client, { campaign_id: 123, status: "PAUSED" });
if (result.content[0].text.includes("Failed")) {
  console.error("Update failed");
}

// ✅ New code:
const result = await updateCampaignStatus(client, { campaign_id: 123, status: "PAUSED" });
const data = JSON.parse(result.content[0].text);
if (!data.ok) {
  console.error("Update failed");
}
```

#### Affected Functions

**campaigns.ts:**
- `createCampaign` - Now returns full campaign object instead of summary message
- `updateCampaignSchedule` - Now returns `{ok: boolean}` instead of success/failure message
- `updateCampaignSettings` - Now returns `{ok: boolean}` instead of success/failure message
- `updateCampaignStatus` - Now returns `{ok: boolean}` instead of success/failure message
- `deleteCampaign` - Now returns `{ok: boolean}` instead of success/failure message
- `addCampaignEmailAccounts` - Now returns full response object instead of summary message
- `removeCampaignEmailAccounts` - Now returns full response object instead of summary message
- `saveCampaignSequences` - Now returns `{ok: boolean}` instead of success/failure message

**leads.ts:**
- `addLeadsToCampaign` - Now returns full upload stats object instead of formatted summary
- `pauseLead` - Now returns `{ok: boolean, data: string}` instead of success/failure message
- `resumeLead` - Now returns `{ok: boolean, data: string}` instead of success/failure message
- `deleteLeadFromCampaign` - Now returns `{ok: boolean}` instead of success/failure message
- `unsubscribeLeadFromCampaign` - Now returns `{ok: boolean}` instead of success/failure message
- `unsubscribeLeadGlobally` - Now returns `{ok: boolean}` instead of success/failure message

**email-accounts.ts:**
- `updateWarmupSettings` - Now returns full response object instead of summary message
- `reconnectFailedAccounts` - Now returns pure JSON instead of prefixed message

### Fixed

- JSON parsing errors in downstream consumers due to text prefixes like "Found N campaigns:"
- Inconsistent response formats across different tool types
- Type information loss in responses (e.g., booleans converted to strings)

## [0.1.1] - 2025-01-01

### Added
- Initial release of SmartLead MCP server
- Campaign management tools
- Lead management tools
- Email account management tools
- Analytics tools
- Full TypeScript support
- Comprehensive test coverage

[0.2.0]: https://github.com/griffinwork40/smartlead-mcp/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/griffinwork40/smartlead-mcp/releases/tag/v0.1.1

# Google Analytics Dashboard

AI-powered Google Analytics dashboard with natural language queries using Claude.

## Features

- **Overview Cards**: Users, Sessions, Bounce Rate, Pageviews with period comparison
- **Traffic Chart**: Interactive area chart with date range picker
- **Top Pages Table**: Most visited pages with time on page
- **Traffic Sources**: Acquisition data showing visitor origins
- **Anomaly Alerts**: Statistical anomaly detection for traffic spikes/drops
- **AI Chat Panel**: Natural language queries about your analytics data

## Prerequisites

### 1. Google Cloud Setup

1. Create/select a project at [Google Cloud Console](https://console.cloud.google.com/)
2. Enable APIs:
   - Google Analytics Admin API
   - Google Analytics Data API
3. Create service account:
   - Go to IAM & Admin → Service Accounts
   - Create account named `analytics-mcp`
   - Grant **Viewer** role
   - Create JSON key, save as `~/.config/gcloud/ga-credentials.json`

### 2. Google Analytics Access

1. Go to [Google Analytics Admin](https://analytics.google.com/)
2. Admin → Property → Property Access Management
3. Add service account email with **Viewer** role

### 3. Environment Variables

Copy `.env.local.example` to `.env.local` and configure:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
GOOGLE_APPLICATION_CREDENTIALS=/Users/eugene/.config/gcloud/ga-credentials.json
GA_PROPERTY_ID=properties/YOUR_PROPERTY_ID
ANTHROPIC_API_KEY=your_anthropic_api_key
```

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## MCP Server Setup (Optional)

For Claude Code integration, the MCP server is configured in `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "analytics-mcp": {
      "command": "pipx",
      "args": ["run", "analytics-mcp"],
      "env": {
        "GOOGLE_APPLICATION_CREDENTIALS": "/Users/eugene/.config/gcloud/ga-credentials.json",
        "GOOGLE_PROJECT_ID": "YOUR_PROJECT_ID"
      }
    }
  }
}
```

Install the MCP server:
```bash
pipx install analytics-mcp
```

## API Endpoints

- `GET /api/analytics?action=dashboard` - Full dashboard data
- `GET /api/analytics?action=metrics` - Daily metrics
- `GET /api/analytics?action=aggregated` - Totals for period
- `GET /api/analytics?action=topPages` - Top pages
- `GET /api/analytics?action=trafficSources` - Traffic sources
- `GET /api/analytics?action=anomalies` - Anomaly detection
- `POST /api/analytics/chat` - AI chat endpoint

## AI Agent Tools

The AI agent has access to these functions:
- `get_metrics` - Fetch KPIs for date range
- `get_aggregated_metrics` - Fetch totals
- `get_top_pages` - Top content
- `get_traffic_sources` - Acquisition data
- `compare_periods` - Period comparison
- `detect_anomalies` - Anomaly detection

## Tech Stack

- Next.js 16
- TypeScript
- Tailwind CSS
- Recharts
- Google Analytics Data API
- Anthropic Claude API

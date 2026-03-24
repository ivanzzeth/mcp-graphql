# @ivanzzeth/mcp-graphql

Enhanced fork of [mcp-graphql](https://github.com/blurrah/mcp-graphql) with multi-endpoint support and LLM context optimization.

## What's New (v3.0.0)

- **Multi-endpoint**: Single MCP instance connects to multiple GraphQL APIs
- **Schema summary**: Compact summaries instead of full SDL in LLM context
- **Response offloading**: Large responses written to file, summary returned inline
- **CSV export**: Query results as CSV for data analysis
- **Pagination**: Application-level `max_rows` truncation

## Quick Start

### Single endpoint (backward compatible)

```json
{
  "mcpServers": {
    "graphql": {
      "command": "npx",
      "args": ["@ivanzzeth/mcp-graphql"],
      "env": {
        "ENDPOINT": "http://localhost:3000/graphql"
      }
    }
  }
}
```

### Multi-endpoint (new)

Create `mcp-graphql.config.json`:

```json
{
  "endpoints": [
    {
      "name": "orders",
      "url": "https://api.example.com/orders/graphql",
      "headers": { "Authorization": "Bearer xxx" }
    },
    {
      "name": "users",
      "url": "https://api.example.com/users/graphql"
    }
  ],
  "responseSizeThreshold": 2048,
  "outputDir": "~/.mcp-graphql/output/",
  "defaultEndpoint": "orders"
}
```

```json
{
  "mcpServers": {
    "graphql": {
      "command": "npx",
      "args": ["@ivanzzeth/mcp-graphql"],
      "env": {
        "MCP_GRAPHQL_CONFIG": "/path/to/mcp-graphql.config.json"
      }
    }
  }
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ENDPOINT` | GraphQL endpoint URL (single-endpoint mode) | `http://localhost:4000/graphql` |
| `HEADERS` | JSON string of request headers | `{}` |
| `ALLOW_MUTATIONS` | Enable mutation operations | `false` |
| `NAME` | MCP server name | `mcp-graphql` |
| `SCHEMA` | Path/URL to schema file (skip introspection) | - |
| `MCP_GRAPHQL_CONFIG` | Path to multi-endpoint config file | - |
| `RESPONSE_SIZE_THRESHOLD` | Bytes before offloading to file | `2048` |
| `MCP_GRAPHQL_OUTPUT_DIR` | Directory for output files | `/tmp/mcp-graphql/` |

## Tools

### introspect-schema

Introspect the GraphQL schema with context-aware detail levels.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `endpoint` | string | default | Endpoint name to introspect |
| `detail` | `summary` \| `full` \| `types` | `summary` | Detail level |
| `types` | string[] | - | Type names (when `detail=types`) |

**Summary mode** (default) returns compact markdown with type/field counts and root query fields. Full SDL is always written to file for reference.

### query-graphql

Execute GraphQL queries with export and pagination support.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `query` | string | required | GraphQL query |
| `variables` | string | - | JSON variables |
| `endpoint` | string | default | Endpoint name |
| `output_format` | `json` \| `csv` | `json` | Output format |
| `max_rows` | number | - | Truncate results |

Large JSON responses are automatically written to file with an inline summary. CSV output is always written to file.

## Config File Format

```jsonc
{
  "endpoints": [
    {
      "name": "my-api",           // Endpoint identifier
      "url": "https://...",       // GraphQL URL (required)
      "headers": {},              // Request headers
      "allowMutations": false,    // Enable mutations
      "schema": "./schema.graphql" // Optional local/remote schema
    }
  ],
  "responseSizeThreshold": 2048,  // Bytes before file offload
  "outputDir": "/tmp/mcp-graphql/", // Output directory
  "defaultEndpoint": "my-api"     // Default endpoint name
}
```

## Security

Mutations are disabled by default per-endpoint. Enable with `"allowMutations": true` in endpoint config or `ALLOW_MUTATIONS=true` env var.

## License

MIT

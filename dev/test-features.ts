/**
 * Integration test using MCP SDK client.
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function runTests() {
	console.log("=== Starting MCP client tests ===\n");

	const transport = new StdioClientTransport({
		command: "bun",
		args: ["run", "./src/index.ts"],
		env: {
			...process.env,
			MCP_GRAPHQL_CONFIG: "./test-config.json",
		},
	});

	const client = new Client({
		name: "test-client",
		version: "1.0.0",
	});

	await client.connect(transport);
	console.log("Connected to server\n");

	// Test 1: List tools
	console.log("--- Test 1: List Tools ---");
	const tools = await client.listTools();
	for (const t of tools.tools) {
		console.log(`  - ${t.name}`);
		// Print input schema keys
		const props = (t.inputSchema as any)?.properties ?? {};
		console.log(`    params: ${Object.keys(props).join(", ")}`);
	}

	// Test 2: Introspect schema (summary, default)
	console.log("\n--- Test 2: Introspect Schema (summary, default) ---");
	const summary = await client.callTool({
		name: "introspect-schema",
		arguments: { detail: "summary" },
	});
	const summaryText = (summary.content as any)[0]?.text ?? "";
	console.log(summaryText.substring(0, 600));
	console.log(summaryText.length > 600 ? "\n...(truncated)" : "");

	// Test 3: Introspect schema (summary, specific endpoint)
	console.log("\n--- Test 3: Introspect Schema (summary, polymarket-activity) ---");
	const actSummary = await client.callTool({
		name: "introspect-schema",
		arguments: { detail: "summary", endpoint: "polymarket-activity" },
	});
	const actText = (actSummary.content as any)[0]?.text ?? "";
	console.log(actText.substring(0, 400));

	// Test 4: Introspect schema (types mode)
	console.log("\n--- Test 4: Introspect Schema (types: OrderFilledEvent) ---");
	const typeDetail = await client.callTool({
		name: "introspect-schema",
		arguments: { detail: "types", types: ["OrderFilledEvent", "MarketData"] },
	});
	console.log((typeDetail.content as any)[0]?.text?.substring(0, 500) ?? "");

	// Test 5: Introspect schema (full mode - should write to file)
	console.log("\n--- Test 5: Introspect Schema (full mode) ---");
	const fullSchema = await client.callTool({
		name: "introspect-schema",
		arguments: { detail: "full" },
	});
	console.log((fullSchema.content as any)[0]?.text ?? "");

	// Test 6: Query small result (inline JSON)
	console.log("\n--- Test 6: Query small (expect inline JSON) ---");
	const smallQ = await client.callTool({
		name: "query-graphql",
		arguments: {
			query: "{ orderFilledEvents(first: 2) { id timestamp maker } }",
		},
	});
	const smallText = (smallQ.content as any)[0]?.text ?? "";
	console.log(smallText.substring(0, 400));

	// Test 7: Query large result (expect file offload)
	console.log("\n--- Test 7: Query large (expect file offload) ---");
	const largeQ = await client.callTool({
		name: "query-graphql",
		arguments: {
			query: "{ orderFilledEvents(first: 100) { id timestamp orderHash maker taker makerAssetId takerAssetId makerAmountFilled takerAmountFilled fee } }",
		},
	});
	console.log((largeQ.content as any)[0]?.text?.substring(0, 600) ?? "");

	// Test 8: Query with max_rows
	console.log("\n--- Test 8: Query with max_rows=3 ---");
	const pagQ = await client.callTool({
		name: "query-graphql",
		arguments: {
			query: "{ orderFilledEvents(first: 50) { id timestamp maker taker fee } }",
			max_rows: 3,
		},
	});
	console.log((pagQ.content as any)[0]?.text?.substring(0, 500) ?? "");

	// Test 9: CSV export
	console.log("\n--- Test 9: CSV export ---");
	const csvQ = await client.callTool({
		name: "query-graphql",
		arguments: {
			query: "{ orderFilledEvents(first: 10) { id timestamp maker taker makerAmountFilled takerAmountFilled } }",
			output_format: "csv",
		},
	});
	console.log((csvQ.content as any)[0]?.text ?? "");

	// Test 10: Query different endpoint (polymarket-activity)
	console.log("\n--- Test 10: Query polymarket-activity ---");
	const actQ = await client.callTool({
		name: "query-graphql",
		arguments: {
			query: "{ splits(first: 2) { id timestamp } }",
			endpoint: "polymarket-activity",
		},
	});
	console.log((actQ.content as any)[0]?.text?.substring(0, 300) ?? "");

	// Test 11: Invalid endpoint
	console.log("\n--- Test 11: Invalid endpoint ---");
	const badQ = await client.callTool({
		name: "query-graphql",
		arguments: {
			query: "{ orders { id } }",
			endpoint: "nonexistent",
		},
	});
	console.log((badQ.content as any)[0]?.text ?? "");
	console.log("isError:", (badQ as any).isError);

	// Test 12: types mode without types param
	console.log("\n--- Test 12: types mode without types param ---");
	const noTypes = await client.callTool({
		name: "introspect-schema",
		arguments: { detail: "types" },
	});
	console.log((noTypes.content as any)[0]?.text ?? "");
	console.log("isError:", (noTypes as any).isError);

	console.log("\n=== All tests completed ===");
	await client.close();
	process.exit(0);
}

runTests().catch((err) => {
	console.error("Fatal:", err);
	process.exit(1);
});

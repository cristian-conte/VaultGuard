export function parseTerraform(fileContent: string): any {
    console.log('VaultGuard: Parsing Terraform content...');
    const resources: any = {};
    const lines = fileContent.split('\n');

    // Simple line-by-line parser to find resources and their line numbers
    // This is a temporary fallback until hcl2-parser issues are resolved
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        // Match: resource "type" "name" {
        const resourceMatch = line.match(/^resource\s+"([^"]+)"\s+"([^"]+)"\s+{/);

        if (resourceMatch) {
            const type = resourceMatch[1];
            const name = resourceMatch[2];
            console.log(`VaultGuard: Found resource ${type}.${name} at line ${i + 1}`);

            if (!resources[type]) {
                resources[type] = {};
            }

            // Parse body until closing brace (simplified)
            const resourceConfig: any = {
                __line: i + 1 // Store 1-indexed line number
            };

            let j = i + 1;
            while (j < lines.length && !lines[j].trim().startsWith('}')) {
                const propLine = lines[j].trim();
                const propMatch = propLine.match(/^([a-z_]+)\s*=\s*"([^"]+)"/);
                if (propMatch) {
                    resourceConfig[propMatch[1]] = propMatch[2];
                }
                j++;
            }

            resources[type][name] = resourceConfig;
        }
    }

    const result = { resource: resources };
    console.log('VaultGuard: Parse result:', JSON.stringify(result));
    return result;
}

const fs = require('fs');
const path = require('path');

function parseTerraform(fileContent) {
    console.log('Parsing content...');
    const resources = {};

    // Regex to match resource blocks: resource "type" "name" { ... }
    const resourceRegex = /resource\s+"([^"]+)"\s+"([^"]+)"\s+{([^}]+)}/g;
    let match;

    while ((match = resourceRegex.exec(fileContent)) !== null) {
        const type = match[1];
        const name = match[2];
        const body = match[3];
        console.log(`Found resource ${type}.${name}`);

        if (!resources[type]) {
            resources[type] = {};
        }

        const resourceConfig = {};

        // Regex to match properties: key = "value"
        const propertyRegex = /([a-z_]+)\s*=\s*"([^"]+)"/g;
        let propMatch;
        while ((propMatch = propertyRegex.exec(body)) !== null) {
            resourceConfig[propMatch[1]] = propMatch[2];
        }

        resources[type][name] = resourceConfig;
    }

    return { resource: resources };
}

const filePath = path.join(__dirname, 'violation.tf');
const content = fs.readFileSync(filePath, 'utf-8');
console.log('File content:', content);
const parsed = parseTerraform(content);
console.log('Parsed result:', JSON.stringify(parsed, null, 2));

const ALLOWED_REGIONS = [
    'ca-central-1', // AWS
    'canadaeast', 'canadacentral', // Azure
    'northamerica-northeast1', 'northamerica-northeast2' // GCP
];

function validate(parsed) {
    const violations = [];
    if (!parsed || !parsed.resource) return violations;

    for (const resourceType in parsed.resource) {
        const resources = parsed.resource[resourceType];
        for (const resourceName in resources) {
            const resourceConfig = resources[resourceName];
            const region = resourceConfig.region || resourceConfig.location;
            console.log(`Checking ${resourceName}: region=${region}`);

            if (region) {
                if (!ALLOWED_REGIONS.includes(region)) {
                    violations.push({
                        message: `OSFI B-10 Violation: Data must reside in Canada. Found region: '${region}'.`,
                        resourceName: resourceName
                    });
                }
            }
        }
    }
    return violations;
}

const violations = validate(parsed);
console.log('Violations:', violations);

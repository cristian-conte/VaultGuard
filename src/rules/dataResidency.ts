export interface Violation {
    message: string;
    resourceName: string;
    line?: number;
}

const ALLOWED_REGIONS = [
    'ca-central-1', // AWS
    'canadaeast', 'canadacentral', // Azure
    'northamerica-northeast1', 'northamerica-northeast2' // GCP
];

export function validateDataResidency(parsed: any): Violation[] {
    const violations: Violation[] = [];

    if (!parsed || !parsed.resource) {
        return violations;
    }

    // Iterate through resource types (e.g., aws_s3_bucket)
    for (const resourceType in parsed.resource) {
        const resources = parsed.resource[resourceType];

        // Iterate through resource names
        for (const resourceName in resources) {
            const resourceConfig = resources[resourceName];

            // Check for region or location
            const region = resourceConfig.region || resourceConfig.location;

            if (region) {
                // If region is a variable reference (e.g. "${var.region}"), we might skip or warn.
                // For now, we check literal strings.
                if (!ALLOWED_REGIONS.includes(region)) {
                    violations.push({
                        message: `OSFI B-10 Violation: Data must reside in Canada. Found region: '${region}'.`,
                        resourceName: resourceName,
                        line: resourceConfig.__line
                    });
                }
            }
        }
    }

    return violations;
}

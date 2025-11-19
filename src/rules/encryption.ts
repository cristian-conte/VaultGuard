import { Violation } from './dataResidency';

export function validateEncryption(parsed: any): Violation[] {
    const violations: Violation[] = [];

    if (!parsed || !parsed.resource) {
        return violations;
    }

    for (const resourceType in parsed.resource) {
        const resources = parsed.resource[resourceType];
        for (const resourceName in resources) {
            const resourceConfig = resources[resourceName];
            const line = resourceConfig.__line;

            // Check 1 (Azure): azurerm_storage_account MUST have min_tls_version = "TLS1_2"
            if (resourceType === 'azurerm_storage_account') {
                if (resourceConfig.min_tls_version !== 'TLS1_2') {
                    violations.push({
                        message: `OSFI B-13 Violation: Azure Storage Account must use TLS 1.2. Found: '${resourceConfig.min_tls_version || 'default'}'.`,
                        resourceName: resourceName,
                        line: line
                    });
                }
                if (resourceConfig.enable_https_traffic_only === 'false') {
                    violations.push({
                        message: `OSFI B-13 Violation: Azure Storage Account must enforce HTTPS.`,
                        resourceName: resourceName,
                        line: line
                    });
                }
            }

            // Check 2 (AWS): aws_db_instance MUST have storage_encrypted = true
            if (resourceType === 'aws_db_instance') {
                if (resourceConfig.storage_encrypted !== 'true') {
                    violations.push({
                        message: `OSFI B-13 Violation: AWS DB Instance must be encrypted.`,
                        resourceName: resourceName,
                        line: line
                    });
                }
            }

            // Check 3 (AWS): aws_s3_bucket should have server_side_encryption_configuration (simplified check)
            // Note: In HCL, this is often a block, which our simple regex parser might miss or parse as a string if complex.
            // For this phase, we'll check if the key exists if it's a flat property, or if we can detect the block.
            // Given the simple parser, this might be limited. We'll skip complex block checks for now or rely on future parser improvements.

            // Check 4 (General): Weak algorithms
            for (const key in resourceConfig) {
                if (typeof resourceConfig[key] === 'string') {
                    const val = resourceConfig[key].toLowerCase();
                    if (val === 'md5' || val === 'sha1') {
                        violations.push({
                            message: `OSFI B-13 Warning: Weak cryptographic algorithm detected ('${val}'). Use SHA-256 or higher.`,
                            resourceName: resourceName,
                            line: line
                        });
                    }
                }
            }
        }
    }

    return violations;
}

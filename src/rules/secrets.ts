import { Violation } from './dataResidency';

export function validateSecrets(parsed: any): Violation[] {
    const violations: Violation[] = [];

    if (!parsed || !parsed.resource) {
        return violations;
    }

    // Regex for suspicious keys
    const secretKeyRegex = /(password|secret|key|token|auth|credential)/i;
    // Regex for high-entropy strings (simplified: long alphanumeric strings)
    // This is a heuristic and can have false positives.
    const highEntropyRegex = /^[A-Za-z0-9+/=]{20,}$/;

    for (const resourceType in parsed.resource) {
        const resources = parsed.resource[resourceType];
        for (const resourceName in resources) {
            const resourceConfig = resources[resourceName];
            const line = resourceConfig.__line;

            for (const key in resourceConfig) {
                if (key === '__line') continue;

                if (secretKeyRegex.test(key)) {
                    const value = resourceConfig[key];
                    if (typeof value === 'string') {
                        // Check if it looks like a hardcoded string (not a variable reference)
                        if (!value.startsWith('${') && highEntropyRegex.test(value)) {
                            violations.push({
                                message: `OSFI B-13 Violation: Secrets management required. Hardcoded secret detected in '${key}'.`,
                                resourceName: resourceName,
                                line: line // Ideally we'd have exact line for the property, but resource line is close enough for now
                            });
                        }
                    }
                }
            }
        }
    }

    return violations;
}

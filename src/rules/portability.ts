import { Violation } from './dataResidency';

const PORTABILITY_RULES: { [key: string]: string } = {
    'aws_lambda_function': 'OSFI B-10 Warning: Concentration Risk - Consider using a portable container (EKS/ECS) instead of proprietary Lambda functions.',
    'azurerm_function_app': 'OSFI B-10 Warning: Concentration Risk - Consider using AKS or Containers instead of proprietary Azure Functions.',
    'google_cloudfunctions_function': 'OSFI B-10 Warning: Concentration Risk - Consider using GKE or Cloud Run (portable mode) instead of proprietary Cloud Functions.'
};

export function validatePortability(parsed: any): Violation[] {
    const violations: Violation[] = [];

    if (!parsed || !parsed.resource) {
        return violations;
    }

    for (const resourceType in parsed.resource) {
        if (PORTABILITY_RULES[resourceType]) {
            const resources = parsed.resource[resourceType];
            for (const resourceName in resources) {
                const resourceConfig = resources[resourceName];
                const line = resourceConfig.__line;

                violations.push({
                    message: PORTABILITY_RULES[resourceType],
                    resourceName: resourceName,
                    line: line
                });
            }
        }
    }

    return violations;
}

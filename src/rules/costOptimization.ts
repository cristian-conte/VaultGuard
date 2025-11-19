import { Violation } from './dataResidency';

// Common over-provisioned instance types (simplified)
const OVERSIZED_INSTANCES: { [key: string]: string } = {
    't3.2xlarge': 't3.xlarge',
    't3.xlarge': 't3.large',
    'm5.4xlarge': 'm5.2xlarge',
    'm5.2xlarge': 'm5.xlarge',
    'r5.4xlarge': 'r5.2xlarge',
};

// Expensive resources that often get over-provisioned
const EXPENSIVE_RESOURCES = [
    'aws_nat_gateway',
    'aws_db_instance',
    'azurerm_application_gateway',
    'google_compute_address',
];

export function validateCostOptimization(parsed: any): Violation[] {
    const violations: Violation[] = [];

    if (!parsed || !parsed.resource) {
        return violations;
    }

    for (const resourceType in parsed.resource) {
        const resources = parsed.resource[resourceType];

        for (const resourceName in resources) {
            const resourceConfig = resources[resourceName];
            const line = resourceConfig.__line;

            // Check 1: Over-provisioned instances
            if (resourceType === 'aws_instance' || resourceType === 'azurerm_virtual_machine') {
                const instanceType = resourceConfig.instance_type || resourceConfig.vm_size;
                if (instanceType && OVERSIZED_INSTANCES[instanceType]) {
                    violations.push({
                        message: `OSFI B-13 Warning: Over-provisioned instance detected. Consider downgrading from '${instanceType}' to '${OVERSIZED_INSTANCES[instanceType]}' to reduce costs.`,
                        resourceName: resourceName,
                        line: line
                    });
                }
            }

            // Check 2: NAT Gateway cost warning
            if (resourceType === 'aws_nat_gateway') {
                violations.push({
                    message: `OSFI B-13 Warning: NAT Gateway incurs high data transfer costs (~$0.045/GB). Consider using NAT instances for dev/test environments.`,
                    resourceName: resourceName,
                    line: line
                });
            }

            // Check 3: RDS instance without storage autoscaling
            if (resourceType === 'aws_db_instance') {
                if (!resourceConfig.max_allocated_storage) {
                    violations.push({
                        message: `OSFI B-13 Warning: Database without storage autoscaling. Enable 'max_allocated_storage' to prevent over-provisioning.`,
                        resourceName: resourceName,
                        line: line
                    });
                }
                // Check for expensive instance classes
                const instanceClass = resourceConfig.instance_class;
                if (instanceClass && instanceClass.includes('db.r5')) {
                    violations.push({
                        message: `OSFI B-13 Warning: Memory-optimized DB instance (${instanceClass}) is expensive. Consider db.m5 or db.t3 for cost savings if memory isn't critical.`,
                        resourceName: resourceName,
                        line: line
                    });
                }
            }

            // Check 4: Elastic IP without association
            if (resourceType === 'aws_eip') {
                if (!resourceConfig.instance && !resourceConfig.network_interface) {
                    violations.push({
                        message: `OSFI B-13 Warning: Unattached Elastic IP incurs charges (~$0.005/hour). Ensure it's associated with an instance or release it.`,
                        resourceName: resourceName,
                        line: line
                    });
                }
            }

            // Check 5: Load balancers (expensive for low traffic)
            if (resourceType === 'aws_lb' || resourceType === 'aws_alb') {
                violations.push({
                    message: `OSFI B-13 Warning: Application Load Balancer costs ~$16-20/month minimum. Consider using NLB or CloudFront for cost optimization.`,
                    resourceName: resourceName,
                    line: line
                });
            }
        }
    }

    return violations;
}

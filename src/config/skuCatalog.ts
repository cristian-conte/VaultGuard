// Common SKU catalog for cloud providers
export const SKU_CATALOG = {
    AWS: {
        compute: [
            't3.nano', 't3.micro', 't3.small', 't3.medium', 't3.large', 't3.xlarge', 't3.2xlarge',
            'm5.large', 'm5.xlarge', 'm5.2xlarge', 'm5.4xlarge', 'm5.8xlarge',
            'r5.large', 'r5.xlarge', 'r5.2xlarge', 'r5.4xlarge', 'r5.8xlarge',
            'c5.large', 'c5.xlarge', 'c5.2xlarge', 'c5.4xlarge'
        ],
        database: [
            'db.t3.micro', 'db.t3.small', 'db.t3.medium', 'db.t3.large',
            'db.m5.large', 'db.m5.xlarge', 'db.m5.2xlarge',
            'db.r5.large', 'db.r5.xlarge', 'db.r5.2xlarge'
        ]
    },
    Azure: {
        compute: [
            'Standard_B1s', 'Standard_B2s', 'Standard_B4ms',
            'Standard_D2s_v3', 'Standard_D4s_v3', 'Standard_D8s_v3',
            'Standard_E2s_v3', 'Standard_E4s_v3', 'Standard_E8s_v3'
        ]
    },
    GCP: {
        compute: [
            'n1-standard-1', 'n1-standard-2', 'n1-standard-4', 'n1-standard-8',
            'n2-standard-2', 'n2-standard-4', 'n2-standard-8',
            'e2-micro', 'e2-small', 'e2-medium', 'e2-standard-2', 'e2-standard-4'
        ]
    }
};

export function getAllSKUs(): string[] {
    const allSKUs: string[] = [];
    for (const provider in SKU_CATALOG) {
        const categories = (SKU_CATALOG as any)[provider];
        for (const category in categories) {
            allSKUs.push(...categories[category]);
        }
    }
    return allSKUs;
}

export function getSKUsByProvider(provider: 'AWS' | 'Azure' | 'GCP'): string[] {
    const skus: string[] = [];
    const categories = SKU_CATALOG[provider];
    for (const category in categories) {
        skus.push(...(categories as any)[category]);
    }
    return skus;
}

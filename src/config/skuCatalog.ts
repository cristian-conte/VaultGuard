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
        ],
        storage: [
            's3.standard', 's3.intelligent-tiering', 's3.standard-ia', 
            's3.onezone-ia', 's3.glacier-instant', 's3.glacier-flexible',
            's3.glacier-deep', 'ebs.gp3', 'ebs.gp2', 'ebs.io2', 'ebs.st1', 'ebs.sc1'
        ]
    },
    Azure: {
        compute: [
            'Standard_B1s', 'Standard_B2s', 'Standard_B4ms',
            'Standard_D2s_v3', 'Standard_D4s_v3', 'Standard_D8s_v3',
            'Standard_E2s_v3', 'Standard_E4s_v3', 'Standard_E8s_v3'
        ],
        database: [
            'Basic', 'S0', 'S1', 'S2', 'S3', 'S4', 'S6', 'S7', 'S9', 'S12',
            'P1', 'P2', 'P4', 'P6', 'P11', 'P15',
            'GP_Gen5_2', 'GP_Gen5_4', 'GP_Gen5_8', 'GP_Gen5_16'
        ],
        storage: [
            'hot-blob', 'cool-blob', 'archive-blob',
            'premium-block-blob', 'premium-page-blob', 'premium-file',
            'standard-lrs', 'standard-grs', 'standard-ragrs', 'premium-lrs'
        ]
    },
    GCP: {
        compute: [
            'n1-standard-1', 'n1-standard-2', 'n1-standard-4', 'n1-standard-8',
            'n2-standard-2', 'n2-standard-4', 'n2-standard-8',
            'e2-micro', 'e2-small', 'e2-medium', 'e2-standard-2', 'e2-standard-4'
        ],
        database: [
            'db-f1-micro', 'db-g1-small',
            'db-n1-standard-1', 'db-n1-standard-2', 'db-n1-standard-4', 'db-n1-standard-8',
            'db-n1-highmem-2', 'db-n1-highmem-4', 'db-n1-highmem-8',
            'db-custom-1-3840', 'db-custom-2-7680', 'db-custom-4-15360'
        ],
        storage: [
            'standard-storage', 'nearline-storage', 'coldline-storage', 'archive-storage',
            'regional-storage', 'multi-regional-storage',
            'pd-standard', 'pd-balanced', 'pd-ssd', 'pd-extreme'
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

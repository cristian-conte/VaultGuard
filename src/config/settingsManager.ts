import * as vscode from 'vscode';

export interface VaultGuardSettings {
    rules: {
        dataResidency: { enabled: boolean };
        secrets: { enabled: boolean };
        encryption: { enabled: boolean };
        portability: { enabled: boolean };
        costOptimization: { enabled: boolean };
    };
    skus: {
        allowlist: string[];
        blocklist: string[];
    };
    costThreshold: number;
}

export class SettingsManager {
    private static instance: SettingsManager;
    private _onDidChangeSettings: vscode.EventEmitter<VaultGuardSettings> = new vscode.EventEmitter<VaultGuardSettings>();
    readonly onDidChangeSettings: vscode.Event<VaultGuardSettings> = this._onDidChangeSettings.event;

    private constructor() {
        // Watch for configuration changes
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('vaultguard')) {
                this._onDidChangeSettings.fire(this.getSettings());
            }
        });
    }

    static getInstance(): SettingsManager {
        if (!SettingsManager.instance) {
            SettingsManager.instance = new SettingsManager();
        }
        return SettingsManager.instance;
    }

    getSettings(): VaultGuardSettings {
        const config = vscode.workspace.getConfiguration('vaultguard');
        return {
            rules: {
                dataResidency: {
                    enabled: config.get('rules.dataResidency.enabled', true)
                },
                secrets: {
                    enabled: config.get('rules.secrets.enabled', true)
                },
                encryption: {
                    enabled: config.get('rules.encryption.enabled', true)
                },
                portability: {
                    enabled: config.get('rules.portability.enabled', true)
                },
                costOptimization: {
                    enabled: config.get('rules.costOptimization.enabled', true)
                }
            },
            skus: {
                allowlist: config.get('skus.allowlist', []),
                blocklist: config.get('skus.blocklist', ['t3.2xlarge', 'm5.4xlarge', 'r5.4xlarge'])
            },
            costThreshold: config.get('costThreshold', 100)
        };
    }

    async updateSetting(key: string, value: any, global: boolean = false): Promise<void> {
        const config = vscode.workspace.getConfiguration('vaultguard');
        await config.update(key, value, global ? vscode.ConfigurationTarget.Global : vscode.ConfigurationTarget.Workspace);
    }

    isRuleEnabled(ruleName: string): boolean {
        const settings = this.getSettings();
        const rule = (settings.rules as any)[ruleName];
        return rule ? rule.enabled : true;
    }

    isSKUAllowed(sku: string): boolean {
        const { allowlist, blocklist } = this.getSettings().skus;
        
        // If allowlist is populated, only those SKUs are allowed
        if (allowlist.length > 0) {
            return allowlist.includes(sku);
        }
        
        // Otherwise, check if SKU is in blocklist
        return !blocklist.includes(sku);
    }
}

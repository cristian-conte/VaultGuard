import * as vscode from 'vscode';
import { SettingsManager } from '../config/settingsManager';
import { SKU_CATALOG } from '../config/skuCatalog';

export class ConfigurationViewProvider implements vscode.TreeDataProvider<ConfigItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ConfigItem | undefined | null | void> = new vscode.EventEmitter<ConfigItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<ConfigItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private settingsManager: SettingsManager;

    constructor() {
        this.settingsManager = SettingsManager.getInstance();
        
        // Refresh view when settings change
        this.settingsManager.onDidChangeSettings(() => {
            this.refresh();
        });
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: ConfigItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: ConfigItem): Thenable<ConfigItem[]> {
        if (!element) {
            // Root level
            return Promise.resolve([
                new ConfigItem('Rules', 'rules', vscode.TreeItemCollapsibleState.Collapsed),
                new ConfigItem('SKU Management', 'skus', vscode.TreeItemCollapsibleState.Collapsed),
                new ConfigItem('SKU Catalog', 'sku-catalog', vscode.TreeItemCollapsibleState.Collapsed)
            ]);
        }

        if (element.contextValue === 'rules') {
            return Promise.resolve(this.getRuleItems());
        }

        if (element.contextValue === 'skus') {
            return Promise.resolve(this.getSKUItems());
        }

        if (element.contextValue === 'blocklist') {
            const { blocklist } = this.settingsManager.getSettings().skus;
            return Promise.resolve(blocklist.map(sku => 
                new SKUItem(sku, 'blocked-sku')
            ));
        }

        if (element.contextValue === 'allowlist') {
            const { allowlist } = this.settingsManager.getSettings().skus;
            return Promise.resolve(allowlist.map(sku => 
                new SKUItem(sku, 'allowed-sku')
            ));
        }

        // SKU Catalog navigation
        if (element.contextValue === 'sku-catalog') {
            return Promise.resolve([
                new ConfigItem('AWS', 'provider-aws', vscode.TreeItemCollapsibleState.Collapsed),
                new ConfigItem('Azure', 'provider-azure', vscode.TreeItemCollapsibleState.Collapsed),
                new ConfigItem('GCP', 'provider-gcp', vscode.TreeItemCollapsibleState.Collapsed)
            ]);
        }

        // Cloud provider SKU listings
        if (element.contextValue?.startsWith('provider-')) {
            const provider = element.label as 'AWS' | 'Azure' | 'GCP';
            return Promise.resolve(this.getProviderSKUs(provider));
        }

        // Category listings (compute, database, etc.)
        if (element.contextValue?.startsWith('category-')) {
            const [_, provider, category] = element.contextValue.split('-');
            const catalog = SKU_CATALOG[provider as 'AWS' | 'Azure' | 'GCP'];
            const skus = (catalog as any)[category] as string[];
            const blocklist = this.settingsManager.getSettings().skus.blocklist;
            return Promise.resolve(skus.map(sku => 
                new CatalogSKUItem(sku, provider, blocklist.includes(sku))
            ));
        }

        return Promise.resolve([]);
    }

    private getRuleItems(): ConfigItem[] {
        const settings = this.settingsManager.getSettings();
        return [
            new RuleItem('Data Residency (OSFI B-10)', 'dataResidency', settings.rules.dataResidency.enabled),
            new RuleItem('Secrets Detection (OSFI B-13)', 'secrets', settings.rules.secrets.enabled),
            new RuleItem('Encryption (OSFI B-13)', 'encryption', settings.rules.encryption.enabled),
            new RuleItem('Portability (OSFI B-10)', 'portability', settings.rules.portability.enabled),
            new RuleItem('Cost Optimization', 'costOptimization', settings.rules.costOptimization.enabled)
        ];
    }

    private getSKUItems(): ConfigItem[] {
        const { blocklist, allowlist } = this.settingsManager.getSettings().skus;
        const items: ConfigItem[] = [];

        if (allowlist.length > 0) {
            const allowlistItem = new ConfigItem('Allowed SKUs', 'allowlist', vscode.TreeItemCollapsibleState.Collapsed);
            items.push(allowlistItem);
        }

        if (blocklist.length > 0) {
            const blocklistItem = new ConfigItem('Blocked SKUs', 'blocklist', vscode.TreeItemCollapsibleState.Collapsed);
            items.push(blocklistItem);
        }

        items.push(new ConfigItem('Add to Blocklist...', 'add-sku', vscode.TreeItemCollapsibleState.None));

        return items;
    }

    private getProviderSKUs(provider: 'AWS' | 'Azure' | 'GCP'): ConfigItem[] {
        const catalog = SKU_CATALOG[provider];
        const items: ConfigItem[] = [];
        
        for (const category in catalog) {
            const count = (catalog as any)[category].length;
            const categoryItem = new ConfigItem(
                `${category} (${count})`,
                `category-${provider}-${category}`,
                vscode.TreeItemCollapsibleState.Collapsed
            );
            categoryItem.iconPath = new vscode.ThemeIcon('folder');
            items.push(categoryItem);
        }
        
        return items;
    }
}

class ConfigItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly contextValue: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
        this.contextValue = contextValue;
    }
}

class RuleItem extends ConfigItem {
    constructor(
        label: string,
        ruleName: string,
        enabled: boolean
    ) {
         super(
            label,
            `rule-${ruleName}`,
            vscode.TreeItemCollapsibleState.None,
            {
                command: 'vaultguard.toggleRule',
                title: 'Toggle Rule',
                arguments: [ruleName]
            }
        );
        this.iconPath = new vscode.ThemeIcon(enabled ? 'check' : 'x');
        this.description = enabled ? 'Enabled' : 'Disabled';
    }
}

class SKUItem extends ConfigItem {
    constructor(
        sku: string,
        type: 'blocked-sku' | 'allowed-sku'
    ) {
        super(sku, type, vscode.TreeItemCollapsibleState.None);
        this.iconPath = new vscode.ThemeIcon(type === 'blocked-sku' ? 'error' : 'pass');
    }
}

class CatalogSKUItem extends ConfigItem {
    constructor(
        sku: string,
        provider: string,
        isBlocked: boolean
    ) {
        const contextValue = isBlocked ? 'catalog-sku-blocked' : 'catalog-sku-available';
        super(sku, contextValue, vscode.TreeItemCollapsibleState.None);
        this.description = isBlocked ? '🚫 Blocked' : '';
        this.iconPath = new vscode.ThemeIcon(isBlocked ? 'error' : 'cloud');
        this.tooltip = `${provider} SKU: ${sku}`;
    }
}

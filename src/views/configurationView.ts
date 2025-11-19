import * as vscode from 'vscode';
import { SettingsManager } from '../config/settingsManager';

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
                new ConfigItem('SKU Management', 'skus', vscode.TreeItemCollapsibleState.Collapsed)
            ]);
        }

        if (element.contextValue === 'rules') {
            return Promise.resolve(this.getRuleItems());
        }

        if (element.contextValue === 'skus') {
            return Promise.resolve(this.getSKUItems());
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
            blocklistItem.description = blocklist.join(', ');
            items.push(blocklistItem);
        }

        items.push(new ConfigItem('Add to Blocklist...', 'add-sku', vscode.TreeItemCollapsibleState.None));

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

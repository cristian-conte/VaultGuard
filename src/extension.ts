import * as vscode from 'vscode';
import { scanContent } from './scanner';
import { RegionFixProvider } from './fixes/regionFix';
import { scanAndCommit } from './commands/scanAndCommit';
import { generateComplianceReport } from './commands/generateComplianceReport';
import { ConfigurationViewProvider } from './views/configurationView';
import { SettingsManager } from './config/settingsManager';
import { SKU_CATALOG, getAllSKUs } from './config/skuCatalog';

export function activate(context: vscode.ExtensionContext) {
    console.log('VaultGuard is now active!');

    const diagnosticCollection = vscode.languages.createDiagnosticCollection('vaultguard');
    context.subscriptions.push(diagnosticCollection);

    // Initialize Settings Manager
    const settingsManager = SettingsManager.getInstance();

    // Register Configuration View
    const configView = new ConfigurationViewProvider();
    context.subscriptions.push(
        vscode.window.registerTreeDataProvider('vaultguard.configuration', configView)
    );

    // Register Commands
    context.subscriptions.push(
        vscode.commands.registerCommand('vaultguard.scanAndCommit', scanAndCommit)
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('vaultguard.generateComplianceReport', generateComplianceReport)
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('vaultguard.toggleRule', async (ruleName: string) => {
            const settings = settingsManager.getSettings();
            const currentValue = (settings.rules as any)[ruleName]?.enabled ?? true;
            await settingsManager.updateSetting(`rules.${ruleName}.enabled`, !currentValue);
            vscode.window.showInformationMessage(`${ruleName} rule ${!currentValue ? 'enabled' : 'disabled'}`);
            configView.refresh();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('vaultguard.addSKUToBlocklist', async () => {
            // Step 1: Select cloud provider
            const provider = await vscode.window.showQuickPick(
                ['AWS', 'Azure', 'GCP', 'Custom (enter manually)'],
                { placeHolder: 'Select cloud provider' }
            );
            
            if (!provider) { return; }
            
            let sku: string | undefined;
            
            if (provider === 'Custom (enter manually)') {
                sku = await vscode.window.showInputBox({
                    prompt: 'Enter SKU to block',
                    placeHolder: 't3.2xlarge'
                });
            } else {
                // Step 2: Select SKU from provider catalog
                const providerKey = provider as 'AWS' | 'Azure' | 'GCP';
                const catalog = SKU_CATALOG[providerKey];
                const skusByCategory: { label: string, sku: string }[] = [];
                
                for (const category in catalog) {
                    const skus = (catalog as any)[category] as string[];
                    skus.forEach(s => {
                        skusByCategory.push({
                            label: `${s} (${category})`,
                            sku: s
                        });
                    });
                }
                
                const selected = await vscode.window.showQuickPick(
                    skusByCategory.map(item => item.label),
                    { placeHolder: `Select ${provider} SKU to block` }
                );
                
                if (selected) {
                    sku = skusByCategory.find(item => item.label === selected)?.sku;
                }
            }
            
            if (sku) {
                const settings = settingsManager.getSettings();
                if (settings.skus.blocklist.includes(sku)) {
                    vscode.window.showWarningMessage(`${sku} is already in the blocklist`);
                    return;
                }
                const blocklist = [...settings.skus.blocklist, sku];
                await settingsManager.updateSetting('skus.blocklist', blocklist);
                vscode.window.showInformationMessage(`Added ${sku} to blocklist`);
                configView.refresh();
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('vaultguard.removeSKUFromBlocklist', async (item: any) => {
            const sku = item.label;
            const settings = settingsManager.getSettings();
            const blocklist = settings.skus.blocklist.filter(s => s !== sku);
            await settingsManager.updateSetting('skus.blocklist', blocklist);
            vscode.window.showInformationMessage(`Removed ${sku} from blocklist`);
            configView.refresh();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('vaultguard.addCatalogSKUToBlocklist', async (item: any) => {
            const sku = item.label;
            const settings = settingsManager.getSettings();
            if (settings.skus.blocklist.includes(sku)) {
                vscode.window.showWarningMessage(`${sku} is already in the blocklist`);
                return;
            }
            const blocklist = [...settings.skus.blocklist, sku];
            await settingsManager.updateSetting('skus.blocklist', blocklist);
            vscode.window.showInformationMessage(`Added ${sku} to blocklist`);
            configView.refresh();
        })
    );

    // Register Quick Fix Provider
    context.subscriptions.push(
        vscode.languages.registerCodeActionsProvider('terraform', new RegionFixProvider(), {
            providedCodeActionKinds: RegionFixProvider.providedCodeActionKinds
        })
    );

    // Also scan on open
    vscode.workspace.onDidOpenTextDocument(document => {
        if (document.languageId === 'terraform' || document.fileName.endsWith('.tf')) {
            runScan(document, diagnosticCollection);
        }
    });

    // Scan on save
    vscode.workspace.onDidSaveTextDocument(document => {
        if (document.languageId === 'terraform' || document.fileName.endsWith('.tf')) {
            runScan(document, diagnosticCollection);
        }
    });

    // Initial scan for all open terraform files
    vscode.workspace.textDocuments.forEach(document => {
        if (document.languageId === 'terraform' || document.fileName.endsWith('.tf')) {
            runScan(document, diagnosticCollection);
        }
    });
}

function runScan(document: vscode.TextDocument, collection: vscode.DiagnosticCollection) {
    console.log(`VaultGuard: Scanning ${document.fileName}`);
    const diagnostics: vscode.Diagnostic[] = [];
    const fileContent = document.getText();

    try {
        const violations = scanContent(fileContent);
        console.log(`VaultGuard: Found ${violations.length} violations`);

        for (const violation of violations) {
            // Use line number from parser if available, else default to line 0
            const line = violation.line ? violation.line - 1 : 0;
            const range = new vscode.Range(line, 0, line, 100);
            const diagnostic = new vscode.Diagnostic(range, violation.message, vscode.DiagnosticSeverity.Error);
            diagnostic.source = 'VaultGuard';
            diagnostics.push(diagnostic);
        }
    } catch (e) {
        console.error('Error parsing Terraform:', e);
    }

    collection.set(document.uri, diagnostics);
}

export function deactivate() { }

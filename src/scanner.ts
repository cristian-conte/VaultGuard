import * as vscode from 'vscode';
import { parseTerraform } from './parser/terraform';
import { validateDataResidency, Violation } from './rules/dataResidency';
import { validateSecrets } from './rules/secrets';
import { validateEncryption } from './rules/encryption';
import { validatePortability } from './rules/portability';
import { validateCostOptimization } from './rules/costOptimization';
import { SettingsManager } from './config/settingsManager';

export function scanContent(content: string): Violation[] {
    const settingsManager = SettingsManager.getInstance();
    
    try {
        const parsed = parseTerraform(content);
        let violations: Violation[] = [];
        
        // Only run enabled rules
        if (settingsManager.isRuleEnabled('dataResidency')) {
            violations = violations.concat(validateDataResidency(parsed));
        }
        if (settingsManager.isRuleEnabled('secrets')) {
            violations = violations.concat(validateSecrets(parsed));
        }
        if (settingsManager.isRuleEnabled('encryption')) {
            violations = violations.concat(validateEncryption(parsed));
        }
        if (settingsManager.isRuleEnabled('portability')) {
            violations = violations.concat(validatePortability(parsed));
        }
        if (settingsManager.isRuleEnabled('costOptimization')) {
            violations = violations.concat(validateCostOptimization(parsed));
        }
        
        return violations;
    } catch (e) {
        console.error('Error parsing Terraform:', e);
        return [];
    }
}

export async function scanWorkspace(): Promise<{ file: string, violations: Violation[] }[]> {
    const files = await vscode.workspace.findFiles('**/*.tf', '**/node_modules/**');
    const results: { file: string, violations: Violation[] }[] = [];

    for (const file of files) {
        const document = await vscode.workspace.openTextDocument(file);
        const violations = scanContent(document.getText());
        if (violations.length > 0) {
            results.push({
                file: vscode.workspace.asRelativePath(file),
                violations: violations
            });
        }
    }

    return results;
}

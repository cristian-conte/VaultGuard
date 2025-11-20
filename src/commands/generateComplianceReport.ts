import * as vscode from 'vscode';
import { scanWorkspace } from '../scanner';

export async function generateComplianceReport() {
    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Generating Compliance Report...",
        cancellable: false
    }, async (progress) => {
        try {
            const results = await scanWorkspace();

            if (results.length === 0) {
                vscode.window.showInformationMessage('No compliance violations found in the workspace.');
                return;
            }

            let report = '# VaultGuard Compliance Report\n\n';
            report += `**Generated:** ${new Date().toLocaleString()}\n\n`;
            report += `**Total Files with Violations:** ${results.length}\n\n`;
            report += '---\n\n';

            for (const result of results) {
                report += `## File: ${result.file}\n\n`;
                report += `**Violations:** ${result.violations.length}\n\n`;
                
                report += '| Severity | Message | Line |\n';
                report += '| :--- | :--- | :--- |\n';

                for (const violation of result.violations) {
                    // Default to "Error" severity for now as per existing logic, 
                    // but could be enhanced if Violation has severity
                    const severity = '🔴 Error'; 
                    const line = violation.line ? violation.line : 'N/A';
                    report += `| ${severity} | ${violation.message} | ${line} |\n`;
                }
                report += '\n---\n\n';
            }

            const document = await vscode.workspace.openTextDocument({
                content: report,
                language: 'markdown'
            });

            await vscode.window.showTextDocument(document);

        } catch (error) {
            console.error('Error generating compliance report:', error);
            vscode.window.showErrorMessage('Failed to generate compliance report.');
        }
    });
}

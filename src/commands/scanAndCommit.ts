import * as vscode from 'vscode';
import { scanWorkspace } from '../scanner';

export async function scanAndCommit() {
    const results = await scanWorkspace();
    const totalViolations = results.reduce((acc, r) => acc + r.violations.length, 0);

    if (totalViolations === 0) {
        vscode.window.showInformationMessage('VaultGuard: No violations found. You are good to commit!');
        return;
    }

    const message = `VaultGuard Scan Summary:\n` +
        results.map(r => `${r.file}: ${r.violations.length} violations`).join('\n') +
        `\n\nTotal Violations: ${totalViolations}`;

    const choice = await vscode.window.showWarningMessage(
        `VaultGuard found ${totalViolations} violations.`,
        'View Summary',
        'Populate Commit Message'
    );

    if (choice === 'View Summary') {
        const doc = await vscode.workspace.openTextDocument({
            content: message,
            language: 'markdown'
        });
        await vscode.window.showTextDocument(doc);
    } else if (choice === 'Populate Commit Message') {
        const gitExtension = vscode.extensions.getExtension('vscode.git');
        if (gitExtension) {
            const git = gitExtension.exports.getAPI(1);
            const repo = git.repositories[0]; // Assuming single repo for now
            if (repo) {
                // Append to existing message if any
                const currentMessage = repo.inputBox.value;
                repo.inputBox.value = currentMessage ? `${currentMessage}\n\n${message}` : message;
                vscode.commands.executeCommand('workbench.view.scm');
            } else {
                vscode.window.showErrorMessage('No Git repository found.');
            }
        } else {
            vscode.window.showErrorMessage('Git extension not found.');
        }
    }
}

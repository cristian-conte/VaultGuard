import * as vscode from 'vscode';
import { scanContent } from './scanner';
import { RegionFixProvider } from './fixes/regionFix';
import { scanAndCommit } from './commands/scanAndCommit';

export function activate(context: vscode.ExtensionContext) {
    console.log('VaultGuard is now active!');

    const diagnosticCollection = vscode.languages.createDiagnosticCollection('vaultguard');
    context.subscriptions.push(diagnosticCollection);

    // Register Commands
    context.subscriptions.push(
        vscode.commands.registerCommand('vaultguard.scanAndCommit', scanAndCommit)
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

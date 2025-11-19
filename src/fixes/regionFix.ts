import * as vscode from 'vscode';

export class RegionFixProvider implements vscode.CodeActionProvider {

    public static readonly providedCodeActionKinds = [
        vscode.CodeActionKind.QuickFix
    ];

    provideCodeActions(document: vscode.TextDocument, range: vscode.Range | vscode.Selection, context: vscode.CodeActionContext, token: vscode.CancellationToken): vscode.CodeAction[] {
        return context.diagnostics
            .filter(diagnostic => diagnostic.source === 'VaultGuard' && diagnostic.message.includes('OSFI B-10 Violation'))
            .map(diagnostic => this.createFix(document, diagnostic));
    }

    private createFix(document: vscode.TextDocument, diagnostic: vscode.Diagnostic): vscode.CodeAction {
        const fix = new vscode.CodeAction('Migrate to Canada Central', vscode.CodeActionKind.QuickFix);
        fix.diagnostics = [diagnostic];
        fix.isPreferred = true;

        // Determine the correct region based on context (naive approach: check if it looks like AWS or Azure)
        // Ideally, we would parse the resource type from the line, but for now we'll guess or use a generic one.
        // Let's look at the text in the range.
        const lineText = document.lineAt(diagnostic.range.start.line).text;
        let replacement = 'ca-central-1'; // Default AWS

        if (lineText.includes('canada') || lineText.includes('us-') || lineText.includes('eu-')) {
            // If it looks like AWS format (us-east-1), use ca-central-1
            if (lineText.match(/[a-z]{2}-[a-z]+-\d/)) {
                replacement = 'ca-central-1';
            } else {
                // Assume Azure/GCP format
                replacement = 'canadacentral';
            }
        }

        // We need to find the exact range of the region string to replace.
        // The diagnostic range is the whole line. We need to narrow it down to the value.
        const regex = /"([^"]+)"/;
        const match = lineText.match(regex);
        // This is tricky without precise location from parser.
        // We'll just replace the first string found on the line if it matches the violation region.
        // But wait, the diagnostic doesn't carry the violated region string explicitly in metadata.
        // We can extract it from the message: "Found region: 'us-east-1'".

        const messageMatch = diagnostic.message.match(/Found region: '([^']+)'/);
        if (messageMatch) {
            const badRegion = messageMatch[1];
            const index = lineText.indexOf(badRegion);
            if (index !== -1) {
                const startPos = new vscode.Position(diagnostic.range.start.line, index);
                const endPos = new vscode.Position(diagnostic.range.start.line, index + badRegion.length);
                fix.edit = new vscode.WorkspaceEdit();
                fix.edit.replace(document.uri, new vscode.Range(startPos, endPos), replacement);
            }
        }

        return fix;
    }
}

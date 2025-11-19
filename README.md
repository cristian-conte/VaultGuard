# VaultGuard

VaultGuard is a "Shift-Left" Compliance Auditor for Canadian Banking Developers. It helps enforce OSFI B-13, B-10, and PIPEDA compliance directly within VS Code.

## Features

- **Real-time Scanning**: Detects compliance violations in Terraform files as you type.
- **OSFI B-13**: Checks for encryption enforcement and hardcoded secrets.
- **OSFI B-10**: Warns about concentration risk and data residency.
- **Quick Fixes**: Automatically fix common issues like invalid regions.
- **Commit Check**: Scans your workspace and populates the commit message with a violation summary.

## Usage

1. Open a Terraform file (`.tf`).
2. VaultGuard will automatically scan for violations.
3. Use the "VaultGuard: Scan & Populate Commit" command before committing.

## Development

1. Run `npm install` to install dependencies.
2. Run `npm run compile` to build the extension.
3. Press `F5` to start debugging.

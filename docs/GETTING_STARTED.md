# Getting Started

Welcome to Project Structure Generator (`structgen`)!

## Quick Start Guide

### 1. Execute without installation via npx

```bash
npx @naresh007/project-structure-generator create python-fastapi-native ./my-service \
  --set projectName=my-service \
  --interactive=false
```

### 2. Global Installation

```bash
npm install --global @naresh007/project-structure-generator
```

Verify installation:
```bash
structgen doctor
```

### 3. Interactive vs Non-Interactive Modes

- **Interactive Mode**: Run `structgen create` in a TTY terminal to use the step-by-step wizard.
- **Non-Interactive Mode**: Pass `--interactive=false` and supply variables via `--set key=value`.

### 4. Interactive Terminal Manual Smoke Test Instructions

To verify interactive terminal behavior locally:
1. Open a terminal (bash/zsh/PowerShell).
2. Run `structgen create`.
3. Choose **Quick Templates** or **Build as You Go**.
4. Select target project type, language, framework, and base blueprint.
5. Select maturity level (`prototype`, `standard`, `operational`).
6. Select capability packs (e.g. `docker`, `postgres`).
7. Review the generation summary and confirm creation.

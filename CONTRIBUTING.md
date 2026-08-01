# Contributing

## Setup

```bash
nvm use
npm install
npm run typecheck
npm test
```

## Change rules

- preserve zero runtime dependencies unless a dependency removes substantial, proven complexity
- keep blueprint content language-specific and engine logic language-neutral
- reject unsafe filesystem behavior by default
- add tests for every engine or vault behavior change
- do not add arbitrary command hooks
- update the JSON Schema and blueprint documentation together
- keep CLI output deterministic in non-interactive mode

## Adding a built-in blueprint

1. Create `presets/builtin/<id>/blueprint.json`.
2. Put source files inside the same blueprint directory.
3. Run `structgen validate` against the directory.
4. Add an integration test if the preset exercises new engine behavior.
5. Document it in the README.

## Pull request expectations

A pull request should explain the user problem, the chosen boundary, compatibility impact, security impact, and tests performed.

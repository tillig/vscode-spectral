# Spectral for VS Code - Building

## Tools

- [VS Code](https://code.visualstudio.com/)
- [Node.js](https://nodejs.org/)
- VSCE - `npm install -g vsce`

## Developing

There are suggested extensions for the workspace, check those out By going to the Extensions pane in VS Code and looking at `@recommended` extensions.

The top-level build script `make.js` uses [the `shelljs/make` utility](https://github.com/shelljs/shelljs/wiki/The-make-utility) to build, test, and package at the top level. This runs through Node.

```powershell
# Just checked out, restore packages!
npm install

# Do a full clean, compile, test cycle.
node make.js all

# Clean - you'll need to npm install after this.
node make.js clean

# Prune packages for production and generate the VSIX in the artifacts folder.
node make.js package

# Publish the extension to the marketplace.
node make.js publish -- <pat>

# List all the targets to see what you can do.
node make.js --help
```

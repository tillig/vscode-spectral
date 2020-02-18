# Spectral for VS Code - Building

## Tools

- [VS Code](https://code.visualstudio.com/)
- [Node.js](https://nodejs.org/)
- VSCE - `npm install -g vsce`

## Developing

There are suggested extensions for the workspace, check those out By going to the Extensions pane in VS Code and looking at `@recommended` extensions.

## Packaging

You can test the packaging with Webpack.

```powershell
npm run webpack
```

During the Webpack process you may see this warning while bundling the server module:

```text
WARNING in ./node_modules/@stoplight/spectral/dist/rulesets/finder.js 12:15-35
Critical dependency: the request of a dependency is an expression
 @ ./node_modules/@stoplight/spectral/dist/rulesets/reader.js
 @ ./src/server.ts
```

**If the error is in `finder.js`** it's OK. That particular script has a mechanism for resolving rulesets from NPM directly. It doesn't affect the package.

**If the error is not in `finder.js`** then [it needs to be addressed.](https://code.visualstudio.com/api/working-with-extensions/bundling-extension#webpack-critical-dependencies)

When it's time to actually package it for real...

```powershell
vsce package
```

...will generate the `.vsix` file for the extension.

[Publishing instructions are here.](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)

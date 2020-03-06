/* global mkdir, target */
'use strict';

require('shelljs/make');
const fs = require('fs').promises;
const path = require('path');
const ncp = require('child_process');

/** Build output paths. */
const outputPath = {
  artifacts: path.join(__dirname, 'artifacts'),
  log: path.join(__dirname, 'artifacts', 'log'),
};

target.all = () => {
  banner('Target: All');
  target.clean();
  target.compile();
  target.test();
};

target.clean = () => {
  banner('Target: Clean');
  run('npm run clean');
};

target.compile = () => {
  banner('Target: Compile');
  run('npm install');
  run('npm run lint');
  run('npm run compile');
};

target.package = async () => {
  banner('Target: Package');
  run('npm install');

  // Prune the non-essentials
  run('npm run prepare:vsce');

  try {
    await fs.access(outputPath.artifacts);
  } catch (err) {
    mkdir(outputPath.artifacts);
  }
  run(`vsce package -o ${outputPath.artifacts}`);

  // Put it back so the dev environment works again :)
  run('npm install');
};

target.publish = async (args) => {
  if (!args || !args.length || args.length !== 1) {
    console.log('node make.js publish -- yourpublishtoken');
    return;
  }

  const token = args[0].trim();
  const vsixFiles = (await fs.readdir(outputPath.artifacts, { withFileTypes: true }))
    .filter((f) => !f.isDirectory())
    .filter((f) => f.name.endsWith('.vsix'));
  if (!vsixFiles || !vsixFiles.length) {
    console.log('No .vsix found in the artifacts folder.');
    return;
  }

  // https://code.visualstudio.com/api/working-with-extensions/publishing-extension
  run(`vsce publish --packagePath ${path.join(outputPath.artifacts, vsixFiles[0].name)} -p ${token}`);
};

target.test = () => {
  banner('Target: Test');
  run('npm test');
};

/**
 * Writes a visible banner with top/bottom bars for build logging.
 * @param {string} message - The message to display.
 */
function banner(message) {
  console.log();
  console.log('------------------------------------------------------------');
  console.log(message);
  console.log('------------------------------------------------------------');
}

/**
 * Executes a command in a child process.
 * @param {string} cl - The command line to execute.
 * @param {boolean} capture - True to capture and return the output; false to simply echo to console.
 * @return {string|undefined} The output from the command.
 */
function run(cl, capture = false) {
  console.log();
  console.log('> ' + cl);

  let output;
  try {
    // Exec needs to be synchronous or tasks continue on without waiting for the
    // external process to finish. It gets weird.
    const options = {
      stdio: capture ? 'pipe' : 'inherit',
    };
    output = ncp.execSync(cl, options);
  } catch (err) {
    console.error(err.output ? err.output.toString() : err.message);
    process.exit(1);
  }

  return (output || '').toString().trim();
}

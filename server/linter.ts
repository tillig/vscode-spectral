import { TextDocument } from 'vscode-languageserver-textdocument';
import {
  IRuleResult,
  Spectral,
} from '@stoplight/spectral';
import { parseYaml } from '@stoplight/spectral/dist/parsers';
import { IParsedResult } from '@stoplight/spectral/dist/document';
import { IRuleset } from '@stoplight/spectral/dist/types/ruleset';
import { getLocationForJsonPath } from '@stoplight/yaml';
import { refResolver } from './resolver';
import { registerFormats } from './formats';

/**
 * Wrapper for the Spectral linter that runs linting against VS Code document
 * content in a manner similar to the Spectral CLI.
 */
export class Linter {
  private spectral = new Spectral({ resolver: refResolver });

  /**
   * Initializes a new instance of the linter.
   */
  constructor() {
    registerFormats(this.spectral);
  }

  /**
   * Executes Spectral linting against a VS Code document.
   * @param {TextDocument} document - The document to lint/validate.
   * @param {IRuleset|undefined} ruleset - The ruleset to use during validation, if any.
   * @return {Promise<IRuleResult[]>} The set of rule violations found. If no violations are found, this will be empty.
   */
  public async lint(document: TextDocument, ruleset: IRuleset | undefined): Promise<IRuleResult[]> {
    // Unclear if we may have issues changing the ruleset on the shared Spectral
    // instance here. If so, we may need to store a Spectral instance per
    // document rather than using a single shared one via Linter.
    if (ruleset) {
      this.spectral.setRuleset(ruleset);
    } else {
      // No ruleset, so clear everything out.
      this.spectral.setRuleset({
        functions: {},
        rules: {},
        exceptions: {},
      });
    }

    // It's unclear why JSON and YAML both get parsed as YAML, but that's how Spectral does it, sooooooo...
    const text = document.getText();
    const spec = parseYaml(text);
    const parsedResult: IParsedResult = {
      source: document.uri,
      parsed: spec,
      getLocationForJsonPath,
    };

    return this.spectral.run(parsedResult, { ignoreUnknownFormat: true, resolve: { documentUri: document.uri } });
  }
}

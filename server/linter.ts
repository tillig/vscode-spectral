import { TextDocument } from 'vscode-languageserver-textdocument';
import {
  FormatLookup,
  IRuleResult,
  Spectral,
  isJSONSchema,
  isJSONSchemaDraft2019_09, // eslint-disable-line
  isJSONSchemaDraft4,
  isJSONSchemaDraft6,
  isJSONSchemaDraft7,
  isJSONSchemaLoose,
  isOpenApiv2,
  isOpenApiv3,
} from '@stoplight/spectral';
import { parseYaml } from '@stoplight/spectral/dist/parsers';
import { IParsedResult } from '@stoplight/spectral/dist/document';
import { IRuleset } from '@stoplight/spectral/dist/types/ruleset';
import { getLocationForJsonPath } from '@stoplight/yaml';

/**
 * Mapping of format ID to detector function that can determine if a given
 * document is of that type.
 */
const allFormats: Array<[string, FormatLookup]> = [
  ['oas2', isOpenApiv2],
  ['oas3', isOpenApiv3],
  ['json-schema', isJSONSchema],
  ['json-schema-loose', isJSONSchemaLoose],
  ['json-schema-draft4', isJSONSchemaDraft4],
  ['json-schema-draft6', isJSONSchemaDraft6],
  ['json-schema-draft7', isJSONSchemaDraft7],
  ['json-schema-2019-09', isJSONSchemaDraft2019_09] // eslint-disable-line
];

/**
 * Wrapper for the Spectral linter that runs linting against VS Code document
 * content in a manner similar to the Spectral CLI.
 */
export class Linter {
  private spectral = new Spectral();

  /**
   * Initializes a new instance of the linter.
   */
  constructor() {
    for (const [format, lookup] of allFormats) {
      // Each document type that Spectral can lint gets registered with detectors.
      this.spectral.registerFormat(format, (document) => lookup(document));
    }
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

import { describe, expect, it } from "bun:test";
import { dictionaries, translateText } from "../apps/www/src/i18n/text";
import { flatten, lookup } from "../shared/i18n/lookup";
import { apiCopy } from "../shared/i18n/api-copy";
import { uiCopy } from "../shared/i18n/ui-copy";
import { getLocaleFromHeaders, localizeResponse } from "../src/i18n";
import ts from "typescript";
import { readdirSync, readFileSync } from "node:fs";
function files(dir: string): string[] { return readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? files(`${dir}/${e.name}`) : /\.tsx?$/.test(e.name) ? [`${dir}/${e.name}`] : []); }

describe("Language contracts", () => {
  it("keeps semantic keys and arrays available in every language", () => {
    for (const [key] of flatten(dictionaries.pt)) for (const locale of ['en','es','jp'] as const) expect(typeof lookup(dictionaries[locale], key)).toBe('string');
    for (const locale of ['pt','en','es','jp'] as const) expect(lookup(dictionaries[locale], 'loading.loadingTexts')).toBeInstanceOf(Array);
  });
  it("has complete translated legacy and API catalogs", () => {
    for (const values of Object.values(uiCopy)) { expect(values).toHaveLength(3); for (const text of values) expect(text.length).toBeGreaterThan(0); }
    for (const values of Object.values(apiCopy)) { expect(values).toHaveLength(4); for (const text of values) expect(text.length).toBeGreaterThan(0); }
  });
  it("interpolates without treating parameters as regular expressions", () => {
    expect(translateText('battle.reward','jp',{coins:50,xp:5})).toContain('50');
    expect(translateText('common.requestConflict','es')).not.toContain('common.');
  });
  it("uses correct request headers and default locale", () => {
    expect(getLocaleFromHeaders({'X-Locale':'jp','Accept-Language':'en-US'})).toBe('jp');
    expect(getLocaleFromHeaders({'accept-language':'es-ES'})).toBe('es');
    expect(getLocaleFromHeaders()).toBe('pt');
  });
  it("translates system data but preserves user trade content", () => {
    const source={ok:true,toast:'Compra realizada com sucesso',data:{title:'Iniciais Clássicos de Kanto',description:'Colecione 15 Pokémon do tipo Psíquico'}};
    const result=localizeResponse(source,'en',true) as typeof source;
    expect(result.data.title).toBe('Classic Kanto starters');
    expect(result.data.description).toContain('Psychic');
    expect((localizeResponse(source,'jp',false) as typeof source).data.title).toBe(source.data.title);
  });
  it("does not allow unresolved literal semantic keys in frontend code", () => {
    const missing: string[]=[];
    for (const file of files('apps/www/src')) {
      if (file.includes('/i18n/')) continue;
      const source=ts.createSourceFile(file,readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
      function visit(node: ts.Node) {
        if(ts.isCallExpression(node) && ['t','ui'].includes(node.expression.getText(source)) && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) {
          const key=node.arguments[0].text;
          if (/^[a-zA-Z]+\.[a-zA-Z0-9]+$/.test(key) && !apiCopy[key]) {
            for (const locale of ['pt','en','es','jp'] as const) if (lookup(dictionaries[locale],key)===undefined) missing.push(`${file}:${locale}:${key}`);
          }
        }
        ts.forEachChild(node,visit);
      }
      visit(source);
    }
    expect(missing).toEqual([]);
  });
});

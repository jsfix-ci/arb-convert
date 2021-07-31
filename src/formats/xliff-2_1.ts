import { Element, js2xml, xml2js } from 'xml-js';
import {
  IApplicationResourceBundle,
  IArbPlaceholders,
  IConvertOptions,
  IParseOptions,
} from '../types';
import escapeValue from '../util/escapeValue';
import makeElement from '../util/makeElement';
import makeText from '../util/makeText';
import xmlQuery from '../util/xmlQuery';

export function convert({
  source,
  target,
  original,
  sourceLanguage,
  targetLanguage,
}: IConvertOptions): IParseOptions {
  const sourceJs = JSON.parse(source);
  const targetJs = target ? JSON.parse(target) : null;

  const units = Object.keys(sourceJs)
    .filter((key) => key[0] !== '@')
    .map((key) => {
      const sourceString = sourceJs[key];
      const targetString = targetJs && targetJs[key];
      const { description, placeholders } = sourceJs[`@${key}`];

      const notesChildren = [];
      const segmentChildren = [
        makeElement('source', {}, [makeText(sourceString)]),
      ];

      if (targetString) {
        segmentChildren.push(
          makeElement('target', {}, [makeText(targetString)]),
        );
      }

      if (description) {
        notesChildren.push(
          makeElement('note', {
            category: 'description',
          }, [makeText(description)]),
        );
      }

      if (Object.keys(placeholders).length > 0) {
        Object.keys(placeholders).forEach((paramName) => {
          Object.keys(placeholders[paramName]).forEach((property) => {
            notesChildren.push(
              makeElement('note', {
                category: 'placeholder',
              }, [
                makeText(`{${paramName}} ${property}: ${placeholders[paramName][property]}`),
              ]),
            );
          });
        });
      }

      const unitChildren = [
        makeElement('segment', {}, segmentChildren),
      ];

      if (notesChildren.length > 0) {
        unitChildren.unshift(
          makeElement('notes', {}, notesChildren),
        );
      }

      return makeElement('unit', { id: escapeValue(key) }, unitChildren);
    });

  const root = makeElement('xliff', {
    'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
    'xsi:schemaLocation': 'urn:oasis:names:tc:xliff:document:2.0 http://docs.oasis-open.org/xliff/xliff-core/v2.1/cos02/schemas/xliff_core_2.0.xsd',
    xmlns: 'urn:oasis:names:tc:xliff:document:2.0',
    version: '2.0',
    srcLang: sourceLanguage,
    trgLang: targetLanguage,
  }, [
    makeElement('file', {
      id: 'arb',
      original,
      'xml:space': 'preserve',
    }, units),
  ]);

  const content = js2xml({
    elements: [root],
  }, {
    spaces: '  ',
  });

  return { content };
}

export function parse({ content }: IParseOptions): IConvertOptions {
  const srcArb: IApplicationResourceBundle = {};
  const trgArb: IApplicationResourceBundle = {};
  const xmlJsNode = xml2js(content) as Element;
  const parsedXml = xmlQuery(xmlJsNode);
  const xliff = parsedXml.query('xliff');
  const sourceLanguage = String(xliff.attributes!.srcLang || '');
  const targetLanguage = String(xliff.attributes!.trgLang || '');
  const file = xliff.query('file');
  const original = String(file.attributes!.original || '');

  srcArb['@@locale'] = sourceLanguage.replace('-', '_');
  srcArb['@@last_modified'] = new Date(Date.now()).toISOString();

  if (targetLanguage) {
    trgArb['@@locale'] = targetLanguage.replace('-', '_');
    trgArb['@@last_modified'] = new Date(Date.now()).toISOString();
  }

  file
    .queryAll('unit')
    .forEach((unit) => {
      const sourceText = unit
        .queryAll('segment')
        .query('source')
        .innerText();

      const targetText = unit
        .queryAll('segment')
        .query('target')
        .innerText();

      const description = unit
        .query('notes')
        .query((el) => el.name === 'note'
                    && el.attributes != null
                    && el.attributes.category === 'description')
        .innerText();

      const placeholders: IArbPlaceholders = {};
      unit
        .query('notes')
        .queryAll((el) => el.name === 'note'
                    && el.attributes != null
                    && el.attributes.category === 'placeholder')
        .forEach((el) => {
          const match = el.innerText().match(/^\{([\w-]+)\} (.*): (.*)$/);
          if (match) {
            const [, key, type, value] = match;
            placeholders[key] = {
              [type]: value,
            };
          }
        });

      srcArb[unit.attributes!.id!] = sourceText;
      srcArb[`@${unit.attributes!.id!}`] = {
        description,
        type: 'text',
        placeholders,
      };

      trgArb[unit.attributes!.id!] = targetText;
      trgArb[`@${unit.attributes!.id!}`] = {
        description,
        type: 'text',
        placeholders,
      };
    });

  const source = JSON.stringify(srcArb, null, 2);
  const target = targetLanguage ? JSON.stringify(trgArb, null, 2) : '';

  return {
    source,
    target,
    original,
    sourceLanguage,
    targetLanguage,
  };
}

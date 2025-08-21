import * as fs from 'fs';
import * as path from 'path';

export interface TranslationConfig {
  readonly sourcePattern: string;
  readonly outputDir: string;
  readonly csvFile: string;
  readonly supportedLocales: readonly string[];
  readonly messagesDir: string;
  readonly projectRoot: string;
}

export interface TranslationKey {
  readonly key: string;
  readonly context: string;
}

export interface TranslationMap {
  [locale: string]: Record<string, string>;
}

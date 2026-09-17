import { defineConfig as \u0063onfig } from 'fortenv/config';
import \u0064efaultReader from './readers.mjs';
import * as \u{72}eaders from './readers.mjs';
import { \u0072ead, read as r\u0065ader, read as \u{10400}reader, read as read\u{1D7D8} } from './readers.mjs';
import { default as def\u0061ultAlias, '\u0072ead' as quotedReader } from './readers.mjs';

// Both escape forms preserve the same bindings and imported function identities.
export default config({ secrets: { DATABASE_URL: [
   defaultReader, defaultAlias, readers.default,
   read, reader, 𐐀reader, read𝟘, quotedReader, readers.read,
] } });

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  decodedStreamLimitBytes,
  patchPdfJsPrivacyWorker,
} from './pdfjs-privacy-worker-patch.mjs';

const sourceFixture = `
const Bn=new Uint8Array(0);class DecodeStream {
  buffer=Bn;minBufferLength=512;
  ensureBuffer(e){const t=this.buffer;if(e<=t.byteLength)return t;let n=this.minBufferLength;for(;n<e;)n*=2;const a=new Uint8Array(n);a.set(t);return this.buffer=a}
  async decode(n){const r=[];let i=0;for await(const e of n){r.push(e);i+=e.byteLength}const o=new Uint8Array(i);return o}
}
export { DecodeStream };
`;

async function importPatchedFixture() {
  const patched = patchPdfJsPrivacyWorker(sourceFixture);
  const url = `data:text/javascript;base64,${Buffer.from(patched).toString('base64')}#${Math.random()}`;
  return { patched, module: await import(url) };
}

test('shares the decoded-stream budget across every DecodeStream in one worker', async () => {
  const { module: { DecodeStream } } = await importPatchedFixture();
  const first = new DecodeStream();
  const second = new DecodeStream();
  const third = new DecodeStream();

  assert.equal(first.ensureBuffer(decodedStreamLimitBytes / 2).byteLength, decodedStreamLimitBytes / 2);
  assert.equal(second.ensureBuffer(decodedStreamLimitBytes / 2).byteLength, decodedStreamLimitBytes / 2);
  assert.throws(
    () => third.ensureBuffer(1),
    /TC_PDF_DECODED_STREAM_LIMIT/,
  );
});

test('debits progressive DecompressionStream chunks before retaining them', async () => {
  const { patched, module: { DecodeStream } } = await importPatchedFixture();

  assert.match(
    patched,
    /tcPdfDebitDecodedStreamBytes\(e\.byteLength\);r\.push\(e\)/,
  );

  await new DecodeStream().decode([new Uint8Array(decodedStreamLimitBytes / 2)]);
  await new DecodeStream().decode([new Uint8Array(decodedStreamLimitBytes / 2)]);
  await assert.rejects(
    () => new DecodeStream().decode([new Uint8Array(1)]),
    /TC_PDF_DECODED_STREAM_LIMIT/,
  );
});

test('fails closed when the pinned PDF.js anchors change or are duplicated', () => {
  assert.throws(
    () => patchPdfJsPrivacyWorker(sourceFixture.replace('const Bn=', 'const changedBn=')),
    /document decoded-stream budget anchor changed/,
  );
  assert.throws(
    () => patchPdfJsPrivacyWorker(`${sourceFixture}\n${sourceFixture}`),
    /anchor changed/,
  );
});

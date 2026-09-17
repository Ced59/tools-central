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
function ea(e){return e}
class BrotliStream extends DecodeStream{constructor(e){super();this.stream=e}readBlock(){const e=this.stream.getBytes(),t=ea(new Int8Array(e.buffer,e.byteOffset,e.length));this.buffer=new Uint8Array(t.buffer,t.byteOffset,t.length);this.bufferLength=this.buffer.length;this.eof=!0}}
class JpegImage{constructor(){}parse(){}getData(){return new Uint8Array(1)}}
class JpegFixture{decode(e){const t=new JpegImage(this.jpegOptions);t.parse(e);const n=t.getData({width:this.drawWidth,height:this.drawHeight,forceRGBA:this.forceRGBA,forceRGB:this.forceRGB});this.buffer=n;}async transferable(f,c,o,l){let a;if(f){const e=2**f;c.desiredWidth=Math.ceil(o/e);c.desiredHeight=Math.ceil(l/e)}a=new ImageDecoder(c);return a}}
class CcittFixture{async decode(e){this.buffer=await JBig2CCITTFaxImage.instance.decode(e,this.dict.get("W","Width"),this.dict.get("H","Height"),null,this.params);}}
class Jbig2Fixture{async decode(e,a){this.buffer=await JBig2CCITTFaxImage.instance.decode(e,this.dict.get("Width"),this.dict.get("Height"),a);}}
class JpxFixture{async decode(e,n){e||=this.bytes;this.buffer=await JpxImage.instance.decode(e,n);}}
function decodeJpeg(data){return new JpegFixture().decode(data)}
export { BrotliStream, DecodeStream, decodeJpeg };
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

test('rejects Brotli whole-buffer fallback before its built-in decoder allocates', async () => {
  const { patched, module: { BrotliStream } } = await importPatchedFixture();

  assert.match(patched, /class BrotliStream[\s\S]*readBlock\(\)\{tcPdfDecodedStreamLimit\(\)\}/);
  assert.throws(
    () => new BrotliStream({ getBytes: () => new Uint8Array([1]) }).readBlock(),
    /TC_PDF_DECODED_STREAM_LIMIT/,
  );
});

test('rejects every direct image decoder before allocation', async () => {
  const { patched, module: { decodeJpeg } } = await importPatchedFixture();

  assert.match(patched, /class JpegFixture[\s\S]*decode\(e\)\{tcPdfDecodedStreamLimit\(\);const t=new JpegImage/);
  assert.match(patched, /transferable[\s\S]*tcPdfDecodedStreamLimit\(\);a=new ImageDecoder/);
  assert.match(patched, /class CcittFixture[\s\S]*tcPdfDecodedStreamLimit\(\);this\.buffer=await JBig2CCITTFaxImage/);
  assert.match(patched, /class Jbig2Fixture[\s\S]*tcPdfDecodedStreamLimit\(\);this\.buffer=await JBig2CCITTFaxImage/);
  assert.match(patched, /class JpxFixture[\s\S]*tcPdfDecodedStreamLimit\(\);e\|\|=this\.bytes/);
  assert.throws(
    () => decodeJpeg(new Uint8Array()),
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

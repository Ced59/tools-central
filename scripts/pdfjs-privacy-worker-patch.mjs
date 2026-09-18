export const decodedStreamLimitBytes = 32 * 1_024 * 1_024;

const globalBudgetAnchor = 'const Bn=new Uint8Array(0);class DecodeStream';
const bufferAnchor = 'ensureBuffer(e){const t=this.buffer;if(e<=t.byteLength)return t;let n=this.minBufferLength;for(;n<e;)n*=2;const a=new Uint8Array(n);a.set(t);return this.buffer=a}';
const asyncAnchor = 'for await(const e of n){r.push(e);i+=e.byteLength}const o=new Uint8Array(i);';
const brotliFallbackAnchor = 'readBlock(){const e=this.stream.getBytes(),t=ea(new Int8Array(e.buffer,e.byteOffset,e.length));this.buffer=new Uint8Array(t.buffer,t.byteOffset,t.length);this.bufferLength=this.buffer.length;this.eof=!0}';
const jpegDecodeAnchor = 'const t=new JpegImage(this.jpegOptions);t.parse(e);const n=t.getData({width:this.drawWidth,height:this.drawHeight,forceRGBA:this.forceRGBA,forceRGB:this.forceRGB});this.buffer=n;';
const jpegImageDecoderAnchor = 'if(f){const e=2**f;c.desiredWidth=Math.ceil(o/e);c.desiredHeight=Math.ceil(l/e)}a=new ImageDecoder(c);';
const ccittDecodeAnchor = 'this.buffer=await JBig2CCITTFaxImage.instance.decode(e,this.dict.get("W","Width"),this.dict.get("H","Height"),null,this.params);';
const jbig2DecodeAnchor = 'this.buffer=await JBig2CCITTFaxImage.instance.decode(e,this.dict.get("Width"),this.dict.get("Height"),a);';
const jpxDecodeAnchor = 'e||=this.bytes;this.buffer=await JpxImage.instance.decode(e,n);';

const limit = String(decodedStreamLimitBytes);
const globalBudgetReplacement = `let tcPdfDecodedStreamBytes=0;function tcPdfDecodedStreamLimit(){throw new Error("TC_PDF_DECODED_STREAM_LIMIT")}function tcPdfDebitDecodedStreamBytes(e){const t=tcPdfDecodedStreamBytes+e;if(!Number.isSafeInteger(e)||e<0||!Number.isSafeInteger(t)||t>${limit})tcPdfDecodedStreamLimit();tcPdfDecodedStreamBytes=t}const Bn=new Uint8Array(0);class DecodeStream`;
const bufferReplacement = `ensureBuffer(e){if(!Number.isSafeInteger(e)||e<0||e>${limit})tcPdfDecodedStreamLimit();this.minBufferLength=Math.min(this.minBufferLength,${limit});const t=this.buffer;if(e<=t.byteLength)return t;let n=this.minBufferLength;for(;n<e;)n*=2;n=Math.min(n,${limit});const a=n-(this._tcPdfDecodedStreamBytes||0);if(a>0){tcPdfDebitDecodedStreamBytes(a);this._tcPdfDecodedStreamBytes=n}const s=new Uint8Array(n);s.set(t);return this.buffer=s}`;
const asyncReplacement = `for await(const e of n){i+=e.byteLength;if(!Number.isSafeInteger(i)||i>${limit})tcPdfDecodedStreamLimit();tcPdfDebitDecodedStreamBytes(e.byteLength);r.push(e)}const o=new Uint8Array(i);`;
const brotliFallbackReplacement = 'readBlock(){tcPdfDecodedStreamLimit()}';
const jpegDecodeReplacement = `tcPdfDecodedStreamLimit();${jpegDecodeAnchor}`;
const jpegImageDecoderReplacement = 'if(f){const e=2**f;c.desiredWidth=Math.ceil(o/e);c.desiredHeight=Math.ceil(l/e)}tcPdfDecodedStreamLimit();a=new ImageDecoder(c);';
const ccittDecodeReplacement = `tcPdfDecodedStreamLimit();${ccittDecodeAnchor}`;
const jbig2DecodeReplacement = `tcPdfDecodedStreamLimit();${jbig2DecodeAnchor}`;
const jpxDecodeReplacement = `tcPdfDecodedStreamLimit();${jpxDecodeAnchor}`;

export function patchPdfJsPrivacyWorker(source) {
  const replacements = [
    ['document decoded-stream budget', globalBudgetAnchor, globalBudgetReplacement],
    ['DecodeStream buffer', bufferAnchor, bufferReplacement],
    ['DecompressionStream output', asyncAnchor, asyncReplacement],
    ['Brotli whole-buffer fallback', brotliFallbackAnchor, brotliFallbackReplacement],
    ['JPEG decoded pixels', jpegDecodeAnchor, jpegDecodeReplacement],
    ['ImageDecoder decoded pixels', jpegImageDecoderAnchor, jpegImageDecoderReplacement],
    ['CCITT decoded pixels', ccittDecodeAnchor, ccittDecodeReplacement],
    ['JBIG2 decoded pixels', jbig2DecodeAnchor, jbig2DecodeReplacement],
    ['JPX decoded pixels', jpxDecodeAnchor, jpxDecodeReplacement],
  ];

  for (const [label, anchor] of replacements) {
    const firstAnchor = source.indexOf(anchor);
    if (firstAnchor < 0 || firstAnchor !== source.lastIndexOf(anchor)) {
      throw new Error(`PDF.js ${label} anchor changed; review the bounded privacy worker patch.`);
    }
  }

  return replacements.reduce(
    (patchedSource, [, anchor, replacement]) => patchedSource.replace(anchor, replacement),
    source,
  );
}

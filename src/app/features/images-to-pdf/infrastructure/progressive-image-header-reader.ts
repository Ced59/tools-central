import {
  IMAGES_TO_PDF_MAX_FILE_BYTES,
  inspectRasterImageHeader,
  type RasterImageHeader,
} from '../domain/images-to-pdf.models';

const INITIAL_IMAGE_HEADER_SCAN_BYTES = 64 * 1024;

export async function inspectImageBlob(blob: Blob): Promise<RasterImageHeader | null> {
  const maximum = Math.min(blob.size, IMAGES_TO_PDF_MAX_FILE_BYTES);
  let scanBytes = Math.min(maximum, INITIAL_IMAGE_HEADER_SCAN_BYTES);
  while (scanBytes > 0) {
    const bytes = new Uint8Array(await blob.slice(0, scanBytes).arrayBuffer());
    const header = inspectRasterImageHeader(bytes);
    if (header) return header;
    if (!isJpeg(bytes) || scanBytes >= maximum) return null;
    scanBytes = Math.min(maximum, scanBytes * 2);
  }
  return null;
}

function isJpeg(bytes: Uint8Array): boolean {
  return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

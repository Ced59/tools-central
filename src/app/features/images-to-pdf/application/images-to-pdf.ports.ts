import type {
  ImagePdfSettings,
  RasterImageHeader,
} from '../domain/images-to-pdf.models';

export interface ImageSourceFile {
  id: string;
  fileName: string;
  blob: Blob;
}

export interface PreparedPdfImage extends ImageSourceFile, RasterImageHeader {
  size: number;
}

export interface ImageHeaderReaderPort {
  readonly inspect: (blob: Blob, signal?: AbortSignal) => Promise<RasterImageHeader | null>;
}

export interface ImagePdfGeneratorPort {
  readonly create: (
    images: readonly PreparedPdfImage[],
    settings: ImagePdfSettings,
    onProgress?: (completed: number, total: number) => void,
    signal?: AbortSignal,
  ) => Promise<Blob>;
}

export interface ImagePdfDownloadPort {
  readonly download: (blob: Blob, fileName: string) => void;
}

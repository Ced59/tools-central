export interface JsZipArchiveWorkerCommand {
  entries: Array<{ fileName: string; blob: Blob }>;
}

export type JsZipArchiveWorkerResponse =
  | Readonly<{ ok: true; blob: Blob }>
  | Readonly<{ ok: false; message: string }>;

export interface JsZipArchiveWorkerCommand {
  entries: Array<{ fileName: string; bytes: ArrayBuffer }>;
}

export type JsZipArchiveWorkerResponse =
  | Readonly<{ ok: true; bytes: ArrayBuffer }>
  | Readonly<{ ok: false; message: string }>;

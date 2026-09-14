import type {
  ImageHeaderWorkerCommand,
  ImageHeaderWorkerResponse,
} from './image-header.worker.messages';
import { inspectImageBlob } from './progressive-image-header-reader';

addEventListener('message', ({ data }: MessageEvent<ImageHeaderWorkerCommand>) => {
  void inspect(data.blob);
});

async function inspect(blob: Blob): Promise<void> {
  try {
    send({ type: 'success', header: await inspectImageBlob(blob) });
  } catch (error: unknown) {
    send({
      type: 'failure',
      message: error instanceof Error ? error.message : 'The image header worker failed.',
    });
  }
}

function send(response: ImageHeaderWorkerResponse): void {
  postMessage(response);
}

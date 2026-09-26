/**
 * Utility functions for handling WAV files, PCM data, and audio stitching for 100K words
 */

export function downloadWavBlob(blob: Blob, filename = 'hindi-speech.wav') {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function downloadBase64Wav(base64Data: string, filename = 'hindi-speech.wav') {
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: 'audio/wav' });
  downloadWavBlob(blob, filename);
}

/**
 * Concatenates multiple WAV audio ArrayBuffers into a single cohesive WAV file.
 * Handles header parsing and combines raw PCM samples.
 */
export async function concatenateWavBlobs(blobs: Blob[]): Promise<Blob> {
  if (blobs.length === 0) {
    throw new Error('No audio blobs to concatenate');
  }
  if (blobs.length === 1) {
    return blobs[0];
  }

  const pcmBuffers: Uint8Array[] = [];
  let totalDataLength = 0;
  let sampleRate = 24000;
  let numChannels = 1;
  let bitsPerSample = 16;

  for (let i = 0; i < blobs.length; i++) {
    const arrayBuffer = await blobs[i].arrayBuffer();
    const dataView = new DataView(arrayBuffer);

    // Verify 'RIFF' and 'WAVE'
    const riff = String.fromCharCode(
      dataView.getUint8(0),
      dataView.getUint8(1),
      dataView.getUint8(2),
      dataView.getUint8(3)
    );

    if (riff === 'RIFF') {
      if (i === 0) {
        numChannels = dataView.getUint16(22, true);
        sampleRate = dataView.getUint32(24, true);
        bitsPerSample = dataView.getUint16(34, true);
      }

      // Find 'data' chunk
      let offset = 12;
      let dataOffset = -1;
      let dataChunkSize = 0;

      while (offset < arrayBuffer.byteLength - 8) {
        const chunkId = String.fromCharCode(
          dataView.getUint8(offset),
          dataView.getUint8(offset + 1),
          dataView.getUint8(offset + 2),
          dataView.getUint8(offset + 3)
        );
        const chunkSize = dataView.getUint32(offset + 4, true);
        if (chunkId === 'data') {
          dataOffset = offset + 8;
          dataChunkSize = chunkSize;
          break;
        }
        offset += 8 + chunkSize;
      }

      if (dataOffset !== -1) {
        const pcmPart = new Uint8Array(arrayBuffer, dataOffset, Math.min(dataChunkSize, arrayBuffer.byteLength - dataOffset));
        pcmBuffers.push(pcmPart);
        totalDataLength += pcmPart.length;
      } else {
        // Fallback: take after 44 bytes
        const pcmPart = new Uint8Array(arrayBuffer, 44);
        pcmBuffers.push(pcmPart);
        totalDataLength += pcmPart.length;
      }
    }
  }

  // Create combined WAV header
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;

  function writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + totalDataLength, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, 'data');
  view.setUint32(40, totalDataLength, true);

  // Merge into single Uint8Array
  const combinedBuffer = new Uint8Array(44 + totalDataLength);
  combinedBuffer.set(new Uint8Array(header), 0);

  let currentOffset = 44;
  for (const buf of pcmBuffers) {
    combinedBuffer.set(buf, currentOffset);
    currentOffset += buf.length;
  }

  return new Blob([combinedBuffer], { type: 'audio/wav' });
}

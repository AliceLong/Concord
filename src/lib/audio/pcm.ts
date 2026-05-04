const TARGET_SAMPLE_RATE = 16_000;

function clampSample(value: number): number {
  return Math.max(-1, Math.min(1, value));
}

export function downsampleToInt16Pcm(
  input: Float32Array,
  inputSampleRate: number,
  targetSampleRate = TARGET_SAMPLE_RATE
): Int16Array {
  if (input.length === 0) {
    return new Int16Array(0);
  }

  if (inputSampleRate === targetSampleRate) {
    const output = new Int16Array(input.length);

    for (let index = 0; index < input.length; index += 1) {
      const sample = clampSample(input[index]);
      output[index] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    }

    return output;
  }

  const ratio = inputSampleRate / targetSampleRate;
  const outputLength = Math.max(1, Math.round(input.length / ratio));
  const output = new Int16Array(outputLength);
  let inputIndex = 0;

  for (let outputIndex = 0; outputIndex < outputLength; outputIndex += 1) {
    const nextInputIndex = Math.min(input.length, Math.round((outputIndex + 1) * ratio));
    let total = 0;
    let count = 0;

    for (let cursor = inputIndex; cursor < nextInputIndex; cursor += 1) {
      total += input[cursor];
      count += 1;
    }

    const sample = clampSample(count > 0 ? total / count : input[inputIndex] ?? 0);
    output[outputIndex] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    inputIndex = nextInputIndex;
  }

  return output;
}

export function concatInt16Arrays(left: Int16Array, right: Int16Array): Int16Array {
  if (left.length === 0) {
    return right;
  }

  if (right.length === 0) {
    return left;
  }

  const merged = new Int16Array(left.length + right.length);
  merged.set(left, 0);
  merged.set(right, left.length);
  return merged;
}

export function int16ArrayToUint8Array(samples: Int16Array): Uint8Array {
  return new Uint8Array(samples.buffer, samples.byteOffset, samples.byteLength);
}

export const PCM_FRAME_SAMPLES = 800;
export const PCM_TARGET_SAMPLE_RATE = TARGET_SAMPLE_RATE;

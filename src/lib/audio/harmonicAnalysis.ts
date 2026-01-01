export interface HarmonicAnalysis {
	harmonics: number[];
	amplitudes: number[];
}

export function detectHarmonics(
	fundamental: number,
	frequencyData: Float32Array,
	sampleRate: number,
	fftSize: number,
	maxFrequency: number,
	maxHarmonics: number = 8
): HarmonicAnalysis {
	const harmonics: number[] = [];
	const amplitudes: number[] = [];
	const binWidth = sampleRate / fftSize;

	for (let harmonic = 1; harmonic <= maxHarmonics; harmonic++) {
		const targetFreq = fundamental * harmonic;
		if (targetFreq > maxFrequency) break;

		const bin = Math.round(targetFreq / binWidth);
		if (bin < frequencyData.length) {
			const { frequency, amplitude } = findPeakNearBin(frequencyData, bin, binWidth);
			harmonics.push(frequency);
			amplitudes.push(amplitude);
		}
	}

	return { harmonics, amplitudes };
}

function findPeakNearBin(
	frequencyData: Float32Array,
	bin: number,
	binWidth: number
): { frequency: number; amplitude: number } {
	let maxAmplitude = frequencyData[bin];
	let maxBin = bin;

	for (let offset = -2; offset <= 2; offset++) {
		const checkBin = bin + offset;
		if (checkBin >= 0 && checkBin < frequencyData.length) {
			if (frequencyData[checkBin] > maxAmplitude) {
				maxAmplitude = frequencyData[checkBin];
				maxBin = checkBin;
			}
		}
	}

	return {
		frequency: maxBin * binWidth,
		amplitude: maxAmplitude
	};
}

export function calculateAmplitude(timeData: Uint8Array): number {
	let sum = 0;
	for (let i = 0; i < timeData.length; i++) {
		const normalized = (timeData[i] - 128) / 128;
		sum += normalized * normalized;
	}
	return Math.sqrt(sum / timeData.length);
}

export function calculateClarity(amplitudes: number[], minDecibels: number): number {
	if (amplitudes.length < 3) return 0;

	const fundamentalAmp = amplitudes[0];
	if (fundamentalAmp < minDecibels + 20) return 0;

	let harmonicSum = 0;
	let expectedHarmonicSum = 0;

	for (let i = 1; i < Math.min(3, amplitudes.length); i++) {
		const expectedAmp = fundamentalAmp - (6 * i);
		const actualAmp = amplitudes[i];
		
		harmonicSum += actualAmp;
		expectedHarmonicSum += expectedAmp;
	}

	const ratio = harmonicSum / expectedHarmonicSum;
	return Math.max(0, Math.min(1, ratio));
}

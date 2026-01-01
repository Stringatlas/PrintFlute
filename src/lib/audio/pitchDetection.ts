const MIN_RMS_THRESHOLD = 0.01;
const MIN_CORRELATION = 0.9;
const FREQ_STABILITY_THRESHOLD = 0.05;
const SPECTRAL_ENERGY_THRESHOLD_DB = 20;

export interface PitchCandidate {
	offset: number;
	correlation: number;
	frequency: number;
	spectralEnergy: number;
}

export function detectPitch(
	timeData: Uint8Array,
	frequencyData: Float32Array,
	sampleRate: number,
	fftSize: number,
	minFrequency: number,
	maxFrequency: number,
	minDecibels: number,
	previousFreq: number = 0
): number {
	const SIZE = timeData.length;
	const MAX_SAMPLES = Math.floor(SIZE / 2);
	const MIN_SAMPLES = Math.floor(sampleRate / maxFrequency);

	const rms = calculateRMS(timeData);
	if (rms < MIN_RMS_THRESHOLD) {
		return 0;
	}

	const correlations = calculateAutocorrelation(timeData, MIN_SAMPLES, MAX_SAMPLES);
	const candidates = findPitchCandidates(
		correlations,
		MIN_SAMPLES,
		MAX_SAMPLES,
		sampleRate,
		frequencyData,
		fftSize,
		minDecibels
	);

	if (candidates.length === 0) {
		return 0;
	}

	const validCandidates = filterBySpectralEnergy(candidates, SPECTRAL_ENERGY_THRESHOLD_DB);
	if (validCandidates.length === 0) {
		return 0;
	}

	return selectBestCandidate(validCandidates, previousFreq, FREQ_STABILITY_THRESHOLD);
}

function calculateRMS(timeData: Uint8Array): number {
	let sum = 0;
	for (let i = 0; i < timeData.length; i++) {
		const val = (timeData[i] - 128) / 128;
		sum += val * val;
	}
	return Math.sqrt(sum / timeData.length);
}

function calculateAutocorrelation(
	timeData: Uint8Array,
	minSamples: number,
	maxSamples: number
): number[] {
	const correlations = new Array(maxSamples);

	for (let offset = minSamples; offset < maxSamples; offset++) {
		let correlation = 0;

		for (let i = 0; i < maxSamples; i++) {
			correlation += Math.abs((timeData[i] - 128) / 128 - (timeData[i + offset] - 128) / 128);
		}
		correlation = 1 - correlation / maxSamples;
		correlations[offset] = correlation;
	}

	return correlations;
}

function findPitchCandidates(
	correlations: number[],
	minSamples: number,
	maxSamples: number,
	sampleRate: number,
	frequencyData: Float32Array,
	fftSize: number,
	minDecibels: number
): PitchCandidate[] {
	const candidates: PitchCandidate[] = [];
	const binWidth = sampleRate / fftSize;
	let lastCorrelation = 0;

	for (let offset = minSamples; offset < maxSamples; offset++) {
		const correlation = correlations[offset];

		if (correlation > MIN_CORRELATION && correlation > lastCorrelation) {
			const nextCorr = offset < maxSamples - 1 ? correlations[offset + 1] : 0;

			if (correlation > nextCorr) {
				const shift = parabolicInterpolation(correlations, offset, maxSamples);
				const frequency = sampleRate / (offset + shift);

				const spectralEnergy = getSpectralEnergy(frequency, frequencyData, binWidth);

				candidates.push({ offset, correlation, frequency, spectralEnergy });
			}
		}
		lastCorrelation = correlation;
	}

	return candidates;
}

function parabolicInterpolation(array: number[], index: number, maxIndex: number): number {
	const xv_1 = index < 1 ? array[index] : array[index - 1];
	const x0 = array[index];
	const x1 = index >= maxIndex - 1 ? array[index] : array[index + 1];

	return 0.5 * ((xv_1 - x1) / (xv_1 - 2 * x0 + x1));
}

function getSpectralEnergy(
	frequency: number,
	frequencyData: Float32Array,
	binWidth: number
): number {
	const bin = Math.round(frequency / binWidth);
	
	if (bin >= frequencyData.length) {
		return -Infinity;
	}

	let energySum = 0;
	let count = 0;
	for (let offset = -2; offset <= 2; offset++) {
		const checkBin = bin + offset;
		if (checkBin >= 0 && checkBin < frequencyData.length) {
			energySum += frequencyData[checkBin];
			count++;
		}
	}
	
	return energySum / count;
}

function filterBySpectralEnergy(
	candidates: PitchCandidate[],
	thresholdDb: number
): PitchCandidate[] {
	const maxEnergy = Math.max(...candidates.map((c) => c.spectralEnergy));
	return candidates.filter((c) => c.spectralEnergy > maxEnergy - thresholdDb);
}

function selectBestCandidate(
	candidates: PitchCandidate[],
	previousFreq: number,
	freqThreshold: number
): number {
	candidates.sort((a, b) => b.spectralEnergy - a.spectralEnergy);

	if (previousFreq > 0) {
		for (const candidate of candidates) {
			const ratio = candidate.frequency / previousFreq;

			if (Math.abs(ratio - 1.0) < freqThreshold) {
				return candidate.frequency;
			}
		}

		const maxEnergy = candidates[0].spectralEnergy;
		for (const candidate of candidates) {
			const ratio = candidate.frequency / previousFreq;

			if (candidate.spectralEnergy === maxEnergy && candidate.correlation > 0.95) {
				if (
					Math.abs(ratio - 2.0) < freqThreshold ||
					Math.abs(ratio - 0.5) < freqThreshold
				) {
					return candidate.frequency;
				}
			}
		}
	}

	return candidates[0].frequency;
}

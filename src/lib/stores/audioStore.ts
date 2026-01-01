import { writable, derived } from 'svelte/store';
import type { AudioAnalysisResult } from '$lib/audio/audioAnalyzer';

export interface AudioState {
	isRecording: boolean;
	currentAnalysis: AudioAnalysisResult | null;
	predictedFrequency: number | null;
	history: Array<{
		timestamp: number;
		frequency: number;
		amplitude: number;
	}>;
}

const initialState: AudioState = {
	isRecording: false,
	currentAnalysis: null,
	predictedFrequency: null,
	history: []
};

export const audioStore = writable<AudioState>(initialState);

export const tuningAccuracy = derived(audioStore, ($audio) => {
	if (!$audio.currentAnalysis || !$audio.predictedFrequency) {
		return null;
	}

	const actual = $audio.currentAnalysis.fundamentalFrequency;
	const predicted = $audio.predictedFrequency;
	const centsOff = 1200 * Math.log2(actual / predicted);
	const percentDifference = ((actual - predicted) / predicted) * 100;

	return {
		centsOff,
		percentDifference,
		inTune: Math.abs(centsOff) < 10
	};
});

export const pitchStability = derived(audioStore, ($audio) => {
	if ($audio.history.length < 10) {
		return null;
	}

	const recent = $audio.history.slice(-30);
	const frequencies = recent.map((h) => h.frequency);
	const mean = frequencies.reduce((a, b) => a + b, 0) / frequencies.length;
	const variance =
		frequencies.reduce((sum, freq) => sum + Math.pow(freq - mean, 2), 0) / frequencies.length;
	const stdDev = Math.sqrt(variance);

	const coefficientOfVariation = (stdDev / mean) * 100;

	return {
		mean,
		stdDev,
		stability: Math.max(0, 100 - coefficientOfVariation * 10)
	};
});

export function updateAnalysis(analysis: AudioAnalysisResult | null) {
	audioStore.update((state) => {
		const newAnalysis = analysis || state.currentAnalysis;
		const newState = { ...state, currentAnalysis: newAnalysis };

		if (analysis && analysis.fundamentalFrequency > 0) {
			newState.history = [
				...state.history.slice(-299),
				{
					timestamp: Date.now(),
					frequency: analysis.fundamentalFrequency,
					amplitude: analysis.amplitude
				}
			];
		}

		return newState;
	});
}

export function setRecording(isRecording: boolean) {
	audioStore.update((state) => ({ ...state, isRecording }));
}

export function setPredictedFrequency(frequency: number | null) {
	audioStore.update((state) => ({ ...state, predictedFrequency: frequency }));
}

export function clearHistory() {
	audioStore.update((state) => ({ ...state, history: [] }));
}

export function resetAudioStore() {
	audioStore.set(initialState);
}

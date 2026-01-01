import { AudioCapture, FFT_SIZE, MIN_DECIBELS } from './audioCapture';
import { detectPitch } from './pitchDetection';
import { detectHarmonics, calculateAmplitude, calculateClarity } from './harmonicAnalysis';
import { frequencyToNote } from './musicTheory';

const MIN_FREQUENCY = 80;
const MAX_FREQUENCY = 4000;

export interface AudioAnalysisResult {
	fundamentalFrequency: number;
	noteName: string;
	octave: number;
	centsOff: number;
	harmonics: number[];
	harmonicAmplitudes: number[];
	amplitude: number;
	clarity: number;
	frequencyData: Float32Array;
	timeData: Uint8Array;
}

export class AudioAnalyzer {
	private capture: AudioCapture;
	private lastDetectedFrequency: number = 0;

	constructor() {
		this.capture = new AudioCapture();
	}

	async initialize(): Promise<void> {
		await this.capture.initialize();
	}

	getAnalysis(): AudioAnalysisResult | null {
		const buffers = this.capture.getBuffers();
		if (!buffers) {
			return null;
		}

		const { frequencyData, timeData } = buffers;
		const sampleRate = this.capture.getSampleRate();
		const amplitude = calculateAmplitude(timeData);

		const fundamental = detectPitch(
			timeData,
			frequencyData,
			sampleRate,
			FFT_SIZE,
			MIN_FREQUENCY,
			MAX_FREQUENCY,
			MIN_DECIBELS,
			this.lastDetectedFrequency
		);

		if (fundamental === 0) {
			return {
				fundamentalFrequency: 0,
				noteName: '',
				octave: 0,
				centsOff: 0,
				harmonics: [],
				harmonicAmplitudes: [],
				amplitude,
				clarity: 0,
				frequencyData,
				timeData
			};
		}

		this.lastDetectedFrequency = fundamental;
		const { noteName, octave, centsOff } = frequencyToNote(fundamental);
		
		const { harmonics, amplitudes } = detectHarmonics(
			fundamental,
			frequencyData,
			sampleRate,
			FFT_SIZE,
			MAX_FREQUENCY
		);
		const clarity = calculateClarity(amplitudes, MIN_DECIBELS);

		return {
			fundamentalFrequency: fundamental,
			noteName,
			octave,
			centsOff,
			harmonics,
			harmonicAmplitudes: amplitudes,
			amplitude,
			clarity,
			frequencyData,
			timeData
		};
	}

	async stop(): Promise<void> {
		await this.capture.stop();
		this.lastDetectedFrequency = 0;
	}

	isInitialized(): boolean {
		return this.capture.isInitialized();
	}
}

export { compareToPredicted, frequencyToNoteName } from './musicTheory';

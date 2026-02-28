import { PitchDetector } from 'pitchy';
import Meyda from 'meyda';
import type { MeydaFeaturesObject } from 'meyda';
import type { MeydaAnalyzer } from 'meyda/dist/esm/meyda-wa';
import { AudioCapture, FFT_SIZE } from './audioCapture';
import { frequencyToNote } from './musicTheory';

const MIN_FREQUENCY = 80;
const MAX_FREQUENCY = 4000;
const CLARITY_THRESHOLD = 0.85;

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
	timeData: Float32Array;
}

export class AudioAnalyzer {
	private capture: AudioCapture;
	private pitchDetector: PitchDetector<Float32Array> | null = null;
	private meydaAnalyzer: MeydaAnalyzer | null = null;
	private latestFeatures: Partial<MeydaFeaturesObject> = {};

	constructor() {
		this.capture = new AudioCapture();
	}

	async initialize(): Promise<void> {
		await this.capture.initialize();

		this.pitchDetector = PitchDetector.forFloat32Array(FFT_SIZE);
		this.pitchDetector.minVolumeDecibels = -30;

		const audioContext = this.capture.getAudioContext();
		const sourceNode = this.capture.getSourceNode();

		if (audioContext && sourceNode) {
			this.meydaAnalyzer = Meyda.createMeydaAnalyzer({
				audioContext,
				source: sourceNode,
				bufferSize: 512,
				featureExtractors: ['rms', 'spectralCentroid', 'spectralFlatness'],
				callback: (features: Partial<MeydaFeaturesObject>) => {
					this.latestFeatures = features;
				}
			});
			this.meydaAnalyzer.start();
		}
	}

	getAnalysis(): AudioAnalysisResult | null {
		if (!this.pitchDetector) return null;

		const buffers = this.capture.getBuffers();
		if (!buffers) return null;

		const { frequencyData, timeData } = buffers;
		const sampleRate = this.capture.getSampleRate();

		const [pitch, clarity] = this.pitchDetector.findPitch(timeData, sampleRate);
		const amplitude = this.latestFeatures.rms ?? 0;

		const isValidPitch =
			clarity >= CLARITY_THRESHOLD &&
			pitch >= MIN_FREQUENCY &&
			pitch <= MAX_FREQUENCY;

		if (!isValidPitch) {
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

		const { noteName, octave, centsOff } = frequencyToNote(pitch);
		const { harmonics, amplitudes } = extractHarmonicsFromSpectrum(
			pitch,
			frequencyData,
			sampleRate,
			FFT_SIZE,
			MAX_FREQUENCY
		);

		return {
			fundamentalFrequency: pitch,
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
		this.meydaAnalyzer?.stop();
		this.meydaAnalyzer = null;
		this.pitchDetector = null;
		this.latestFeatures = {};
		await this.capture.stop();
	}

	isInitialized(): boolean {
		return this.capture.isInitialized();
	}
}

function extractHarmonicsFromSpectrum(
	fundamental: number,
	frequencyData: Float32Array,
	sampleRate: number,
	fftSize: number,
	maxFrequency: number
): { harmonics: number[]; amplitudes: number[] } {
	const binResolution = sampleRate / fftSize;
	const harmonics: number[] = [];
	const amplitudes: number[] = [];

	for (let n = 1; n * fundamental <= maxFrequency; n++) {
		const harmonicFreq = n * fundamental;
		const bin = Math.round(harmonicFreq / binResolution);

		if (bin < frequencyData.length) {
			harmonics.push(harmonicFreq);
			amplitudes.push(frequencyData[bin]);
		}
	}

	return { harmonics, amplitudes };
}

export { compareToPredicted, frequencyToNoteName } from './musicTheory';

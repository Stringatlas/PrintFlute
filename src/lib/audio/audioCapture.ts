export const FFT_SIZE = 8192;
export const MIN_DECIBELS = -90;
export const MAX_DECIBELS = -10;
export const SMOOTHING_TIME_CONSTANT = 0.8;

export interface AudioBuffers {
	frequencyData: Float32Array;
	timeData: Uint8Array;
}

export class AudioCapture {
	private audioContext: AudioContext | null = null;
	private analyser: AnalyserNode | null = null;
	private microphone: MediaStreamAudioSourceNode | null = null;
	private stream: MediaStream | null = null;
	private frequencyData: Float32Array | null = null;
	private timeData: Uint8Array | null = null;

	async initialize(): Promise<void> {
		if (this.audioContext) {
			return;
		}

		this.audioContext = new AudioContext();
		this.analyser = this.audioContext.createAnalyser();
		this.analyser.fftSize = FFT_SIZE;
		this.analyser.minDecibels = MIN_DECIBELS;
		this.analyser.maxDecibels = MAX_DECIBELS;
		this.analyser.smoothingTimeConstant = SMOOTHING_TIME_CONSTANT;

		this.frequencyData = new Float32Array(this.analyser.frequencyBinCount);
		this.timeData = new Uint8Array(this.analyser.frequencyBinCount);

		this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
		this.microphone = this.audioContext.createMediaStreamSource(this.stream);
		this.microphone.connect(this.analyser);
	}

	getBuffers(): AudioBuffers | null {
		if (!this.analyser || !this.frequencyData || !this.timeData) {
			return null;
		}

		// @ts-ignore
		this.analyser.getFloatFrequencyData(this.frequencyData);
		// @ts-ignore
		this.analyser.getByteTimeDomainData(this.timeData);

		return {
			frequencyData: new Float32Array(this.frequencyData),
			timeData: new Uint8Array(this.timeData)
		};
	}

	getSampleRate(): number {
		return this.audioContext?.sampleRate ?? 48000;
	}

	async stop(): Promise<void> {
		if (this.stream) {
			this.stream.getTracks().forEach((track) => track.stop());
			this.stream = null;
		}

		if (this.microphone) {
			this.microphone.disconnect();
			this.microphone = null;
		}

		if (this.audioContext) {
			await this.audioContext.close();
			this.audioContext = null;
		}

		this.analyser = null;
		this.frequencyData = null;
		this.timeData = null;
	}

	isInitialized(): boolean {
		return this.audioContext !== null;
	}
}

const MIN_FREQUENCY = 80;
const MAX_FREQUENCY = 4000;
const FREQUENCY_BINS = 256;
const TIME_RESOLUTION = 30;
const LABEL_PADDING = 40;

export interface SpectrogramConfig {
	width: number;
	height: number;
	minFreq: number;
	maxFreq: number;
	minDb: number;
	maxDb: number;
}

export class SpectrogramRenderer {
	private imageData: ImageData;
	private ctx: CanvasRenderingContext2D;
	private config: SpectrogramConfig;
	private columnIndex: number = 0;
	private spectrogramWidth: number;

	constructor(canvas: HTMLCanvasElement, config?: Partial<SpectrogramConfig>) {
		const ctx = canvas.getContext('2d', { willReadFrequently: true });
		if (!ctx) throw new Error('Could not get canvas context');

		this.ctx = ctx;
		this.config = {
			width: canvas.width,
			height: canvas.height,
			minFreq: MIN_FREQUENCY,
			maxFreq: MAX_FREQUENCY,
			minDb: -90,
			maxDb: -10,
			...config
		};

		this.spectrogramWidth = this.config.width - LABEL_PADDING;
		this.imageData = ctx.createImageData(this.spectrogramWidth, this.config.height);
		this.clearSpectrogram();
	}

	addFrequencyData(frequencyData: Float32Array, sampleRate: number): void {
		const { height, minDb, maxDb, minFreq, maxFreq } = this.config;
		const nyquist = sampleRate / 2;

		for (let y = 0; y < height; y++) {
			const freqRatio = y / height;
			const freq = minFreq + freqRatio * (maxFreq - minFreq);

			if (freq > maxFreq) continue;

			const bin = Math.floor((freq / nyquist) * frequencyData.length);
			const db = frequencyData[Math.min(bin, frequencyData.length - 1)];

			const normalized = (db - minDb) / (maxDb - minDb);
			const clamped = Math.max(0, Math.min(1, normalized));

			const color = this.getHotColor(clamped);
			this.setPixel(this.columnIndex, height - 1 - y, color);
		}

		this.columnIndex = (this.columnIndex + 1) % this.spectrogramWidth;

		this.clearColumn(this.columnIndex);
	}

	render(): void {
		const { width, height } = this.config;

		// Clear entire canvas including label area
		this.ctx.fillStyle = '#111827';
		this.ctx.fillRect(0, 0, width, height);

		// Draw spectrogram with offset for labels
		this.ctx.putImageData(this.imageData, LABEL_PADDING, 0);

		const wrapX = this.columnIndex;
		if (wrapX > 0) {
			const rightPart = this.ctx.getImageData(LABEL_PADDING + wrapX, 0, this.spectrogramWidth - wrapX, height);
			const leftPart = this.ctx.getImageData(LABEL_PADDING, 0, wrapX, height);

			this.ctx.putImageData(rightPart, LABEL_PADDING, 0);
			this.ctx.putImageData(leftPart, LABEL_PADDING + this.spectrogramWidth - wrapX, 0);
		}

		this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
		this.ctx.lineWidth = 1;
		this.ctx.beginPath();
		this.ctx.moveTo(width - 1, 0);
		this.ctx.lineTo(width - 1, height);
		this.ctx.stroke();

		this.renderFrequencyAxis();
	}

	private renderFrequencyAxis(): void {
		const { width, height, minFreq, maxFreq } = this.config;
		const frequencies = [500, 1000, 2000, 3000, 4000];

		this.ctx.font = '10px monospace';
		this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
		this.ctx.textAlign = 'right';

		frequencies.forEach((freq) => {
			if (freq < minFreq || freq > maxFreq) return;

			const ratio = (freq - minFreq) / (maxFreq - minFreq);
			const y = height - ratio * height;

			// Draw label on the left
			this.ctx.fillText(`${freq}`, LABEL_PADDING - 5, y + 3);

			// Draw gridline across spectrogram area only
			this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
			this.ctx.lineWidth = 1;
			this.ctx.beginPath();
			this.ctx.moveTo(LABEL_PADDING, y);
			this.ctx.lineTo(width, y);
			this.ctx.stroke();
		});
	}



	clear(): void {
		this.clearSpectrogram();
		this.columnIndex = 0;
		this.ctx.fillStyle = '#111827';
		this.ctx.fillRect(0, 0, this.config.width, this.config.height);
	}

	private clearSpectrogram(): void {
		const { height } = this.config;
		for (let i = 0; i < this.spectrogramWidth * height * 4; i += 4) {
			this.imageData.data[i] = 17;
			this.imageData.data[i + 1] = 24;
			this.imageData.data[i + 2] = 39;
			this.imageData.data[i + 3] = 255;
		}
	}

	private clearColumn(x: number): void {
		const { height } = this.config;
		for (let y = 0; y < height; y++) {
			this.setPixel(x, y, { r: 17, g: 24, b: 39 });
		}
	}

	private setPixel(x: number, y: number, color: { r: number; g: number; b: number }): void {
		const index = (y * this.spectrogramWidth + x) * 4;
		this.imageData.data[index] = color.r;
		this.imageData.data[index + 1] = color.g;
		this.imageData.data[index + 2] = color.b;
		this.imageData.data[index + 3] = 255;
	}

	private getHotColor(value: number): { r: number; g: number; b: number } {
		const v = Math.max(0, Math.min(1, value));

		let r: number, g: number, b: number;

		if (v < 0.25) {
			r = 0;
			g = 0;
			b = Math.floor(v * 4 * 255);
		} else if (v < 0.5) {
			r = 0;
			g = Math.floor((v - 0.25) * 4 * 255);
			b = 255;
		} else if (v < 0.75) {
			r = Math.floor((v - 0.5) * 4 * 255);
			g = 255;
			b = Math.floor((1 - (v - 0.5) * 4) * 255);
		} else {
			r = 255;
			g = Math.floor((1 - (v - 0.75) * 4) * 255);
			b = 0;
		}

		return { r, g, b };
	}

}

export function getMusicalFrequencies(): number[] {
	return [100, 200, 400, 800, 1600, 3200];
}

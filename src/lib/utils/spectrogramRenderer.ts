const MIN_FREQUENCY = 80;
const MAX_FREQUENCY = 4000;
const LEFT_PADDING = 44;
const TOP_PADDING = 12;
const BOTTOM_PADDING = 6;

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
	private spectrogramHeight: number;

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

		this.spectrogramWidth = this.config.width - LEFT_PADDING;
		this.spectrogramHeight = this.config.height - TOP_PADDING - BOTTOM_PADDING;
		this.imageData = ctx.createImageData(this.spectrogramWidth, this.spectrogramHeight);
		this.clearSpectrogram();
	}

	addFrequencyData(frequencyData: Float32Array, sampleRate: number): void {
		const { minDb, maxDb, minFreq, maxFreq } = this.config;
		const nyquist = sampleRate / 2;

		for (let y = 0; y < this.spectrogramHeight; y++) {
			const freqRatio = y / this.spectrogramHeight;
			const freq = minFreq + freqRatio * (maxFreq - minFreq);

			if (freq > maxFreq) continue;

			const bin = Math.floor((freq / nyquist) * frequencyData.length);
			const db = frequencyData[Math.min(bin, frequencyData.length - 1)];

			const normalized = (db - minDb) / (maxDb - minDb);
			const clamped = Math.max(0, Math.min(1, normalized));

			const color = this.getHotColor(clamped);
			this.setPixel(this.columnIndex, this.spectrogramHeight - 1 - y, color);
		}

		this.columnIndex = (this.columnIndex + 1) % this.spectrogramWidth;

		this.clearColumn(this.columnIndex);
	}

	render(): void {
		const { width, height } = this.config;

		this.ctx.fillStyle = '#111827';
		this.ctx.fillRect(0, 0, width, height);

		this.ctx.putImageData(this.imageData, LEFT_PADDING, TOP_PADDING);

		const wrapX = this.columnIndex;
		if (wrapX > 0) {
			const rightPart = this.ctx.getImageData(
				LEFT_PADDING + wrapX, TOP_PADDING,
				this.spectrogramWidth - wrapX, this.spectrogramHeight
			);
			const leftPart = this.ctx.getImageData(
				LEFT_PADDING, TOP_PADDING,
				wrapX, this.spectrogramHeight
			);

			this.ctx.putImageData(rightPart, LEFT_PADDING, TOP_PADDING);
			this.ctx.putImageData(leftPart, LEFT_PADDING + this.spectrogramWidth - wrapX, TOP_PADDING);
		}

		this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
		this.ctx.lineWidth = 1;
		this.ctx.beginPath();
		this.ctx.moveTo(width - 1, TOP_PADDING);
		this.ctx.lineTo(width - 1, TOP_PADDING + this.spectrogramHeight);
		this.ctx.stroke();

		this.renderFrequencyAxis();
	}

	private renderFrequencyAxis(): void {
		const { width, minFreq, maxFreq } = this.config;
		const frequencies = [500, 1000, 2000, 3000, 4000];

		this.ctx.font = '10px monospace';
		this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
		this.ctx.textAlign = 'right';

		frequencies.forEach((freq) => {
			if (freq < minFreq || freq > maxFreq) return;

			const ratio = (freq - minFreq) / (maxFreq - minFreq);
			const y = TOP_PADDING + this.spectrogramHeight - ratio * this.spectrogramHeight;

			const label = freq >= 1000 ? `${freq / 1000}k` : `${freq}`;
			this.ctx.fillText(label, LEFT_PADDING - 5, y + 3);

			this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
			this.ctx.lineWidth = 1;
			this.ctx.beginPath();
			this.ctx.moveTo(LEFT_PADDING, y);
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
		for (let i = 0; i < this.spectrogramWidth * this.spectrogramHeight * 4; i += 4) {
			this.imageData.data[i] = 17;
			this.imageData.data[i + 1] = 24;
			this.imageData.data[i + 2] = 39;
			this.imageData.data[i + 3] = 255;
		}
	}

	private clearColumn(x: number): void {
		for (let y = 0; y < this.spectrogramHeight; y++) {
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

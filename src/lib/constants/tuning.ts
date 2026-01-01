export interface CommonFrequency {
	note: string;
	frequency: number;
	octave: number;
}

export const COMMON_FREQUENCIES: CommonFrequency[] = [
	{ note: 'C', frequency: 261.63, octave: 4 },
	{ note: 'C#', frequency: 277.18, octave: 4 },
	{ note: 'D', frequency: 293.66, octave: 4 },
	{ note: 'D#', frequency: 311.13, octave: 4 },
	{ note: 'E', frequency: 329.63, octave: 4 },
	{ note: 'F', frequency: 349.23, octave: 4 },
	{ note: 'F#', frequency: 369.99, octave: 4 },
	{ note: 'G', frequency: 392.0, octave: 4 },
	{ note: 'G#', frequency: 415.3, octave: 4 },
	{ note: 'A', frequency: 440.0, octave: 4 },
	{ note: 'A#', frequency: 466.16, octave: 4 },
	{ note: 'B', frequency: 493.88, octave: 4 },
	{ note: 'C', frequency: 523.25, octave: 5 },
	{ note: 'C#', frequency: 554.37, octave: 5 },
	{ note: 'D', frequency: 587.33, octave: 5 },
	{ note: 'D#', frequency: 622.25, octave: 5 },
	{ note: 'E', frequency: 659.25, octave: 5 },
	{ note: 'F', frequency: 698.46, octave: 5 },
	{ note: 'F#', frequency: 739.99, octave: 5 },
	{ note: 'G', frequency: 783.99, octave: 5 },
	{ note: 'G#', frequency: 830.61, octave: 5 },
];

export function formatFrequencyOption(freq: CommonFrequency): string {
	return `${freq.note}${freq.octave} (${freq.frequency} Hz)`;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const A4_FREQUENCY = 440;
const CENTS_PER_SEMITONE = 100;

export interface NoteInfo {
	noteName: string;
	octave: number;
	centsOff: number;
}

export interface TuningComparison {
	percentDifference: number;
	centsOff: number;
	inTune: boolean;
}

export function frequencyToNote(frequency: number): NoteInfo {
	const noteNum = 12 * (Math.log(frequency / A4_FREQUENCY) / Math.log(2));
	const noteIndex = Math.round(noteNum);
	const centsOff = Math.round((noteNum - noteIndex) * CENTS_PER_SEMITONE);
	
	const absoluteNoteIndex = noteIndex + 69;
	const octave = Math.floor(absoluteNoteIndex / 12) - 1;
	const noteName = NOTE_NAMES[((absoluteNoteIndex % 12) + 12) % 12];

	return { noteName, octave, centsOff };
}

export function frequencyToNoteName(frequency: number): string {
	const noteNum = 12 * (Math.log(frequency / A4_FREQUENCY) / Math.log(2));
	const noteIndex = Math.round(noteNum);
	const absoluteNoteIndex = noteIndex + 69;
	const octave = Math.floor(absoluteNoteIndex / 12) - 1;
	const noteName = NOTE_NAMES[((absoluteNoteIndex % 12) + 12) % 12];
	
	return `${noteName}${octave}`;
}

export function compareToPredicted(
	actualFreq: number,
	predictedFreq: number
): TuningComparison {
	const percentDifference = ((actualFreq - predictedFreq) / predictedFreq) * 100;
	const centsOff = 1200 * Math.log2(actualFreq / predictedFreq);
	const inTune = Math.abs(centsOff) < 10;

	return {
		percentDifference,
		centsOff,
		inTune
	};
}

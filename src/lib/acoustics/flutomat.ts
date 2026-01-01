const SPEED_OF_SOUND_MM_S = 343000;
const END_CORRECTION_FACTOR = 0.6133;
const HOLE_HEIGHT_EXTENSION_FACTOR = 0.75;
const MIDI_A4_NOTE = 69;
const A4_FREQUENCY_HZ = 440.0;
const MAJOR_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11];

export interface FluteHole {
    frequency: number;
    diameter: number;
    acousticPosition: number;
    physicalPosition: number;
}

export interface FluteParams {
    boreDiameter: number;
    wallThickness: number;
    embouchureDiameter: number;
    endFrequency: number;
    holes: Array<{ frequency: number; diameter: number }>;
    temperatureCelsius: number;
}

export interface FluteResult {
    embouchurePhysicalPosition: number;
    holes: FluteHole[];
    acousticEndX: number;
    speedOfSound: number;
}

export function calculateSpeedOfSound(temperatureCelsius: number): number {
    return SPEED_OF_SOUND_MM_S * Math.sqrt(1 + temperatureCelsius / 273.15);
}

export function midiNoteToFrequency(midiNote: number): number {
    return A4_FREQUENCY_HZ * Math.pow(2, (midiNote - MIDI_A4_NOTE) / 12.0);
}

export function generateScaleFrequencies(baseMidiNote: number, intervals: number[] = MAJOR_SCALE_INTERVALS): number[] {
    return intervals.map(interval => midiNoteToFrequency(baseMidiNote + interval));
}

function calculateEndCorrection(boreDiameter: number): number {
    return END_CORRECTION_FACTOR * (boreDiameter / 2.0);
}

function calculateEffectiveHoleHeight(wallThickness: number, holeDiameter: number): number {
    return wallThickness + HOLE_HEIGHT_EXTENSION_FACTOR * holeDiameter;
}

function calculateClosedHoleCorrection(wallThickness: number, holeDiameter: number, boreDiameter: number): number {
    const ratio = holeDiameter / boreDiameter;
    return 0.25 * wallThickness * ratio * ratio;
}

function calculateEmbouchureCorrection(boreDiameter: number, embouchureDiameter: number, wallThickness: number): number {
    const bore_demb_ratio_sq = (boreDiameter / embouchureDiameter) ** 2;
    const numerator = 10.84 * wallThickness * embouchureDiameter;
    const denominator = boreDiameter + 2.0 * wallThickness;
    return bore_demb_ratio_sq * numerator / denominator;
}

export function calculateFlutePositions(params: FluteParams): FluteResult {
    const { boreDiameter, wallThickness, embouchureDiameter, endFrequency, holes, temperatureCelsius } = params;
    
    const speedOfSound = calculateSpeedOfSound(temperatureCelsius);
    const holeCount = holes.length;
    
    const closedHoleCorrections = holes.map(hole => 
        calculateClosedHoleCorrection(wallThickness, hole.diameter, boreDiameter)
    );
    
    const endCorrection = calculateEndCorrection(boreDiameter);
    
    let targetAcousticLengthEnd = speedOfSound * 0.5 / endFrequency;
    let acousticEndX = targetAcousticLengthEnd - endCorrection;
    
    for (let i = 0; i < holeCount; i++) {
        acousticEndX -= closedHoleCorrections[i];
    }
    
    const calculatedHoles: FluteHole[] = [];
    
    const holeIndex1 = 0;
    const te_1 = calculateEffectiveHoleHeight(wallThickness, holes[holeIndex1].diameter);
    const diameter1 = holes[holeIndex1].diameter;
    const freq1 = holes[holeIndex1].frequency;
    
    let L1 = speedOfSound * 0.5 / freq1;
    for (let i = holeIndex1 + 1; i < holeCount; i++) {
        L1 -= closedHoleCorrections[i];
    }
    
    const a1_term = (diameter1 / boreDiameter) ** 2;
    const a1 = a1_term;
    const b1 = -(acousticEndX + L1) * a1_term;
    const c1 = acousticEndX * L1 * a1_term + te_1 * (L1 - acousticEndX);
    
    const discriminant1 = b1 ** 2 - 4 * a1 * c1;
    if (discriminant1 < 0 || a1 === 0) {
        throw new Error('Cannot solve quadratic for first hole');
    }
    
    const acousticPosition1 = (-b1 - Math.sqrt(discriminant1)) / (2 * a1);
    calculatedHoles[holeIndex1] = {
        frequency: freq1,
        diameter: diameter1,
        acousticPosition: acousticPosition1,
        physicalPosition: acousticEndX - acousticPosition1
    };
    
    for (let n = 1; n < holeCount; n++) {
        const te_n = calculateEffectiveHoleHeight(wallThickness, holes[n].diameter);
        const diameter_n = holes[n].diameter;
        const freq_n = holes[n].frequency;
        const prevHolePos = calculatedHoles[n - 1].acousticPosition;
        
        let Ln = speedOfSound * 0.5 / freq_n;
        for (let i = n + 1; i < holeCount; i++) {
            Ln -= closedHoleCorrections[i];
        }
        
        const bore_d_ratio_sq = (boreDiameter / diameter_n) ** 2;
        const a_n = 2.0;
        const b_n = -prevHolePos - 3.0 * Ln + te_n * bore_d_ratio_sq;
        const c_n = prevHolePos * (Ln - te_n * bore_d_ratio_sq) + Ln ** 2;
        
        const discriminant_n = b_n ** 2 - 4.0 * a_n * c_n;
        if (discriminant_n < 0) {
            throw new Error(`Cannot solve quadratic for hole ${n + 1}`);
        }
        
        const acousticPosition_n = (-b_n - Math.sqrt(discriminant_n)) / (2.0 * a_n);
        calculatedHoles[n] = {
            frequency: freq_n,
            diameter: diameter_n,
            acousticPosition: acousticPosition_n,
            physicalPosition: acousticEndX - acousticPosition_n
        };
    }
    
    const embouchureAcousticX = calculateEmbouchureCorrection(boreDiameter, embouchureDiameter, wallThickness);
    const embouchurePhysicalPosition = acousticEndX - embouchureAcousticX;
    
    return {
        embouchurePhysicalPosition,
        holes: calculatedHoles,
        acousticEndX,
        speedOfSound
    };
}

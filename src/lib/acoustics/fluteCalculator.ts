const SPEED_OF_SOUND_MM_S = 345000.0;
const END_CORRECTION_FACTOR = 0.30665;
const HOLE_HEIGHT_EXTENSION_FACTOR = 0.75;
const CLOSED_HOLE_FACTOR = 0.25;
const MIDI_A4_NOTE = 69;
const A4_FREQUENCY_HZ = 440.0;

export interface FluteHole {
    frequency: number;
    diameter: number;
    acousticPosition: number;
    physicalPosition: number;
    cutoffFrequency: number;
    spacing: number;
}

export interface FluteParams {
    boreDiameter: number;
    wallThickness: number;
    embouchureDiameter: number;
    endFrequency: number;
    holes: Array<{ frequency: number; diameter: number }>;
    lipCoverPercent?: number;
}

export interface FluteResult {
    embouchurePhysicalPosition: number;
    holes: FluteHole[];
    acousticEndX: number;
}

function effWalW(wallThickness: number, holeDiameter: number): number {
    return wallThickness + HOLE_HEIGHT_EXTENSION_FACTOR * holeDiameter;
}

function closedFHCorr(wallThickness: number, holeDiameter: number, boreDiameter: number): number {
    const fhBorRatio = holeDiameter / boreDiameter;
    return CLOSED_HOLE_FACTOR * wallThickness * fhBorRatio * fhBorRatio;
}

function endCorr(boreDiameter: number): number {
    return END_CORRECTION_FACTOR * boreDiameter;
}

function embCorr(boreDiameter: number, adjEmbDiameter: number, wallThickness: number): number {
    const borEmbRatio = boreDiameter / adjEmbDiameter;
    return borEmbRatio * borEmbRatio * (boreDiameter / 2 + wallThickness + 0.6133 * adjEmbDiameter / 2);
}

function cutoffForHole(
    n: number,
    boreDiameter: number,
    wallThickness: number,
    holeDiameter: number,
    fhXsDiff: number
): number {
    const effectiveWallW = effWalW(wallThickness, holeDiameter);
    return 0.5 * SPEED_OF_SOUND_MM_S * holeDiameter / 
           (Math.PI * boreDiameter * Math.sqrt(effectiveWallW * fhXsDiff));
}

export function midiNoteToFrequency(midiNote: number): number {
    return A4_FREQUENCY_HZ * Math.pow(2, (midiNote - MIDI_A4_NOTE) / 12.0);
}

export function calculateFlutePositions(params: FluteParams): FluteResult {
    const { boreDiameter, wallThickness, embouchureDiameter, endFrequency, holes, lipCoverPercent = 0 } = params;
    
    const holeCount = holes.length;
    const adjEmbDiameter = embouchureDiameter * (1 - 0.01 * lipCoverPercent);
    
    if (embouchureDiameter > boreDiameter * 0.9) {
        throw new Error('Embouchure diameter too large relative to bore diameter');
    }
    
    for (const hole of holes) {
        if (hole.diameter > boreDiameter * 0.9) {
            throw new Error('Hole diameter too large relative to bore diameter');
        }
    }
    
    let endX = SPEED_OF_SOUND_MM_S * 0.5 / endFrequency;
    endX = endX - endCorr(boreDiameter);
    
    for (let i = 0; i < holeCount; i++) {
        endX = endX - closedFHCorr(wallThickness, holes[i].diameter, boreDiameter);
    }
    
    const fhXs: number[] = new Array(holeCount);
    
    let halfWl = SPEED_OF_SOUND_MM_S * 0.5 / holes[0].frequency;
    for (let i = 1; i < holeCount; i++) {
        halfWl -= closedFHCorr(wallThickness, holes[i].diameter, boreDiameter);
    }
    
    const fhBorRatio = holes[0].diameter / boreDiameter;
    const a = fhBorRatio * fhBorRatio;
    const b = -(endX + halfWl) * a;
    const c = endX * halfWl * a + effWalW(wallThickness, holes[0].diameter) * (halfWl - endX);
    fhXs[0] = (-b - Math.sqrt(b * b - 4 * a * c)) / (2 * a);
    
    for (let holeNum = 1; holeNum < holeCount; holeNum++) {
        halfWl = 0.5 * SPEED_OF_SOUND_MM_S / holes[holeNum].frequency;
        
        if (holeNum < holeCount - 1) {
            for (let i = holeNum + 1; i < holeCount; i++) {
                halfWl -= closedFHCorr(wallThickness, holes[i].diameter, boreDiameter);
            }
        }
        
        const a = 2;
        const borFhRatio = boreDiameter / holes[holeNum].diameter;
        const holeCalc = effWalW(wallThickness, holes[holeNum].diameter) * borFhRatio * borFhRatio;
        const b = -fhXs[holeNum - 1] - 3 * halfWl + holeCalc;
        const c = fhXs[holeNum - 1] * (halfWl - holeCalc) + (halfWl * halfWl);
        fhXs[holeNum] = (-b - Math.sqrt(b * b - 4 * a * c)) / (2 * a);
    }
    
    const embX = embCorr(boreDiameter, adjEmbDiameter, wallThickness);
    const embouchurePhysicalPosition = endX - embX;
    
    const calculatedHoles: FluteHole[] = holes.map((hole, i) => {
        const fhXsDiff = i === 0 ? endX - fhXs[0] : fhXs[i - 1] - fhXs[i];
        const spacing = fhXsDiff;
        const cutoff = cutoffForHole(i, boreDiameter, wallThickness, hole.diameter, fhXsDiff);
        
        return {
            frequency: hole.frequency,
            diameter: hole.diameter,
            acousticPosition: fhXs[i],
            physicalPosition: endX - fhXs[i],
            cutoffFrequency: cutoff,
            spacing
        };
    });
    
    return {
        embouchurePhysicalPosition,
        holes: calculatedHoles,
        acousticEndX: endX
    };
}

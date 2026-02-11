import { makeCylinder, drawEllipse } from "replicad";
import type { Solid } from "replicad";
import type { FluteParameters, ToneHoleParameters } from "../../stores/fluteStore";
import { resolveComputedParameter } from '$lib/components/generation/generation-steps/designParametersDefault';

export interface FluteCADResult {
	full: Solid;
	parts?: Solid[];
}

function createEllipticalHole(lengthX: number, widthY: number, depth: number): Solid {
	const majorRadius = Math.max(lengthX, widthY) / 2;
	const minorRadius = Math.min(lengthX, widthY) / 2;

	return drawEllipse(majorRadius, minorRadius)
		.sketchOnPlane("XY")
		.extrude(depth) as Solid;
}

class FluteCADBuilder {
	private flute: Solid;
	private fluteParams: FluteParameters;
	private toneHoleParams: ToneHoleParameters;
	private innerRadius: number;
	private outerRadius: number;
	private fluteLength: number;
	private holePositions: number[] = [];

	constructor(fluteParams: FluteParameters, toneHoleParams: ToneHoleParameters) {
		this.fluteParams = fluteParams;
		this.toneHoleParams = toneHoleParams;
		this.innerRadius = fluteParams.boreDiameter / 2;
		this.outerRadius = this.innerRadius + fluteParams.wallThickness;
		this.fluteLength = fluteParams.fluteLength;
		this.flute = makeCylinder(this.outerRadius, this.fluteLength);
	}

	private createMainBore(): void {
		const corkThickness = resolveComputedParameter("corkThickness", this.fluteParams);
		const corkDistance = resolveComputedParameter("corkDistance", this.fluteParams);
		const embouchureDistance = this.fluteParams.embouchureDistance;
		const overhang = this.fluteParams.overhangLength;

		const corkStart = embouchureDistance + corkDistance;
		const corkEnd = corkStart + corkThickness;
		const overhangStart = corkEnd + overhang;

		const bore1Length = corkStart;
		if (bore1Length > 0) {
			const bore1 = makeCylinder(this.innerRadius, bore1Length);
			this.flute = this.flute.cut(bore1);
		}

		const bore2Length = overhangStart - corkEnd;
		if (bore2Length > 0) {
			const bore2 = makeCylinder(this.innerRadius, bore2Length).translate([
				0,
				0,
				corkEnd,
			]);
			this.flute = this.flute.cut(bore2);
		}
	}

	private cutEmbouchureHole(): void {
		const embouchureDepth = this.fluteParams.wallThickness * 2 + 1;
		const embouchureHole = createEllipticalHole(
			this.fluteParams.embouchureHoleLength,
			this.fluteParams.embouchureHoleWidth,
			embouchureDepth
		)
			.rotate(90, [0, 0, 0], [1, 0, 0])
			.translate([0, this.outerRadius, this.fluteParams.embouchureDistance]);

		this.flute = this.flute.cut(embouchureHole);
	}

	private cutToneHoles(): void {
		for (let i = 0; i < this.fluteParams.numberOfToneHoles; i++) {
			const holeDiameter = this.toneHoleParams.holeDiameters[i] || 0;
			const holeDistance = this.toneHoleParams.holeDistances[i] || 0;

			if (holeDiameter > 0 && holeDistance > 0 && holeDistance < this.fluteLength) {
				const holeRadius = holeDiameter / 2;
				const holeDepth = this.fluteParams.wallThickness * 2 + 1;

				const toneHole = makeCylinder(holeRadius, holeDepth)
					.rotate(90, [0, 0, 0], [1, 0, 0])
					.translate([0, this.outerRadius, holeDistance]);

				this.flute = this.flute.cut(toneHole);
				this.holePositions.push(holeDistance);
			}
		}
	}

	private cutThumbHole(): void {
		const enableThumbHole = this.fluteParams.hasThumbHole && this.fluteParams.numberOfToneHoles >= 2;
		if (!enableThumbHole) return;

		const lastHoleDistance =
			this.toneHoleParams.holeDistances[this.fluteParams.numberOfToneHoles - 1] || 0;
		const secondLastHoleDistance =
			this.toneHoleParams.holeDistances[this.fluteParams.numberOfToneHoles - 2] || 0;
		const thumbHoleDistance = (lastHoleDistance + secondLastHoleDistance) / 2;

		if (thumbHoleDistance > 0 && thumbHoleDistance < this.fluteLength) {
			const thumbRadius = this.fluteParams.thumbHoleDiameter / 2;
			const thumbDepth = this.fluteParams.wallThickness * 2 + 1;

			const angleRad = (this.fluteParams.thumbHoleAngle * Math.PI) / 180;
			const yOffset = -Math.cos(angleRad) * this.outerRadius;
			const zOffset = -Math.sin(angleRad) * this.outerRadius;

			const thumbHole = makeCylinder(thumbRadius, thumbDepth)
				.rotate(90, [0, 0, 0], [1, 0, 0])
				.rotate(-this.fluteParams.thumbHoleAngle, [0, 0, 0], [0, 0, 1])
				.translate([zOffset, yOffset, thumbHoleDistance]);

			this.flute = this.flute.cut(thumbHole);
			this.holePositions.push(thumbHoleDistance);
		}
	}

	private filletHoles(): void {
		const filletRadius = this.fluteParams.toneHoleFilletRadius;
		const shouldFilletHoles = filletRadius > 0 && this.holePositions.length > 0;
		if (!shouldFilletHoles) return;

        
		try {
			this.flute = this.flute.fillet(filletRadius, (e) => 
				e.when((edge) => {
					try {
						const center = edge.center;
						if (!center) return false;
						
						const radialDist = Math.sqrt(center.x * center.x + center.y * center.y);
						const isOuterSurface = Math.abs(radialDist - this.outerRadius) < 0.1;
						
						const isAtHolePosition = this.holePositions.some(
							pos => Math.abs(center.z - pos) < 2
						);

						return isOuterSurface && isAtHolePosition;
					} catch (edgeError) {
						console.error('Error filtering edge:', edgeError);
						return false;
					}
				})
			);
		} catch (filletError) {
			console.warn('Could not apply fillet to tone holes:', filletError);
		}
	}

	private cutIntoParts(): Solid[] {
		const { numberOfCuts, cutDistances, connectorLength, wallThickness, boreDiameter } = this.fluteParams;
		
		if (numberOfCuts === 0 || cutDistances.length === 0) {
			return [this.flute];
		}

		const parts: Solid[] = [];
		const connectorRadius = wallThickness / 2 + boreDiameter / 2;
		const sortedCutDistances = [...cutDistances].sort((a, b) => a - b);

		let currentStart = 0;
    
		for (let i = 0; i < sortedCutDistances.length; i++) {
			const cutPosition = sortedCutDistances[i];

            let isValidCut = cutPosition > currentStart && cutPosition < this.fluteLength;
			if (!isValidCut) {
				continue;
			}

			const partLength = cutPosition - currentStart;
			const includeRegion = makeCylinder(this.outerRadius, partLength).translate([
				0,
				0,
				currentStart,
			]);

			let part = this.flute.intersect(includeRegion) as Solid;
			const connector = makeCylinder(connectorRadius, connectorLength)
                .translate([0,0,cutPosition])
                .cut(makeCylinder(this.innerRadius, connectorLength).translate([0, 0, cutPosition]));

            // Cut connector cavity if this is not the first part
            const needsCavity = i > 0;
            if (needsCavity) {
                const cutTool = makeCylinder(this.innerRadius + wallThickness / 2, connectorLength).translate([0, 0, currentStart]);
                part = part.cut(cutTool);
            }

			part = part.fuse(connector);
			parts.push(part);
			currentStart = cutPosition;
		}

        // let partRemaining = currentStart < this.fluteLength;
        // if (!partRemaining) return parts;

        const finalLength = this.fluteLength - currentStart;
        const includeRegion = makeCylinder(this.outerRadius, finalLength)
            .translate([0, 0, currentStart]);

        let finalPart = this.flute.intersect(includeRegion) as Solid;
        const cutTool = makeCylinder(connectorRadius, connectorLength).translate([0, 0, currentStart]);

        finalPart = finalPart.cut(cutTool);

        parts.push(finalPart);
		

		return parts;
	}

	private centerAndRotate(solid: Solid): Solid {
		let centered = solid.translate([0, 0, -this.fluteLength / 2]);
		return centered.rotate(90, [0, 0, 0], [0, 1, 0]);
	}

	public build(): FluteCADResult {
		this.createMainBore();
		this.cutEmbouchureHole();
		this.cutToneHoles();
		this.cutThumbHole();
		this.filletHoles();

		const parts = this.cutIntoParts();
		
        const centeredFlute = this.centerAndRotate(this.flute);

		if (parts.length > 1) {
			const centeredParts = parts.map(part => this.centerAndRotate(part));
			return { full: centeredFlute, parts: centeredParts };
		} else {
			return { full: centeredFlute };
		}
	}
}

export function createFluteCAD(fluteParams: FluteParameters, toneHoleParams: ToneHoleParameters): FluteCADResult {
	const builder = new FluteCADBuilder(fluteParams, toneHoleParams);
	return builder.build();
}

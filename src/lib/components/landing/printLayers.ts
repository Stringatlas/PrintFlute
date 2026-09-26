export interface PrintDemoParams {
	boreDiameter?: number;
	wallThickness?: number;
	holeCount?: number;
}

export interface Interval {
	x0: number;
	x1: number;
}

export interface PrintLayer {
	y: number;
	segments: Interval[];
}

export interface FluteProfile {
	xHead: number;
	xFoot: number;
	centerY: number;
	outerRadius: number;
	innerRadius: number;
	embouchure: { x: number; y: number; rx: number; ry: number };
	holes: Array<{ x: number; y: number; r: number }>;
}

export const PRINT_VIEW = {
	width: 800,
	height: 360,
	bedY: 300,
	marginX: 48
} as const;

const SAMPLE_COUNT = 360;

export function createFluteProfile(params: PrintDemoParams): FluteProfile {
	const boreDiameter = params.boreDiameter ?? 14.3;
	const wallThickness = params.wallThickness ?? 2.5;
	const holeCount = params.holeCount ?? 6;
	const scale = 2.55;
	const outerRadius = ((boreDiameter + wallThickness * 2) / 2) * scale;
	const innerRadius = Math.max(4, (boreDiameter / 2) * scale * 0.72);
	const length = 268 * scale;
	const xHead = PRINT_VIEW.marginX;
	const xFoot = Math.min(xHead + length, PRINT_VIEW.width - PRINT_VIEW.marginX);
	const centerY = PRINT_VIEW.bedY - outerRadius - 8;

	const embouchureX = xHead + 52;
	const holeStart = embouchureX + 70;
	const holeEnd = xFoot - 48;
	const holeSpan = Math.max(holeEnd - holeStart, 1);
	const holes = Array.from({ length: holeCount }, (_, index) => {
		const t = holeCount === 1 ? 0.5 : index / (holeCount - 1);
		const r = 5.2 + (index % 3) * 0.6;
		return {
			x: holeStart + t * holeSpan,
			y: centerY - outerRadius + r * 0.35,
			r
		};
	});

	return {
		xHead,
		xFoot,
		centerY,
		outerRadius,
		innerRadius,
		embouchure: {
			x: embouchureX,
			y: centerY - outerRadius + 7,
			rx: 11,
			ry: 8
		},
		holes
	};
}

function inStadium(x: number, y: number, x0: number, x1: number, cy: number, radius: number): boolean {
	if (radius <= 0) return false;
	const innerStart = x0 + radius;
	const innerEnd = x1 - radius;
	if (x >= innerStart && x <= innerEnd) {
		return Math.abs(y - cy) <= radius;
	}
	const capX = x < innerStart ? innerStart : innerEnd;
	const dx = x - capX;
	const dy = y - cy;
	return dx * dx + dy * dy <= radius * radius;
}

function inEllipse(x: number, y: number, cx: number, cy: number, rx: number, ry: number): boolean {
	const nx = (x - cx) / rx;
	const ny = (y - cy) / ry;
	return nx * nx + ny * ny <= 1;
}

function isSolid(x: number, y: number, profile: FluteProfile): boolean {
	if (!inStadium(x, y, profile.xHead, profile.xFoot, profile.centerY, profile.outerRadius)) {
		return false;
	}
	if (inEllipse(x, y, profile.embouchure.x, profile.embouchure.y, profile.embouchure.rx, profile.embouchure.ry)) {
		return false;
	}
	return !profile.holes.some((hole) => {
		const dx = x - hole.x;
		const dy = y - hole.y;
		return dx * dx + dy * dy <= hole.r * hole.r;
	});
}

function collapseSamples(xs: number[], solid: boolean[]): Interval[] {
	const segments: Interval[] = [];
	let start = -1;

	for (let i = 0; i < solid.length; i++) {
		if (solid[i] && start === -1) start = i;
		if (start !== -1 && (!solid[i] || i === solid.length - 1)) {
			const end = solid[i] && i === solid.length - 1 ? i : i - 1;
			const x0 = xs[start];
			const x1 = xs[end];
			if (x1 - x0 > 1.2) segments.push({ x0, x1 });
			start = -1;
		}
	}

	return segments;
}

export function buildPrintLayers(params: PrintDemoParams, layerCount = 52): PrintLayer[] {
	const profile = createFluteProfile(params);
	const top = profile.centerY - profile.outerRadius;
	const bottom = profile.centerY + profile.outerRadius;
	const xs = Array.from({ length: SAMPLE_COUNT }, (_, i) => {
		const t = i / (SAMPLE_COUNT - 1);
		return profile.xHead - 8 + t * (profile.xFoot - profile.xHead + 16);
	});

	const layers: PrintLayer[] = [];
	for (let i = 0; i < layerCount; i++) {
		const y = bottom - ((i + 0.5) / layerCount) * (bottom - top);
		const solid = xs.map((x) => isSolid(x, y, profile));
		const segments = collapseSamples(xs, solid);
		if (segments.length > 0) layers.push({ y, segments });
	}
	return layers;
}

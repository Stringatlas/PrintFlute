import type { FluteParameters, ToneHoleParameters } from '$lib/stores/fluteStore';
import type { DesignStep } from '$lib/stores/uiStore';
import { createHeadJointGeometry } from '$lib/geometry/preview/headjointGeometry';
import { createFullFluteGeometry } from '$lib/geometry/preview/fullFluteGeometry';
import { createPrintingFluteGeometry } from '$lib/geometry/preview/printingFluteGeometry';

export function createGeometryForStep(
	step: DesignStep,
	fluteParams: FluteParameters,
	toneHoleParams: ToneHoleParameters
) {
	switch (step) {
		case 1:
			return createHeadJointGeometry(fluteParams);
		case 2:
			return createFullFluteGeometry(fluteParams, toneHoleParams);
		case 3:
			return createPrintingFluteGeometry(fluteParams, toneHoleParams);
		default:
			return createHeadJointGeometry(fluteParams);
	}
}

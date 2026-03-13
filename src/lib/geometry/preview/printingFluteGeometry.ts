import * as THREE from 'three';
import type { FluteParameters, ToneHoleParameters } from '../../stores/fluteStore';
import { createFullFluteGeometry } from './fullFluteGeometry';
import { addLabel } from './sceneAnnotations';
import { createCutLineMaterial, createConnectorMaterial } from './materials';
import { createTubeGeometry } from '../utils/createTubeGeometry';

// TODO: Visualize fillet on three.js scene
interface PrintingFluteGeometryResult {
	group: THREE.Group;
	dispose: () => void;
}

export function createPrintingFluteGeometry(
	fluteParams: FluteParameters,
	toneHoleParams: ToneHoleParameters
): PrintingFluteGeometryResult {
	const result = createFullFluteGeometry(fluteParams, toneHoleParams);
	const group = result.group;
	
	const geometries: THREE.BufferGeometry[] = [];
	const materials: THREE.Material[] = [];
	const labelDisposers: (() => void)[] = [];
	
	const cutLineMaterial = createCutLineMaterial();
	materials.push(cutLineMaterial);
	
	const connectorMaterial = createConnectorMaterial();
	materials.push(connectorMaterial);
	
	const outerRadius = fluteParams.boreDiameter / 2 + fluteParams.wallThickness;
	const centerOffset = -fluteParams.fluteLength / 2;
	const tubeRadius = 0.5;
	const connectorLength = fluteParams.connectorLength;
	const connectorInnerRadius = fluteParams.boreDiameter / 2;
	
	fluteParams.cutDistances.forEach((cutDistance, index) => {
		if (cutDistance > 0 && cutDistance < fluteParams.fluteLength) {
			const circlePoints: THREE.Vector3[] = [];
			for (let i = 0; i <= 64; i++) {
				const angle = (i / 64) * Math.PI * 2;
				circlePoints.push(new THREE.Vector3(
					centerOffset + cutDistance,
					outerRadius * Math.cos(angle),
					outerRadius * Math.sin(angle)
				));
			}
			
			const curve = new THREE.CatmullRomCurve3(circlePoints);
			const tubeGeometry = new THREE.TubeGeometry(curve, 64, tubeRadius, 8, true);
			const tubeMesh = new THREE.Mesh(tubeGeometry, cutLineMaterial);
			group.add(tubeMesh);
			geometries.push(tubeGeometry);
			
			// Connector zones on either side of cut
			const connectorRadius = outerRadius + 0.1;
			
			// Left connector zone
			// const leftConnectorGeometry = new THREE.CylinderGeometry(
			// 	connectorRadius,
			// 	connectorRadius,
			// 	connectorLength,
			// 	32
			// );
			// leftConnectorGeometry.rotateZ(Math.PI / 2);
			// leftConnectorGeometry.translate(centerOffset + cutDistance - connectorLength / 2, 0, 0);
			// const leftConnectorMesh = new THREE.Mesh(leftConnectorGeometry, connectorMaterial);
			// group.add(leftConnectorMesh);
			// geometries.push(leftConnectorGeometry);
			
			// Right connector zone
			const rightConnectorGeometry = createTubeGeometry({
				outerRadius: connectorRadius,
				innerRadius: outerRadius - 0.1,
				length: connectorLength,
				axis: 'x',
				center: new THREE.Vector3(centerOffset + cutDistance + connectorLength / 2, 0, 0)
			});
			const rightConnectorMesh = new THREE.Mesh(rightConnectorGeometry, connectorMaterial);
			group.add(rightConnectorMesh);
			geometries.push(rightConnectorGeometry);
			
			const spriteWidth = 20;
			const zOffset = outerRadius + spriteWidth / 2 + 5;
			const label = addLabel(group, `Cut ${index + 1}`, {
				x: centerOffset + cutDistance,
				y: 0,
				z: zOffset
			});
			labelDisposers.push(label.dispose);
		}
	});
	
	const dispose = () => {
		result.dispose();
		geometries.forEach(geom => geom.dispose());
		materials.forEach(mat => mat.dispose());
		labelDisposers.forEach(fn => fn());
	};
	
	return { group, dispose };
}

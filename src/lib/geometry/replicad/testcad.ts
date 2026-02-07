// @ts-nocheck
import { draw, makeCylinder } from "replicad";
import type { Solid } from "replicad";

export function createBox(
  width = 30,
  height = 20,
  depth = 40,
  fillet = 3
): Solid {
  let box = draw()
    .hLine(width)
    .vLine(depth)
    .hLine(-width)
    .close()
    .sketchOnPlane()
    .extrude(height);

  if (fillet > 0) box = box.fillet(fillet);
  return box;
}

export function createCylinder(radius = 15, height = 50): Solid {
  return makeCylinder(radius, height);
}

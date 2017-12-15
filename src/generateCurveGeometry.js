import * as THREE from 'three';

export function generateCurveGeometry(start, end, userHeight) {
  const lineGeometry = new THREE.Geometry();
  const startVector = new THREE.Vector3(start.x, start.y, start.z);

  const variance = 1.0;
  const middleVector = new THREE.Vector3(
    startVector.x + ((end.x - startVector.x) / 2) + (Math.random() * variance),
    startVector.y + ((end.y - startVector.y) / 2) + (userHeight / 3) + (Math.random() * variance),
    startVector.z + ((end.z - startVector.z) / 2) + (Math.random() * variance),
  );

  const endVector = new THREE.Vector3(end.x, end.y, end.z);
  const curveQuad = new THREE.QuadraticBezierCurve3(startVector, middleVector, endVector);
  const curvePath = new THREE.CurvePath();
  curvePath.add(curveQuad);
  curvePath.getPoints(18).forEach((p) => {
    lineGeometry.vertices.push(p);
  });
  return lineGeometry;
}

export default generateCurveGeometry;

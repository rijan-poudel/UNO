// DOM measurements shared by held-card gestures and snapshot presentation.
import type { CardPose } from './cardMotion';

export function readCardPose(
  element: HTMLElement,
): CardPose & { height: number } {
  const rect = element.getBoundingClientRect();
  let angle = 0;
  let scale = 1;
  for (
    let node: HTMLElement | null = element;
    node;
    node = node.parentElement
  ) {
    const transform = getComputedStyle(node).transform;
    if (transform !== 'none') {
      const matrix = new DOMMatrixReadOnly(transform);
      angle += Math.atan2(matrix.b, matrix.a) * (180 / Math.PI);
      scale *= Math.hypot(matrix.a, matrix.b);
    }
  }
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
    width: element.offsetWidth * scale,
    height: element.offsetHeight * scale,
    angle,
  };
}

// Decorative motion copies must not share SVG definition IDs with live cards.
let copySequence = 0;

export function cloneCardElement(element: HTMLElement): HTMLElement {
  const clone = element.cloneNode(true) as HTMLElement;
  const nodes = [clone, ...clone.querySelectorAll('*')];
  const ids = new Map<string, string>();
  const prefix = `card-copy-${++copySequence}-`;
  for (const node of nodes) {
    const id = node.getAttribute('id');
    if (!id) continue;
    const replacement = `${prefix}${ids.size}`;
    ids.set(id, replacement);
    node.setAttribute('id', replacement);
  }
  if (!ids.size) return clone;
  for (const node of nodes) {
    for (const attribute of Array.from(node.attributes)) {
      // Keep external images/URLs intact and preserve namespaced SVG attributes.
      let value = attribute.value.replace(
        /url\(\s*(['"]?)#([^\s'")]+)\1\s*\)/g,
        (reference, _quote: string, id: string) =>
          ids.has(id) ? `url(#${ids.get(id)})` : reference,
      );
      if (attribute.name === 'href' || attribute.name === 'xlink:href') {
        const replacement = ids.get(value.slice(1));
        if (value.startsWith('#') && replacement) value = `#${replacement}`;
      }
      if (value !== attribute.value) attribute.value = value;
    }
  }
  return clone;
}

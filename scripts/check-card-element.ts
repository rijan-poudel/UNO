// Exercise decorative clones without installing a DOM or a test framework.
import assert from 'node:assert/strict';
import { cloneCardElement } from '../lib/cardElement';

class TestElement {
  attributes: { name: string; value: string }[];
  constructor(
    attrs: Record<string, string> = {},
    public children: TestElement[] = [],
  ) {
    this.attributes = Object.entries(attrs).map(([name, value]) => ({
      name,
      value,
    }));
  }
  getAttribute(name: string): string | null {
    return (
      this.attributes.find((attribute) => attribute.name === name)?.value ??
      null
    );
  }
  setAttribute(name: string, value: string): void {
    const attribute = this.attributes.find((entry) => entry.name === name);
    if (attribute) attribute.value = value;
    else this.attributes.push({ name, value });
  }
  cloneNode(deep: boolean): TestElement {
    return new TestElement(
      Object.fromEntries(
        this.attributes.map(({ name, value }) => [name, value]),
      ),
      deep ? this.children.map((child) => child.cloneNode(true)) : [],
    );
  }
  querySelectorAll(selector: string): TestElement[] {
    assert.equal(selector, '*');
    return this.children.flatMap((child) => [
      child,
      ...child.querySelectorAll('*'),
    ]);
  }
}
const defs = new TestElement({}, [
  new TestElement({ id: 'mask:one' }),
  new TestElement({ id: 'filter.one' }),
  new TestElement({ id: 'mask-two', mask: 'url(#mask:one)' }),
]);
const drawing = new TestElement(
  {
    mask: "url( '#mask:one' )",
    filter: 'url(#filter.one)',
    style:
      'clip-path:url("#mask-two");fill:url(#external);stroke:url(https://example.com/art.svg#mask:one)',
  },
  [
    new TestElement({ href: '#mask-two', 'xlink:href': '#filter.one' }),
    new TestElement({ href: '/artwork/cards/color-roulette.webp' }),
  ],
);
const original = new TestElement({ id: 'card-root', 'data-card': 'example' }, [
  new TestElement({}, [defs, drawing]),
]);
const snapshot = JSON.stringify(original);
const copy = (node: TestElement) =>
  cloneCardElement(node as unknown as HTMLElement) as unknown as TestElement;
const first = copy(original);
const second = copy(original);
const third = copy(first);
const ids = (node: TestElement) =>
  [node, ...node.querySelectorAll('*')]
    .map((entry) => entry.getAttribute('id'))
    .filter((id): id is string => id !== null);
const allIds = [original, first, second, third].flatMap(ids);
assert.equal(
  new Set(allIds).size,
  allIds.length,
  'Original, simultaneous ghosts and re-cloned ghosts need disjoint IDs',
);
assert.equal(
  JSON.stringify(original),
  snapshot,
  'Cloning must not alter the live card',
);
assert.equal(first.getAttribute('data-card'), 'example');
const [copyDefs, copyDrawing] = first.children[0].children;
const maskId = copyDefs.children[0].getAttribute('id');
const filterId = copyDefs.children[1].getAttribute('id');
const secondMaskId = copyDefs.children[2].getAttribute('id');
assert.equal(
  copyDefs.children[2].getAttribute('mask'),
  `url(#${maskId})`,
  'Nested definitions retain local references',
);
assert.equal(copyDrawing.getAttribute('mask'), `url(#${maskId})`);
assert.equal(copyDrawing.getAttribute('filter'), `url(#${filterId})`);
assert.equal(
  copyDrawing.getAttribute('style'),
  `clip-path:url(#${secondMaskId});fill:url(#external);stroke:url(https://example.com/art.svg#mask:one)`,
);
assert.equal(copyDrawing.children[0].getAttribute('href'), `#${secondMaskId}`);
assert.equal(
  copyDrawing.children[0].getAttribute('xlink:href'),
  `#${filterId}`,
);
assert.equal(
  copyDrawing.children[1].getAttribute('href'),
  '/artwork/cards/color-roulette.webp',
);
const number = new TestElement({ class: 'number' }, [
  new TestElement({ 'data-value': '6' }),
]);
assert.deepEqual(
  copy(number),
  number,
  'Number cards without definitions keep their markup',
);
console.log(
  'Card clones passed: unique IDs, nested/quoted SVG references, namespaced links, external resources, live-card isolation and repeated copies.',
);

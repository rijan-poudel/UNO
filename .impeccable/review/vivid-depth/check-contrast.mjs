// Browser-independent ink checks at the smallest phone card size.
import assert from 'node:assert/strict';
function luminance(hex) {
  const rgb = hex.match(/../g).map(value => parseInt(value, 16) / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}
function contrast(a, b) {
  const pair = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (pair[0] + 0.05) / (pair[1] + 0.05);
}
function mix(base, overlay, alpha) {
  return base.match(/../g).map((value, i) => Math.round(parseInt(value, 16) * (1 - alpha) + parseInt(overlay.slice(i * 2, i * 2 + 2), 16) * alpha).toString(16).padStart(2, '0')).join('');
}
for (const [ink, field] of [['ffffff', 'df0735'], ['ffffff', '075bee'], ['00321e', '00bc68'], ['482f00', 'ffce00']]) {
  for (const overlay of ['ffffff', '000000']) {
    const ratio = contrast(ink, mix(field, overlay, 0.071));
    assert.ok(ratio >= 4.5, `${ink}/${field} gradient edge ${ratio.toFixed(2)}`);
  }
}
for (const [ink, field] of [['ffffff', 'e71c3b'], ['ffffff', 'da0d31'], ['ffffff', '1757df'], ['ffffff', '2167f0'], ['ffffff', '008749'], ['392700', 'ffd000']]) {
  assert.ok(contrast(ink, field) >= 4.5, `${ink}/${field} button contrast`);
}
console.log('Passed: small card indices at both laminate-gradient extremes, primary/online controls and color choices.');

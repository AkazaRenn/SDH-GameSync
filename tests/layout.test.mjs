import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import ts from 'typescript';

const read = file => readFileSync(fileURLToPath(new URL(`../${file}`, import.meta.url)), 'utf8');
const jsx = (type, props) => ({ type, props });
function renderPage() {
  const module = { exports: {} };
  const compiled = ts.transpileModule(read('src/components/scrollablePage.tsx'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(compiled, {
    module, exports: module.exports,
    require: id => {
      if (id === 'react/jsx-runtime') return { jsx, jsxs: jsx };
      if (id === '../helpers/commonDefs') return { CSS_BPM_TOP_BAR_HEIGHT: '40px', CSS_BPM_BOTTOM_BAR_HEIGHT: '40px' };
      throw new Error(`Unexpected runtime dependency: ${id}`);
    },
  });
  return module.exports.default({ title: 'Cloud provider', children: 'Provider controls' });
}

test('cloud route reserves top and bottom Steam bars and bounds its scrollport', () => {
  const tree = renderPage();
  assert.equal(tree.props.style.position, 'fixed');
  assert.equal(tree.props.style.top, '40px');
  assert.equal(tree.props.style.bottom, '40px');
  const [heading, content] = tree.props.children;
  assert.equal(heading.props.style.flexShrink, 0);
  assert.equal(content.props.style.minHeight, 0);
  assert.equal(content.props.style.overflowY, 'auto');
  assert.equal(content.props.children, 'Provider controls');
  assert.ok(parseInt(content.props.style.paddingBottom) > 0);
});

test('native focus scrolls the focused provider into the visible scrollport', () => {
  const content = renderPage().props.children[1];
  let requested;
  content.props.onFocusCapture({ target: { scrollIntoView: options => { requested = options; } } });
  assert.equal(requested.block, 'nearest');
  assert.equal(requested.inline, 'nearest');
});

test('only the standalone cloud route uses the viewport-bounded layout', () => {
  const source = read('src/pages/configCloudPage.tsx');
  assert.match(source, /import ScrollablePage from "\.\.\/components\/scrollablePage"/);
  assert.match(source, /<ScrollablePage title=/);
  assert.match(source, /<\/ScrollablePage>/);
  for (const file of ['src/components/pageView.tsx', 'src/pages/pluginLogsPage.tsx', 'src/pages/syncTargetConfigPage.tsx', 'src/pages/quickAccessMenu.tsx']) {
    assert.ok(!read(file).includes('scrollablePage'), file);
  }
});

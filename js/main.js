const selections = {
  top: {
    metaColorScheme: '',
    cssColorScheme: '',
  },
  nested: {
    metaColorScheme: '',
    cssColorScheme: '',
  },
};

function validateOptions (option) {
  switch (option) {
    case 'normal':
    case 'light dark':
    case 'dark light':
    case 'dark':
    case 'light':
    case '':
    case undefined:
      break;
    default:
      throw new Error('Invalid color scheme');
  }
}

function createDocument (options = {}) {
  validateOptions(options.metaColorScheme);
  validateOptions(options.cssColorScheme);

  return (
    `
<!DOCTYPE html>
<html lang="en-US">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  ${options.metaColorScheme ? `<meta name="color-scheme" content="${options.metaColorScheme}">` : '<!-- No <meta name="color-scheme"> -->'}
  <link rel="stylesheet" type="text/css" href="/css/main.css">
  <link rel="stylesheet" type="text/css" href="https://use.typekit.net/tju5uex.css">
</head>
<body style="${options.cssColorScheme ? `color-scheme:${options.cssColorScheme}` : ''}">
  <div class="flex">
    <div style="${globalThis.isNested ? '' : 'padding-top:3rem'}">
      <h3>${globalThis.isNested ? 'Nested' : 'Top'} Frame</h3>
      <color-settings></color-settings>
      <color-module></color-module>
    </div>
  ${!globalThis.isNested ?
`
    <div style="width: 100%">
      <iframe id="example-frame"></iframe>
    </div>
` : ''}
    <script>
      Object.defineProperty(globalThis, 'isNested', { value: true, writable: false });
      Object.defineProperty(globalThis, 'nestedOptions', { value: ${JSON.stringify(selections.nested)}, writable: false });
    </script>
    <script async src="/js/main.js"></script>
  </div>
</body>
</html>
`
  );
}

const frame = document.getElementById('example-frame');

function handleSelection (id, updater) {
  const selectElement = document.getElementById(id);
  updater(selectElement.value);
  selectElement.addEventListener('change', (event) => {
    updater(event.target.value);
    if (frame) {
      frame.srcdoc = createDocument(selections.top);
    }
  });
}

if (globalThis.isNested) {
  function resize () {
    const height = document.body.offsetHeight + 20;
    window.parent.postMessage(`h:${height}`);
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(document.body);
  resize();
} else {
  // Listen to events on controls
  handleSelection('topMetaSelect', (value) => selections.top.metaColorScheme = value);
  handleSelection('topCssSelect', (value) => selections.top.cssColorScheme = value);
  handleSelection('nestedMetaSelect', (value) => selections.nested.metaColorScheme = value);
  handleSelection('nestedCssSelect', (value) => selections.nested.cssColorScheme = value);
}

if (frame) {
  frame.srcdoc = createDocument(globalThis.nestedOptions ?? selections.top);
  window.addEventListener('message', ({ data }) => {
    const [, height] = /h:(\d+)/.exec(data);
    if (height) {
      frame.style.height = `${height}px`;
    }
  });
}

class ColorModuleElement extends HTMLElement {
  constructor () {
    super();
    this.innerHTML = `
      <figure>
        <div class="color-module">
          <button class="unstyled">Unstyled Button</button>
          <button class="styled">Scheme:</button>
        </div>
      </figure>
      `;
  }
}

class ColorSettingsElement extends HTMLElement {
  constructor () {
    super();
    const cssColorScheme = window.getComputedStyle(this)['color-scheme'];
    const metaColorScheme = document.querySelector('meta[name=color-scheme]')?.getAttribute('content');
    this.innerHTML = `
      <figure class="legible">
        <h5>Page Settings</h5>
        <table>
          <tr>
            <td>Meta</td>
            <td>${(metaColorScheme && `<code>content="${metaColorScheme}"</code>`) ?? '<em class="smol">default</em> <code>normal</code>'}</td>
          </tr>
          <tr>
            <td>CSS</td>
            <td><code>color-scheme: ${cssColorScheme}</code></td>
          </tr>
        </table>
      </figure>
      `;
  }
}

customElements.define('color-module', ColorModuleElement);
customElements.define('color-settings', ColorSettingsElement);

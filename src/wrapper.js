import { createElement, render } from 'preact'; /** @jsx createElement */
import Autocomplete from './autocomplete';

let renderer = null;
let observer = null;

function accessibleAutocomplete(options) {
  let currentOptions = { ...options };
  if (!currentOptions.element) {
    throw new Error('element is not defined');
  }
  if (!currentOptions.id) {
    throw new Error('id is not defined');
  }
  if (!currentOptions.source) {
    throw new Error('source is not defined');
  }
  if (Array.isArray(currentOptions.source)) {
    currentOptions.source = createSimpleEngine(currentOptions.source);
  }

  renderer = render(<Autocomplete {...currentOptions} />, currentOptions.element);

  if (typeof currentOptions.selectElement === 'undefined') {
    return renderer;
  }

  // create MutationObserver and re-render <Autocomplete />
  observer = new MutationObserver(mutationsList => {
    for (const mutation of mutationsList) {
      if (mutation.type == 'childList') {
        currentOptions.source = createSimpleEngine(getSourceArray(currentOptions));
      }
      if (mutation.type == 'attributes') {
        currentOptions.inputClassName = mutation.target.classList;
      }
    }
    render(<Autocomplete {...currentOptions} />, currentOptions.element, renderer);
  });

  observer.observe(currentOptions.selectElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class'],
  });

  return {
    setOptions: (newOptions) => {
      const mergedOptions = {...currentOptions, ...newOptions};
      currentOptions = mergedOptions;
      render(<Autocomplete {...mergedOptions} />, mergedOptions.element, renderer);
    }
  }
}

const createSimpleEngine = values => (query, syncResults) => {
  const matches = values.filter(
    r => r.toLowerCase().indexOf(query.toLowerCase()) !== -1
  );
  syncResults(matches);
};

const getSourceArray = configurationOptions => {
  let availableOptions = [].filter.call(
    configurationOptions.selectElement.options,
    option => option.value || configurationOptions.preserveNullOptions
  );
  return availableOptions.map(option => option.textContent || option.innerText);
};

accessibleAutocomplete.enhanceSelectElement = configurationOptions => {
  if (!configurationOptions.selectElement) {
    throw new Error('selectElement is not defined');
  }
  // Set defaults.
  if (!configurationOptions.source) {
    configurationOptions.source = getSourceArray(configurationOptions);
  }
  configurationOptions.onConfirm =
    configurationOptions.onConfirm ||
    (query => {
      const requestedOption = [].filter.call(
        configurationOptions.selectElement.options,
        option => (option.textContent || option.innerText) === query
      )[0];
      if (requestedOption) {
        requestedOption.selected = true;
      }
    });

  if (
    configurationOptions.selectElement.value ||
    configurationOptions.defaultValue === undefined
  ) {
    const option =
      configurationOptions.selectElement.options[
        configurationOptions.selectElement.options.selectedIndex
      ];
    if (option) {
      configurationOptions.defaultValue =
        option.textContent || option.innerText;
    }
  }

  if (configurationOptions.name === undefined) configurationOptions.name = '';
  if (configurationOptions.id === undefined) {
    if (configurationOptions.selectElement.id === undefined) {
      configurationOptions.id = '';
    } else {
      configurationOptions.id = configurationOptions.selectElement.id;
    }
  }
  if (configurationOptions.autoselect === undefined)
    configurationOptions.autoselect = true;

  configurationOptions.inputClassName =
    configurationOptions.selectElement.className;

  const element = document.createElement('span');

  element.classList.add('autocomplete__enhanced-select');

  configurationOptions.selectElement.parentNode.insertBefore(
    element,
    configurationOptions.selectElement
  );


  configurationOptions.selectElement.style.display = 'none';
  configurationOptions.selectElement.id =
    configurationOptions.selectElement.id + '-select';

  return accessibleAutocomplete({
    ...configurationOptions,
    element: element
  });
};

accessibleAutocomplete.destroy = () => {
  if (observer) observer.disconnect();
};

export default accessibleAutocomplete;

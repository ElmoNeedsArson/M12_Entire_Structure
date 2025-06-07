const AVRJS8_EDITOR_HISTORY = 'AVRJS8_EDITOR_HISTORY';

const EditorHistoryUtil = {
  hasLocalStorage: typeof window.localStorage !== 'undefined',

  storeSnippet: function(codeSnippet) {
    if (!this.hasLocalStorage) return;
    window.localStorage.setItem(AVRJS8_EDITOR_HISTORY, codeSnippet);
  },

  clearSnippet: function() {
    if (!this.hasLocalStorage) return;
    window.localStorage.removeItem(AVRJS8_EDITOR_HISTORY);
  },

  getValue: function() {
    if (!this.hasLocalStorage) return null;
    return window.localStorage.getItem(AVRJS8_EDITOR_HISTORY);
  }
};

// Export the object to be used in other modules
export default EditorHistoryUtil;

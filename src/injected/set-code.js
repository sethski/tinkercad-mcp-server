((next) => {
  const cmHost = document.querySelector(".CodeMirror");
  if (cmHost && cmHost.CodeMirror) {
    cmHost.CodeMirror.setValue(next);
    return "codemirror";
  }
  const aceEl = document.querySelector(".ace_editor");
  if (aceEl && aceEl.env && aceEl.env.editor) {
    aceEl.env.editor.setValue(next, -1);
    return "ace";
  }
  const textarea = document.querySelector("#CODE_EDITOR_ID textarea, .code_panel textarea");
  if (textarea) {
    textarea.focus();
    textarea.value = next;
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    textarea.dispatchEvent(new Event("change", { bubbles: true }));
    return "textarea";
  }
  return "";
})
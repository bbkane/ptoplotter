let editor = CodeMirror.fromTextArea(document.getElementById("code"), {
  lineNumbers: true,
  tabMode: "indent"
});

editor.on('change', function(cm) {
  let doc = jsyaml.load(cm.getValue());
  console.log(doc);
});
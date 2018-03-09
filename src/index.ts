// https://discuss.codemirror.net/t/cannot-get-codemirror-to-work-when-using-require/763/5
require("codemirror/mode/yaml/yaml");
var CodeMirror = require("codemirror");
var jsyaml = require('js-yaml');
var Plotly = require('./custom-plotly'); // Holy crap, using a custom plotly means -4.26MB...

import * as ptolib from './ptolib';

function updateGraph(code_mirror_instance) {
  let doc: ptolib.EditorInfo = jsyaml.safeLoad(code_mirror_instance.getValue());
  let plotlyJSON: ptolib.Plot[] = ptolib.docToPlotlyJSON(doc);
  // let plotlyJSON: ptolib.Plot[] = ptolib.docToPlotlyJSONOld(doc);
  // console.log(plotlyJSON);
  Plotly.newPlot('result', plotlyJSON);
}

const startYAML = `--- # PDO
start_date: 2018-01-01
end_date: 2018-12-31
start_hours: 40
hour_markers:
- label: 40 hr buffer
  hours: 40
repeating_changes:
- day_of_month: 15
  hour_change: 12.67
one_day_changes:
# Acxiom holidays
- date: 2018-01-01  # New Year's Day (Observed)
  hour_change: 0
- date: 2018-02-19  # Presidents' Day
  hour_change: 0
- date: 2018-05-28  # Memorial Day
  hour_change: 0
- date: 2018-07-04  # Independence Day
  hour_change: 0
- date: 2018-09-03  # Labor Day
  hour_change: 0
- date: 2018-11-22  # Thanksgiving
  hour_change: 0
- date: 2018-11-23  # Day After Thanksgiving
  hour_change: 0
- date: 2018-12-24  # Christmas Eve (Observed)
  hour_change: 0
- date: 2018-12-25  # Christmas Day
  hour_change: 0
ranged_changes:
# Example ranged vacation
- start_date: 2018-05-01
  end_date: 2018-05-08
  hour_change: 0`;

// https://stackoverflow.com/a/38075603/2958070
window.addEventListener('load', function() {
  // The 'value' arg in the CodeMirror constructor isn't working, so let's
  // hack it in...
  document.getElementById('source').innerHTML = startYAML;

  let editor = CodeMirror.fromTextArea(document.getElementById("source"), {
    lineNumbers: true,
    tabMode: "indent"
  });

  editor.on('change', updateGraph);
  updateGraph(editor);
});

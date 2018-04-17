// https://discuss.codemirror.net/t/cannot-get-codemirror-to-work-when-using-require/763/5
require("codemirror/mode/yaml/yaml");
var CodeMirror = require("codemirror");
var jsyaml = require('js-yaml');
var Plotly = require('./custom-plotly'); // Holy crap, using a custom plotly means -4.26MB...

import * as ptolib from './ptolib';

function updateGraph(code_mirror_instance) {
  let doc: ptolib.EditorInfo = jsyaml.safeLoad(code_mirror_instance.getValue());
  // If there's no start date, use today
  if (!doc.start_date) {
    doc.start_date = new Date();
    // zero out hours, min, ...
    doc.start_date.setHours(0, 0, 0, 0);
  }
  // console.log(doc);
  const allDays: Date[] = ptolib.makeSequentialDateArray(doc.start_date, doc.end_date);
  let interestingDates: Map<Date, number> = ptolib.docToInterestingDates(doc, allDays);
  // console.table(interestingDates);
  let plotlyJSON: ptolib.Plot[] = ptolib.makePlots(doc, allDays, interestingDates);
  // let plotlyJSON: ptolib.Plot[] = ptolib.docToPlotlyJSONOld(doc);
  // console.log(plotlyJSON);
  Plotly.newPlot('result', plotlyJSON);
}

const startYAML = `--- # PDO
start_date: 2018-01-01 # remove this line to start from today
end_date: 2018-12-31
start_hours: 40
hour_markers:
- label: 40 hr buffer
  hours: 40
holidays:
# Acxiom holidays
- 2018-01-01  # New Year's Day (Observed)
- 2018-02-19  # Presidents' Day
- 2018-05-28  # Memorial Day
- 2018-07-04  # Independence Day
- 2018-09-03  # Labor Day
- 2018-11-22  # Thanksgiving
- 2018-11-23  # Day After Thanksgiving
- 2018-12-24  # Christmas Eve (Observed)
- 2018-12-25  # Christmas Day
repeating_changes:
- day_of_month: 15  # Accrue PTO
  hour_change: 12.67
one_day_changes:
- date: 2018-01-02
  hour_change: -8
ranged_changes:
# Example ranged vacation
- start_date: 2018-05-01
  end_date: 2018-05-08
  hour_change: -8`;

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

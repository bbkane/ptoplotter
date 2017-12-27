let editor = CodeMirror.fromTextArea(document.getElementById("code"), {
  lineNumbers: true,
  tabMode: "indent"
});

editor.on('change', function(cm) {
  let doc = jsyaml.load(cm.getValue());
  plotlyJSON = docToPlotlyJSON(doc);
  Plotly.newPlot('graphdiv', data);
});

// https://stackoverflow.com/a/17727953/2958070
function daysBetween(start_date, end_date) {
  start_utc = Date.UTC(start_date.getFullYear(), start_date.getMonth(), start_date.getDate())
  end_utc = Date.UTC(end_date.getFullYear(), end_date.getMonth(), end_date.getDate())
  return (end_date - start_date) / 86400000;
}

function docToPlotlyJSON(doc) {
  // Collect all traces (see https://plot.ly/javascript/line-charts/)
  data = []

  // https://stackoverflow.com/a/10040679/2958070
  let start_date = doc['start_date'];
  let end_date = doc['end_date'];
  let days_between = daysBetween(start_date, end_date);

  // all of these plots are going to share x-axises...
  let days = [];

  ys = []; // This keeps track of the PDO balance per day from start_date to end_date inclusive
  let hours = doc['start_hours'];
  // am I double allocating here?
  for (let d = new Date(start_date); d <= end_date; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));

    for(let obj of doc['repeating_changes']) {
      if (obj.day_of_month === d.getDate()) {
        hours += obj.hour_change;
      }
    }

    ys.push(hours);
  }

  data.push({
    x: days,
    y: ys,
    type: 'scatter'
  });

  // Lets start with hour_markers
  let hour_markers = []
  for(let hr of doc['hour_markers']) {
    let hr_change = Array.apply(null, Array(days_between)).map(Number.prototype.valueOf,hr);
    hour_markers.push(hr_change);
  }

  for (let ys of hour_markers) {
    data.push( {
      x: days,
      y: ys,
      type: 'scatter'
    });
  }

  return data;
}
// https://stackoverflow.com/a/17727953/2958070
function daysBetween(start_date, end_date) {
  start_utc = Date.UTC(start_date.getFullYear(), start_date.getMonth(), start_date.getDate())
  end_utc = Date.UTC(end_date.getFullYear(), end_date.getMonth(), end_date.getDate())
  return (end_date - start_date) / 86400000;
}

// Needs a {positive: [], neutral: [], negative: []}
// an int
// and a date (This function will copy the date if necessary)
function addToCorrectMarkerDates(marker_dates, hour_change, date) {
  let change = 'positive';
  if (hour_change < 0) {
    change = 'negative';
  }
  if (hour_change === 0) {
    change = 'neutral';
  }
  marker_dates[change].push(new Date(date));
}

function makeFilledArray(length, value) {
  arr = Array.apply(null, Array(length)).map(Number.prototype.valueOf, value);
  return arr
}

// This takes the code_editor -> JSON
function docToPlotlyJSON(doc) {
  // Collect all traces (see https://plot.ly/javascript/line-charts/)
  data = []

  // https://stackoverflow.com/a/10040679/2958070
  let start_date = doc['start_date'];
  let end_date = doc['end_date'];
  let days_between = daysBetween(start_date, end_date);

  // most of these plots are going to share x-axes...
  let days = [];

  ys = []; // This keeps track of the PDO balance per day from start_date to end_date inclusive
  let hours = doc['start_hours'];


  let marker_dates = {
    'positive': [],
    'neutral': [],
    'negative': []
  };

  let has_repeating_changes = ('repeating_changes' in doc);
  let has_one_day_changes = ('one_day_changes' in doc);
  let has_ranged_changes = ('ranged_changes' in doc);

  // TODO: make this not O(n(a + b + c + ...))
  for (let d = new Date(start_date); d <= end_date; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));

    if (has_repeating_changes) {
      for(let obj of doc['repeating_changes']) {
        if (obj.day_of_month === d.getDate()) {
          hours += obj.hour_change;
          addToCorrectMarkerDates(marker_dates, obj.hour_change, d);
        }
      }
    }

    if (has_one_day_changes) {
      for(let obj of doc['one_day_changes']) {
        // http://adripofjavascript.com/blog/drips/checking-date-equality-in-javascript.html
        if (obj.date.getTime() === d.getTime()) {
          hours += obj.hour_change;
          addToCorrectMarkerDates(marker_dates, obj.hour_change, d);
        }
      }
    }

    if (has_ranged_changes) {
      for(let obj of doc['ranged_changes']) {
        let d_time = d.getTime();
        if (d.getDay() >= 1 && d.getDay() <= 6 && // weekday
            obj.start_date.getTime() <= d_time &&
            d_time <= obj.end_date.getTime()) {
          hours += obj.hour_change;
          addToCorrectMarkerDates(marker_dates, obj.hour_change, d);
        }
      }
    }

    ys.push(hours);
  }

  // Add the PDO trace
  data.push({
    x: days,
    y: ys,
    mode: 'scatter',
    name: 'PDO'
  });

  // Add the markers
  data.push({
    x: marker_dates.negative,
    y: makeFilledArray(marker_dates.negative.length, 0),
    mode: 'markers',
    name: 'losses',
    marker: {
      color: 'red'
    }
  });

  data.push({
    x: marker_dates.neutral,
    y: makeFilledArray(marker_dates.neutral.length, 0),
    mode: 'markers',
    name: 'no change',
    marker: {
      color: 'blue'
    }
  });

  data.push({
    x: marker_dates.positive,
    y: makeFilledArray(marker_dates.positive.length, 0),
    mode: 'markers',
    name: 'gains',
    marker: {
      color: 'green'
    }
  });

  // Add all hour_markers
  let hour_markers = []
  for(let obj of doc['hour_markers']) {
    let hr_change = makeFilledArray(days_between, obj.hours);
    data.push( {
      x: days,
      y: hr_change,
      mode: 'scatter',
      name: obj.label
    });
  }

  return data;
}

function updateGraph(code_mirror_instance) {
  let doc = jsyaml.safeLoad(code_mirror_instance.getValue());
  plotlyJSON = docToPlotlyJSON(doc);
  Plotly.newPlot('result', data);
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
  - date: 2018-12-25  # Christmas Day
    hour_change: 0
  - date: 2018-12-24  # Christmas Eve (Observed)
    hour_change: 0
  - date: 2018-11-23  # Day After Thanksgiving
    hour_change: 0
  - date: 2018-11-22  # Thanksgiving
    hour_change: 0
  - date: 2018-09-03  # Labor Day
    hour_change: 0
  - date: 2018-07-04  # Independence Day
    hour_change: 0
  - date: 2018-05-28  # Memorial Day
    hour_change: 0
  - date: 2018-02-19  # Presidents' Day
    hour_change: 0
  - date: 2018-01-01  # New Year's Day (Observed)
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

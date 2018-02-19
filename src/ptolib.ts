// Generated from https://app.quicktype.io/
// then modified to support Dates instead of strings

export interface EditorInfo {
    start_date:        Date;
    end_date:          Date;
    start_hours:       number;
    hour_markers:      HourMarker[];
    repeating_changes: RepeatingChange[];
    one_day_changes:   OneDayChange[];
    ranged_changes:    RangedChange[];
}

export interface HourMarker {
    label: string;
    hours: number;
}

export interface OneDayChange {
    date:        Date;
    hour_change: number;
}

export interface RangedChange {
    start_date:  Date;
    end_date:    Date;
    hour_change: number;
}

export interface RepeatingChange {
    day_of_month: number;
    hour_change:  number;
}

// Just enough plotly.js to type

export enum PlotMode {
    scatter = 'scatter',
    markers = 'markers'
}

export interface Marker {
    color: string
}

export interface Plot {
    x: Date[],
    y: number[],
    mode: PlotMode,
    name: string,
    marker?: Marker
}

// https://stackoverflow.com/a/17727953/2958070
function getDaysBetween(start_date: Date, end_date: Date): number {
    let start_utc = Date.UTC(start_date.getFullYear(), start_date.getMonth(), start_date.getDate())
    let end_utc = Date.UTC(end_date.getFullYear(), end_date.getMonth(), end_date.getDate())
    return (end_utc - start_utc) / 86400000;
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
    let arr = Array.apply(null, Array(length)).map(Number.prototype.valueOf, value);
    return arr
}

export function makeSequentialDateArray(startDate: Date, endDate: Date): Date[] {
    let days: Date[] = [];
    for (let d = new Date(startDate.getTime()); d <= endDate; d.setDate(d.getDate() + 1)) {
        days.push(new Date(d.getTime()));
    }
    return days;
}

export function docToPlotlyJSON(doc: EditorInfo): Plot[] {
    // make the days
    let startDate: Date = doc.start_date;
    let endDate: Date = doc.end_date;
    let daysBetween: number = getDaysBetween(startDate, endDate);

    // TODO: finish
    return [];
}

// This takes the code_editor -> JSON
export function docToPlotlyJSONOld(doc): Plot[] {
    // Collect all traces (see https://plot.ly/javascript/line-charts/)
    let data = []

    // https://stackoverflow.com/a/10040679/2958070
    let start_date = doc['start_date'];
    let end_date = doc['end_date'];
    let days_between = getDaysBetween(start_date, end_date);

    // most of these plots are going to share x-axes...
    let days = [];

    let ys = []; // This keeps track of the PDO balance per day from start_date to end_date inclusive
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
        days.push(new Date(d.getTime()));

        if (has_repeating_changes) {
            for (let obj of doc['repeating_changes']) {
                if (obj.day_of_month === d.getDate()) {
                    hours += obj.hour_change;
                    addToCorrectMarkerDates(marker_dates, obj.hour_change, d);
                }
            }
        }

        if (has_one_day_changes) {
            for (let obj of doc['one_day_changes']) {
                // http://adripofjavascript.com/blog/drips/checking-date-equality-in-javascript.html
                if (obj.date.getTime() === d.getTime()) {
                    hours += obj.hour_change;
                    addToCorrectMarkerDates(marker_dates, obj.hour_change, d);
                }
            }
        }

        if (has_ranged_changes) {
            for (let obj of doc['ranged_changes']) {
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
    for (let obj of doc['hour_markers']) {
        let hr_change = makeFilledArray(days_between, obj.hours);
        data.push({
            x: days,
            y: hr_change,
            mode: 'scatter',
            name: obj.label
        });
    }

    return data;
}
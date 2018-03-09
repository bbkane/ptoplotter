import { randomBytes } from "crypto";

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


function isWeekDay(date: Date): boolean {
    return date.getDay() >= 1 && date.getDay() <= 6
}


export function normalizeDeltas(repeatingChangeDelta: number, oneDayChangeDelta: number, rangedChangeDelta: number): number {
        // So, I should have all possible deltas for each day.
        // Merge them with the following rules:
        // deltas > 0 are always applied
        // deltas < 0 are only applied if a delta == 0 not found (0 is a sentinal for holiday on the company, so don't take time off on it)
        // Don't take more than 8 hours a day off ( min(delta) == -8)
        // deltas that are isNan are ignored (nothing happened)

        // TODO: unroll this loop for speed and maybe readability?
        let deltas: number[] = [repeatingChangeDelta, oneDayChangeDelta, rangedChangeDelta];

        // no change (common case)
        if (deltas.every(isNaN)) {
            return 0;
        }

        let hasZeroDelta = deltas.some(num => num == 0);

        let positiveDelta = 0;
        let negativeDelta = 0;
        // Note: NaN compares false to <, > , ==
        for (let delta of deltas) {
            if (delta > 0) {
                positiveDelta += delta;
            } else if (delta < 0 && !hasZeroDelta) {
                // NOTE: it's already negative, no need to subtract!
               negativeDelta += delta;
            }
        }

        if (negativeDelta < -8) {
            negativeDelta = -8;
        }
        // NOTE: it's already negative, no need to subtract!
        return positiveDelta + negativeDelta;
}


// TODO: there are major parts of this not working...
// all sorts of changes...
// probably add some tests before doing any more
export function docToPlotlyJSON(doc: EditorInfo): Plot[] {
    // make the days
    const startDate: Date = doc.start_date;
    const endDate: Date = doc.end_date;
    const daysBetween: number = getDaysBetween(startDate, endDate);
    const startHours = doc.start_hours;

    const allDays: Date[] = makeSequentialDateArray(startDate, endDate);

    let ptoBalanceHours: number[] = [];
    let positiveMarkers: Date[] = [];
    let zeroMarkers: Date[] = [];
    let negativeMarkers: Date[] = [];

    // TODO: try hash map approach instead of loops...

    console.log('Starting:', new Date());
    let currentPtoBalance: number = doc.start_hours;
    for (let currentDay of allDays) {

        // zero has a special meaning here. Using a sentinal...
        let repeatingChangeDelta: number = NaN;
        let oneDayChangeDelta: number = NaN;
        let rangedChangeDelta: number = NaN;

        // only count Monday-Friday (TODO: make this a flag in the input somewhere?)
        for (let rangedChange of doc.ranged_changes) {
            if (isWeekDay(currentDay)) {
                if (currentDay.getTime() >= rangedChange.start_date.getTime() &&
                        currentDay.getTime() <= rangedChange.end_date.getTime()) {
                    rangedChangeDelta = rangedChange.hour_change;
                    }
            }
        }

        for (let repeatingChange of doc.repeating_changes) {
            if (currentDay.getDate() == repeatingChange.day_of_month) {
                repeatingChangeDelta = repeatingChange.hour_change;
            }
        }

        for (let oneDayChange of doc.one_day_changes) {
            // TODO: getTime isn't a function?
            if (currentDay.getTime() == oneDayChange.date.getTime()) {
                oneDayChangeDelta = oneDayChange.hour_change;
            }
        }

        let normalizedDelta = normalizeDeltas(repeatingChangeDelta, oneDayChangeDelta, rangedChangeDelta);

        if ( !(isNaN(repeatingChangeDelta) && isNaN(oneDayChangeDelta) && isNaN(rangedChangeDelta)) ) {
            console.log(
                currentDay,
                'repeatingChangeDelta:', repeatingChangeDelta,
                'oneDayChangeDelta:', oneDayChangeDelta,
                'rangedChangeDelta:', rangedChangeDelta,
                'normalizedDelta:', normalizedDelta);
        }
        currentPtoBalance += normalizedDelta;
        ptoBalanceHours.push(currentPtoBalance);
    }

    let data: Plot[] = [];
    data.push({
        x: allDays,
        y: ptoBalanceHours,
        mode: PlotMode.scatter,
        name: 'PTO'
    });

    return data;
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
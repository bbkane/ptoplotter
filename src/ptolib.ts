import { randomBytes } from "crypto";

// Generated from https://app.quicktype.io/
// then modified to support Dates instead of strings

export interface EditorInfo {
    start_date:        Date;
    end_date:          Date;
    start_hours:       number;
    hour_markers:      HourMarker[];
    holidays: Date[]
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

export interface DebugDeltas {
    currentDay: Date,
    repeatingChangeDelta: number,
    oneDayChangeDelta: number,
    rangedChangeDelta: number,
    normalizeDelta: number
}

export function makeSequentialDateArray(startDate: Date, endDate: Date): Date[] {
    let days: Date[] = [];
    for (let d = new Date(startDate.getTime()); d <= endDate; d.setDate(d.getDate() + 1)) {
        days.push(new Date(d.getTime()));
    }
    return days;
}

// TODO: make this configurable
function isWeekDay(date: Date): boolean {
    return date.getDay() >= 1 && date.getDay() <= 6
}

function hasDate(arr: Date[], dt: Date): boolean {
    const dtTime = dt.getTime();
    for (let d of arr) {
        if (d.getTime() == dtTime) {
            return true;
        }
    }
    return false;
}

// TODO max hours off and holidays should be configurable!
export function normalizeDeltas(holidays: Date[], currentDay: Date, repeatingChangeDelta: number, oneDayChangeDelta: number, rangedChangeDelta: number): number {
    // Always apply positive changes
    // Only apply a negative change if it's not a weekend or holiday
    // Take max -8 negative hours
    let deltas: number[] = [repeatingChangeDelta, oneDayChangeDelta, rangedChangeDelta];

    if (deltas.every(x => x == 0)) {
        return 0;
    }

    let finalDelta: number = 0
    for (let delta of deltas) {
        if (delta > 0) {
            finalDelta += delta;
        }
        else {
            if ( !(!isWeekDay(currentDay) || hasDate(holidays, currentDay))) {
                finalDelta += delta;
            }
        }
    }

    if (finalDelta < -8) {
        finalDelta = -8;
    }
    return finalDelta;
}

// TODO: there are major parts of this not working...
// all sorts of changes...
// probably add some tests before doing any more
export function docToInterestingDates(doc: EditorInfo, allDays: Date[]): Map<Date, number> {

    // NOTE: Maps are only in es6.
    let interestingDates = new Map<Date, number>();

    for (let currentDay of allDays) {

        let repeatingChangeDelta: number = 0;
        let oneDayChangeDelta: number = 0;
        let rangedChangeDelta: number = 0;

        // only count Monday-Friday (TODO: make this a flag in the input somewhere?)
        for (let rangedChange of doc.ranged_changes) {
            if (currentDay.getTime() >= rangedChange.start_date.getTime() &&
                    currentDay.getTime() <= rangedChange.end_date.getTime()) {
                rangedChangeDelta = rangedChange.hour_change;
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

        // TODO: make this just mutate a map passed in instead of returning..
        let normalizedDelta = normalizeDeltas(doc.holidays, currentDay, repeatingChangeDelta, oneDayChangeDelta, rangedChangeDelta);

        if (normalizedDelta != 0) {
            interestingDates.set(currentDay, normalizedDelta);
        }
    }
    return interestingDates;
}


export function makePlots(doc: EditorInfo, allDays: Date[], interestingDates: Map<Date, number>): Plot[] {
    let balances : number[] = [];
    let positiveDays: Date[] = [];
    let negativeDays: Date[] = [];
    // NOTE: I think I'm going to change around the holidays
    // instead of screwing around with sentinals
    let balance = doc.start_hours;

    for (let currentDay of allDays) {
        if (interestingDates.has(currentDay)) {
            let delta = interestingDates.get(currentDay);
            balance += delta;

            if (delta > 0) {
                positiveDays.push(currentDay);
            } else if (delta < 0) {
                negativeDays.push(currentDay);
            }
        }
        balances.push(balance)
    }

    let plots: Plot[] = [];

    plots.push({
        x: allDays,
        y: balances,
        mode: PlotMode.scatter,
        name: "PTO"
    });

    plots.push({
        x: positiveDays,
        y: makeFilledArray(positiveDays.length, 0),
        mode: PlotMode.markers,
        name: "gains",
        marker: {
            color: 'green'
        }
    });

    plots.push({
        x: negativeDays,
        y: makeFilledArray(negativeDays.length, 0),
        mode: PlotMode.markers,
        name: "losses",
        marker: {
            color: 'red'
        }
    });

    for (let hourMarker of doc.hour_markers) {
        plots.push({
            x: [doc.start_date, doc.end_date],
            y: [hourMarker.hours, hourMarker.hours],
            mode: PlotMode.scatter,
            name: hourMarker.label
        });
    }

    return plots;
}

// OLD STUFF

function makeFilledArray(length, value) {
    let arr = Array.apply(null, Array(length)).map(Number.prototype.valueOf, value);
    return arr
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
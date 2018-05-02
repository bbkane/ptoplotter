// Generated from https://app.quicktype.io/
// then modified to support Dates instead of strings

export interface EditorInfo {
    start_date?:       Date;  // if this isn't here, assume it's today
    end_date:          Date;
    start_hours:       number;
    hour_markers:      HourMarker[];
    holidays: Date[];
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

export function makeSequentialDateArray(startDate: Date, endDate: Date): Date[] {
    let days: Date[] = [];
    for (let d = new Date(startDate.getTime()); d <= endDate; d.setDate(d.getDate() + 1)) {
        days.push(new Date(d.getTime()));
    }
    return days;
}

function makeFilledArray(length, value) {
    let arr = Array.apply(null, Array(length)).map(Number.prototype.valueOf, value);
    return arr
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
export function normalizeDeltas(holidays: Date[], currentDay: Date, deltas: number[]): number {
    // Always apply positive changes
    // Only apply a negative change if it's not a weekend or holiday
    // Take max -8 negative hours

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

        let deltas: number[] = []

        for (let rangedChange of doc.ranged_changes) {
            if (currentDay.getTime() >= rangedChange.start_date.getTime() &&
                    currentDay.getTime() <= rangedChange.end_date.getTime()) {
                deltas.push(rangedChange.hour_change);
                break; // assume there's only one ranged change there
            }
        }

        for (let repeatingChange of doc.repeating_changes) {
            if (currentDay.getDate() == repeatingChange.day_of_month) {
                deltas.push(repeatingChange.hour_change);
                break;
            }
        }

        for (let oneDayChange of doc.one_day_changes) {
            if (currentDay.getTime() == oneDayChange.date.getTime()) {
                deltas.push(oneDayChange.hour_change);
                break;
            }
        }

        // TODO: make this just mutate a map passed in instead of returning..
        let normalizedDelta = normalizeDeltas(doc.holidays, currentDay, deltas);

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

    plots.push({
        x: doc.holidays,
        y: makeFilledArray(doc.holidays.length, 0),
        mode: PlotMode.markers,
        name: "holidays",
        marker: {
            color: 'blue'
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

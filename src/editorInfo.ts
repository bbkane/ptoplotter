// To parse this data:
//
//   import { Convert, EditorInfo } from "./file";
//
//   const editorInfo = Convert.toEditorInfo(json);
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

// Converts JSON strings to/from your types
export module Convert {
    export function toEditorInfo(json: string): EditorInfo {
        return JSON.parse(json);
    }

    export function editorInfoToJson(value: EditorInfo): string {
        return JSON.stringify(value, null, 2);
    }
}

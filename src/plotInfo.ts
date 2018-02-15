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
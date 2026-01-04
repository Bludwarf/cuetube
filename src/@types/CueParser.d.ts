///<reference path="cuesheet.d.ts"/>
declare class CueParser {
    public static parse(cuesheetContent: string, options?: any): cuesheet.CueSheet;
}



export class Dialog {
    public lines: DialogLine[];

    public constructor(lines: string[]) {
        this.lines = lines.map(DialogLine.fromString);
    }
}

export class DialogLine {
    public charNum: number;
    public line: string;

    public constructor(charNum: number, line: string) {
        this.charNum = charNum;
        this.line = line;
    }

    public static fromString(s: string) {
        const charNum = +s[0] - 1;
        const line = s.substr(1).trim();
        return new DialogLine(charNum, line);
    }
}

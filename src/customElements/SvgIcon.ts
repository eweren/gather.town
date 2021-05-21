/**
 * Class for displaying svg-icons.
 */
export class SvgIcon extends HTMLElement {
    private iconObj = document.createElement("object");
    private url!: string;

    public constructor(src: string, private size: number, private color = "#FFF") {
        super();
        this.iconObj.type = "image/svg+xml";
        this.iconObj.style.pointerEvents = "none";
        this.appendChild(this.iconObj);
        this.updateSize(size);
        this.updateSrc(src);
    }

    public updateSize(newSize: number): void {
        this.size = newSize;
        this.iconObj.style.width = this.size + "px";
        this.iconObj.style.height = this.size + "px";
        this.iconObj.width = this.size + "";
        this.iconObj.height = this.size + "";
    }

    public updateSrc(newSrc: string): void {
        this.url = newSrc;
        this.iconObj.data = newSrc;
        const color = this.color;
        this.iconObj.addEventListener("load", function() {
            const doc = this.getSVGDocument();
            const svg = doc?.querySelector("svg");
            svg?.setAttribute("fill", color);
        }, { once: true });
    }

    public getUrl(): string {
        return this.url;
    }
}

export default function () {
    customElements.define("svg-icon", SvgIcon);
}

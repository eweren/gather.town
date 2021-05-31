import { SvgIcon } from "./SvgIcon";

/**
 * Class for showing/hiding elements on hover over.
 */
export class HoverOver extends HTMLElement {
    private buttons = new Map<string, { element: HTMLElement, toggleText?: string }>();
    private wrapper = document.createElement("div");

    public constructor() {
        super();
    }

    public addButton(imageUrl: string, callback: (action: boolean) => void, toggleImageUrl?: string, textHover?: string, toggleTextHover?: string) {
        this.buttons.set(imageUrl, { element: this.createButton(imageUrl, callback, toggleImageUrl, textHover, toggleTextHover), toggleText: toggleImageUrl });
    }

    public createButton(imageUrl: string, callback: (action: boolean) => void, toggleImageUrl?: string, textHover?: string, toggleTextHover?: string, color = "#FFF"): HTMLElement {
        const button = document.createElement("div");
        button.classList.add("actionButton");
        const icon = new SvgIcon(imageUrl, 20);
        button.title = textHover ?? "";
        button.appendChild(icon);
        button.onclick = (ev) => {
            ev.stopImmediatePropagation();
            callback(icon.getUrl() === imageUrl && toggleImageUrl != null);
            if (icon.getUrl() === imageUrl && toggleImageUrl != null) {
                button.title = textHover ?? "";
                icon.updateSrc(toggleImageUrl);
            } else {
                button.title = toggleTextHover ?? "";
                icon.updateSrc(imageUrl);
            }
        };
        this.wrapper.append(button);
        return button;
    }

    public removeButton(text: string): void {
        this.buttons.get(text)?.element.remove();
        this.buttons.delete(text);
    }

    public connectedCallback(): void {
        if (!this.isConnected) {
            return;
        }
        const shadowRoot = this.attachShadow({ mode: "open" });
        const style = document.createElement("style");
        this.wrapper.classList.add("actionButtonWrapper");

        style.textContent = `
            .actionButton {
                cursor: pointer;
                user-select: none;
            }
            .actionButtonWrapper {
                opacity: 1;
                transition: opacity 0.2s ease-in-out;
                pointer-event: none;
                display: flex;
                gap: 8px;
                pointer: cursor;
            }
            .actionButtonWrapper:hover {
                opacity: 1;
                pointer-events: all;
            }
            .actionButtonIcon {
                width: 20px;
                height: 20px;
                pointer-events: none;
                user-select: none;
            }
        `;
        shadowRoot.append(style, this.wrapper);
    }
}

export default function () {
    customElements.define("hover-over", HoverOver);
}

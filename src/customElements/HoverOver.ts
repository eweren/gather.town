/**
 * Class for showing/hiding elements on hover over.
 */
export class HoverOver extends HTMLElement {
    private buttons = new Map<string, { element: HTMLElement, toggleText?: string }>();
    private wrapper = document.createElement("div");

    public constructor() {
        super();
    }

    public addButton(text: string, callback: (action: boolean) => void, toggleText?: string, textHover?: string, toggleTextHover?: string) {
        this.buttons.set(text, { element: this.createButton(text, callback, toggleText, textHover, toggleTextHover), toggleText });
    }

    public createButton(text: string, callback: (action: boolean) => void, toggleText?: string, textHover?: string, toggleTextHover?: string): HTMLElement {
        const button = document.createElement("div");
        button.classList.add("actionButton");
        button.innerText = text;
        button.title = textHover ?? "";
        button.onclick = (ev) => {
            ev.stopImmediatePropagation();
            callback(button.innerText === text && toggleText != null);
            if (button.innerText === text && toggleText != null) {
                button.innerText = toggleText;
                button.title = textHover ?? "";
            } else {
                button.innerText = text;
                button.title = toggleTextHover ?? "";
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
            }
            .actionButtonWrapper {
                opacity: 0;
                transition: opacity 0.2s ease-in-out;
                pointer-event: none;
                display: flex;
                gap: 8px;
                pointer: cursor;
            }
            .actionButtonWrapper:hover {
                opacity: 1;
                pointer-event: all;
            }
        `;
        shadowRoot.append(style, this.wrapper);
    }
}

export default function () {
    customElements.define("hover-over", HoverOver);
}

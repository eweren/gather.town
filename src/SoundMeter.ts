/**
 * Meter class that generates a number correlated to audio volume.
 * The meter class itself displays nothing, but it makes the
 * instantaneous and time-decaying volumes available for inspection.
 * It also reports on the fraction of samples that were at or near
 * the top of the measurement range.
 */
export class SoundMeter {
    private context: AudioContext;
    /** instant audio activity */
    public instant: number;
    /** average audio activity for nearly a second */
    public slow: number;
    private script: ScriptProcessorNode;
    private mic?: MediaStreamAudioSourceNode;

    constructor(context: AudioContext) {
        this.context = context;
        this.instant = 0.0;
        this.slow = 0.0;
        this.script = context.createScriptProcessor(2048, 1, 1);
        const that = this;
        this.script.onaudioprocess = function (event) {
            const input = event.inputBuffer.getChannelData(0);
            let i;
            let sum = 0.0;
            for (i = 0; i < input.length; ++i) {
                sum += input[i] * input[i];
            }
            that.instant = Math.sqrt(sum / input.length);
            that.slow = 0.95 * that.slow + 0.05 * that.instant;
        };
    }

    public connectToSource(stream: MediaStream, callback: (...args: any) => any): void {
        try {
            this.mic = this.context.createMediaStreamSource(stream);
            this.mic.connect(this.script);
            // necessary to make sample run, but should not be.
            this.script.connect(this.context.destination);
            if (typeof callback !== "undefined") {
                callback(null);
            }
        } catch (e) {
            console.error(e);
            if (typeof callback !== "undefined") {
                callback(e);
            }
        }
    }

    public stop(): void {
        this.mic?.disconnect();
        this.script.disconnect();
    }
}

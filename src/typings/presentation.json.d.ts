declare module "*.presentation.json" {
    export type PresentationJSON = Array<{ slide: number, headline: string, subHeadline: string, lines?: Array<string> }>;
    const value: PresentationJSON;
    export default value;
}

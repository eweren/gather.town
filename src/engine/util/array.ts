/**
 * Inplace array shuffling.
 *
 * @param array The array.
 * @return The same array. But shuffled.
 */
export function shuffle<T>(array: T[]): T[] {
    for (let i = 1; i < array.length; i++) {
        const j = Math.floor(Math.random() * (i + 1));

        if (i !== j) {
            const tmp = array[i];
            array[i] = array[j];
            array[j] = tmp;
        }
    }

    return array;
}

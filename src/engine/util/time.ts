const timeDelta = Date.now() - performance.now();

export function now(): number {
    return performance.now() + timeDelta;
}

export async function sleep(ms = 0): Promise<void> {
    await new Promise((resolve) => {
        setTimeout(() => resolve(), ms);
    });
}

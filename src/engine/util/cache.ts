/**
 * Decorator for caching method results. The method is only called on cache miss and then the returned result
 * is cached. Subsequent calls then return the cached result immediately without executing the method until the
 * cache is reset with `delete obj.method`.
 */
export function cacheResult(target: Record<string, any>, propertyKey: string,
        descriptor: TypedPropertyDescriptor<() => any>): void {
    const origMethod = target[propertyKey] as () => void;
    descriptor.value = function(this: unknown) {
        const origValue = origMethod.call(this) as unknown;
        Object.defineProperty(this, propertyKey, {
            configurable: true,
            value: () => origValue
        });
        return origValue;
    };
}

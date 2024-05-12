import { writable, type Readable, type Writable, get, readonly, readable } from "svelte/store";

interface CreateRefreshingOptions {
    // Subscribe to these stores, trigger a reload when they change.
    refreshOn?: Readable<unknown> | Readable<unknown>[];
    // Debounce the reloads of this store by this amount of time.
    debounce?: number;
    // Forcefully disable lazy loading this store by always having one listener.
    eager?: boolean;
}

export type Refreshing<T> = Readable<Promise<T>> & {
    reload: () => void;
    resolved: Readable<T | undefined>;
};

export function refreshing<T>(fn: (old?: T | undefined) => T | Promise<T>, { refreshOn = [], debounce = undefined, eager = false }: CreateRefreshingOptions = {}): Refreshing<T> {
    let resolvedStore: Writable<T | undefined> = writable(undefined);
    let currentPromise: Promise<T> | undefined = undefined;
    const fnPromise = async () => {
        const promise = currentPromise = (async () => {
            if (fn.length === 0) return await fn();
            else return await fn(get(resolvedStore));
        })();

        let result = await promise.catch(() => undefined);
        // Only set the resolved store if this is the most recent promise.
        if (currentPromise === promise) resolvedStore.set(result);
        return result as T;
    }
    fnPromise();

    let store: Writable<Promise<T>>;
    let unsubs: (() => void)[] = [];
    // We serialize the refresh values to make sure that when we subscribe to the
    // refreshes, we don't accidentally trigger a refresh.
    let refreshArr = Array.isArray(refreshOn) ? refreshOn : [refreshOn];
    let refreshValues = refreshArr.map((store) => get(store));

    let timeout: NodeJS.Timeout | undefined = undefined;
    const reload = () => {
        if (timeout) clearTimeout(timeout);
        if (debounce) {
            timeout = setTimeout(() => {
                fnPromise();
                store.set(currentPromise!);
            }, debounce);
        } else {
            fnPromise();
            store.set(currentPromise!);
        }
    }
    store = writable<Promise<T>>(undefined, (set) => {
        set(currentPromise!);

        refreshArr.forEach((store, i) => {
            let unsub = store.subscribe((value) => {
                if (value !== refreshValues[i]) {
                    refreshValues[i] = value;
                    reload();
                }
            });
            unsubs.push(unsub);
        });

        return () => {
            unsubs.forEach((unsub) => unsub());
        }
    });

    if (eager) store.subscribe(() => { });

    return {
        subscribe: store.subscribe,
        reload,
        resolved: readonly(resolvedStore),
    };
}

export type Status = "loading" | "error" | "success";
export function statusOf<T>(store: Readable<T>): Readable<Status> {
    let currentPromise: Promise<T> | undefined = undefined;
    return readable<Status>("loading", (set) => {
        let unsub = store.subscribe((value) => {
            if (value instanceof Promise) {
                set("loading");
                currentPromise = value;
                value.then(() => {
                    if (currentPromise === value) set("success");
                }).catch(() => {
                    if (currentPromise === value) set("error");
                });
            } else {
                set("success");
            }
        });
        return unsub;
    });
}
import { writable, type Readable, type Writable, get } from "svelte/store";

interface CreateRefreshingOptions {
    // Subscribe to these stores, trigger a reload when they change.
    refreshOn?: Readable<unknown> | Readable<unknown>[];
}

export type Refreshing<T> = Readable<Promise<T>> & {
    reload: () => void;
    resolved: Readable<T | undefined>;
};

export function refreshing<T>(fn: (old?: T | undefined) => T | Promise<T>, { refreshOn = [] }: CreateRefreshingOptions = {}): Refreshing<T> {
    let resolvedStore: Writable<T | undefined> = writable(undefined);
    let currentPromise: Promise<T> | undefined = undefined;
    const fnPromise = async () => {
        let promise = (async () => {
            if (fn.length === 0) return await fn();
            else return await fn(get(resolvedStore));
        })();
        currentPromise = promise;

        let errored = false;
        let error = undefined;
        let result = await (promise.catch((e) => {
            errored = true;
            error = e;
            return undefined;
        }));
        // Only set the resolved store if this is the most recent promise.
        if (currentPromise === promise) resolvedStore.set(result);
        // If we errored, we want to now throw the error.
        if (errored) throw error;
        return result as T;
    }

    let store: Writable<Promise<T>>;
    let thisPromise: Promise<T> = fnPromise();
    let unsubs: (() => void)[] = [];
    // We serialize the refresh values to make sure that when we subscribe to the
    // refreshes, we don't accidentally trigger a refresh.
    let refreshArr = Array.isArray(refreshOn) ? refreshOn : [refreshOn];
    let refreshValues = refreshArr.map((store) => get(store));

    const reload = () => {
        thisPromise = fnPromise();
        store.set(thisPromise);
    }
    store = writable<Promise<T>>(undefined, (set) => {
        set(thisPromise);

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

    return {
        subscribe: store.subscribe,
        reload,
        resolved: resolvedStore,
    };
}
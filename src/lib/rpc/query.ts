import { writable, type Readable, type Writable } from "svelte/store";

/*
Desired usage:

const query = createQuery(async () => {
    return await fetch(...);
})

// in a component
{#await $query then data}
    <...>
{:catch error}
    <...>
{/await}

This should:
* Automatically refresh when query changes.
* The query store should only notify subscribers when:
    * The promise resolves
    * The promise rejects
    * A new promise replaces the old one (so it can be awaited)
* We also want to provide a utility for abstracting over new promises replacing old ones.
    * e.g. continuous(query) -> Once resolved, will show the resolved value until the query changes, then will show the new query's result.
 */

interface CreateQueryOptions {
    lazy?: boolean;
    // Subscribe to these stores, trigger a reload when they change.
    refreshOn?: Readable<unknown> | Readable<unknown>[];
}

export function createQuery<T>(fn: () => Promise<T>, { lazy = true, refreshOn = [] }: CreateQueryOptions = {}) {
    let store: Writable<Promise<T>>;
    let thisPromise: Promise<T> | undefined = lazy ? undefined : fn();
    let unsubs: (() => void)[] = [];

    const reload = () => {
        thisPromise = fn();
        store.set(thisPromise);
    }
    store = writable<Promise<T>>(undefined, (set) => {
        thisPromise = fn();
        set(thisPromise);

        let refreshOnStores = Array.isArray(refreshOn) ? refreshOn : [refreshOn];
        refreshOnStores.forEach((store) => {
            unsubs.push(store.subscribe(reload));
        });

        return () => {
            unsubs.forEach((unsub) => unsub());
        }
    });




    return {
        subscribe: store.subscribe,
        reload,
    };
}
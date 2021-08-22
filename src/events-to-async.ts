export type UnHandler = () => unknown;

type Resolve<T> = (v: T) => void;
type Reject = (e: Error) => void;
type Deferred<T> = {
    resolve: Resolve<T>;
    reject: Reject;
    promise: Promise<T>;
};

function createDeferred<T = void>(): Deferred<T> {
    let resolve: Resolve<T> | undefined, reject: Reject | undefined;

    const promise = new Promise<T>((...args) => ([resolve, reject] = args));

    return Object.freeze(<Deferred<T>>{
        resolve: resolve!,
        reject: reject!,
        promise
    });
}

export function on<R extends [...any]>(onHandler: (...arg: any[]) => UnHandler): AsyncIterableIterator<R> {
    const comEvents: any[] = [];
    const unconsumedDeferred: Deferred<IteratorResult<any>>[] = [];
    const unEvent = onHandler((...args: any[]) => {
        const deferred = unconsumedDeferred.shift();
        if (deferred) {
            deferred.resolve({
                value: args,
                done: false
            });
        } else {
            comEvents.push(args);
        }
    });
    let finished = false;
    return {
        async next() {
            const lastEvent = comEvents.shift();
            if (lastEvent) {
                return {
                    value: lastEvent,
                    done: false
                };
            }
            if (finished) {
                return {
                    value: undefined,
                    done: true
                };
            }
            const deferred = createDeferred<IteratorResult<any>>();
            unconsumedDeferred.push(deferred);
            return deferred.promise;
        },
        async return() {
            finished = true;
            for (const deferred of unconsumedDeferred) {
                deferred.resolve({
                    value: undefined,
                    done: true
                });
            }
            unEvent?.();
            return {
                done: true,
                value: undefined
            };
        },
        async throw() {
            unEvent?.();
            return {
                done: true,
                value: undefined
            };
        },
        [Symbol.asyncIterator]() {
            return this;
        }
    };
}

export function once<R>(onHandler: (...arg: any[]) => UnHandler): Promise<R> {
    const unconsumedDeferred = createDeferred<R>();
    const unEvent = onHandler((...args: any[]) => {
        // @ts-ignore
        unconsumedDeferred.resolve(args);
    });
    return unconsumedDeferred.promise.finally(() => {
        unEvent?.();
    });
}

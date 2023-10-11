export type EventToAsyncUnHandler = () => unknown;
type Resolve<T> = (v: T) => void;
type Reject = (e: Error) => void;
type Deferred<T> = {
    resolve: Resolve<T>;
    reject: Reject;
    promise: Promise<T>;
};

function createDeferred<T = void>(): Deferred<T> {
    let resolve: Resolve<T> | undefined;
    let reject: Reject | undefined;
    const promise = new Promise<T>((...args) => ([resolve, reject] = args));
    return Object.freeze(<Deferred<T>>{
        resolve: resolve!,
        reject: reject!,
        promise
    });
}

export type EventToAsyncOnOptions = {
    signal?: AbortSignal;
};

export function on<R extends [...any]>(
    onHandler: (...arg: any[]) => EventToAsyncUnHandler,
    options?: EventToAsyncOnOptions
): AsyncIterableIterator<R> {
    const comEvents: any[] = [];
    const unconsumedDeferred: Deferred<IteratorResult<any>>[] = [];
    const unHandle = onHandler((...args: any[]) => {
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
    const abortSignal = options?.signal;
    let finished = false;
    let error: null | Error = null;
    const onAbort = () => {
        error = new Error("Abort Error");
    };
    const offListener = () => {
        unHandle?.();
        abortSignal?.removeEventListener("abort", onAbort);
    };
    abortSignal?.addEventListener("abort", onAbort, { once: true });
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
            if (error) {
                return Promise.reject(error);
            }
            const deferred = createDeferred<IteratorResult<any>>();
            unconsumedDeferred.push(deferred);
            return deferred.promise;
        },
        async return() {
            finished = true;
            offListener();
            for (const deferred of unconsumedDeferred) {
                deferred.resolve({
                    value: undefined,
                    done: true
                });
            }
            return {
                value: undefined,
                done: true
            };
        },
        async throw(thrownError: Error) {
            error = thrownError;
            offListener();
            return {
                value: undefined,
                done: true
            };
        },
        [Symbol.asyncIterator]() {
            return this;
        }
    };
}

export type EventToAsyncOnceOptions = {
    signal?: AbortSignal;
};

export function once<R extends [...any]>(
    onHandler: (...arg: any[]) => EventToAsyncUnHandler,
    options?: EventToAsyncOnceOptions
): Promise<R> {
    const unconsumedDeferred = createDeferred<R>();
    const unEvent = onHandler((...args: any[]) => {
        unconsumedDeferred.resolve(args as R);
    });
    const onAbort = () => {
        unconsumedDeferred.reject(new Error("Abort Error"));
    };
    const offListener = () => {
        unEvent?.();
        options?.signal?.removeEventListener("abort", onAbort);
    };
    options?.signal?.addEventListener("abort", onAbort, { once: true });
    return unconsumedDeferred.promise.finally(() => {
        offListener();
    });
}

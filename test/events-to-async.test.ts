import assert from "assert";
import { EventEmitter } from "events";
import { on, once } from "../src/events-to-async";
import { AbortController } from "abort-controller";
import { eventmit } from "eventmit";

describe("events-to-async", () => {
    describe("on", function () {
        it("should return iterable", async () => {
            const events = new EventEmitter();
            const asyncIterator = on<[number]>((handler) => {
                events.on("up", handler);
                return () => {
                    events.off("up", handler);
                };
            });
            process.nextTick(() => {
                events.emit("up", 1);
            });
            for await (const event of asyncIterator) {
                assert.deepStrictEqual(event, [1]);
                break;
            }
        });
        it("should continue iterable", async () => {
            const events = new EventEmitter();
            const asyncIterator = on<[number]>((handler) => {
                events.on("up", handler);
                return () => {
                    events.off("up", handler);
                };
            });
            setTimeout(() => {
                events.emit("up", 1);
                events.emit("up", 2);
                events.emit("up", 3);
                events.emit("up", 4);
            });
            const results = [];
            let count = 0;
            for await (const event of asyncIterator) {
                count++;
                if (count >= 4) {
                    break;
                } else if (count === 3) {
                    continue;
                }
                results.push(event);
            }
            assert.deepStrictEqual(results, [[1], [2]]);
        });
        it("call Iterable method: throws", async () => {
            const events = new EventEmitter();
            const asyncIterator = on<[number]>((handler) => {
                events.on("up", handler);
                return () => {
                    events.off("up", handler);
                };
            });
            events.emit("up", 1);
            events.emit("up", 2);
            assert.deepStrictEqual(await asyncIterator.next(), { done: false, value: [1] });
            assert.deepStrictEqual(await asyncIterator.next(), { done: false, value: [2] });
            await asyncIterator?.throw?.(new Error("Stop!"));
            await assert.rejects(() => asyncIterator.next(), /Stop!/);
            events.emit("up", 3);
            await assert.rejects(() => asyncIterator.next(), /Stop!/);
        });
        it("should support AbortSignal", async () => {
            const events = new EventEmitter();
            const abortController = new AbortController();
            const iterator = on<[number]>(
                (handler) => {
                    events.once("up", handler);
                    return () => {
                        events.off("up", handler);
                    };
                },
                { signal: abortController.signal }
            );
            abortController.abort();
            await assert.rejects(() => iterator.next(), /Abort Error/);
        });
    });

    describe("once", function () {
        it("should return a promise", async () => {
            const events = new EventEmitter();
            const promise = once<[number]>((handler) => {
                events.once("up", handler);
                return () => {
                    events.off("up", handler);
                };
            });
            process.nextTick(() => {
                events.emit("up", 1);
            });
            const event = await promise;
            assert.deepStrictEqual(event, [1]);
        });
        it("should support AbortSignal", async () => {
            const events = new EventEmitter();
            const abortController = new AbortController();
            const promise = once<[number]>(
                (handler) => {
                    events.once("up", handler);
                    return () => {
                        events.off("up", handler);
                    };
                },
                { signal: abortController.signal }
            );
            abortController.abort();
            await assert.rejects(() => promise, /Abort Error/);
        });
    });

    describe("When use yet another event emitter", () => {
        it("should support eventmit", async () => {
            type Event = { key: string };
            const events = eventmit<Event>();
            const asyncIterator = on<[Event]>((handler) => {
                events.on(handler);
                return () => events.off(handler);
            });
            process.nextTick(() => {
                events.emit({ key: "value" });
            });
            for await (const event of asyncIterator) {
                assert.deepStrictEqual(event, [{ key: "value" }]);
                break;
            }
        });
    });
});

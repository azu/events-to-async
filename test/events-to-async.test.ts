import { EventEmitter } from "events";
import { on, once } from "../src/events-to-async";
import assert from "assert";

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
});

# events-to-async

Treat EventEmitter-like object using Async/Await, Async Iterator.

## Install

Install with [npm](https://www.npmjs.com/):

    npm install events-to-async

## Usage

once an event

```js
import { EventEmitter } from "events";
import { on } from "events-to-async";

const events = new EventEmitter();
const event = await once((handler) => event.once("change", handler));
console.log(event);
```

on events

```js
import { EventEmitter } from "events";
import { on } from "events-to-async";

const events = new EventEmitter();
const asyncIterator = on((handler) => {
    event.on("change", handler);
    return () => {
        event.off("change", handler); // call it when occur error 
    }
});
for await(event of asyncIterator){
    console.log(event);
}
```

once an event with cancel

```js
import { EventEmitter } from "events";
import { on } from "events-to-async";

const events = new EventEmitter();
const abortController = new AbortController();
const event = await once((handler) => {
    event.once("change", handler);
    return () => {
        event.removeEventListner("change", handler);  // call it when occur error or abort
    }
}, { signal: abortController.signal });
console.log(event);
```

on events with cancel

```js
import { EventEmitter } from "events";
import { on } from "events-to-async";

const events = new EventEmitter();
const abortController = new AbortController();
const asyncIterator = on((handler) => {
    event.on("change", handler);
    return () => {
        event.off("change", handler);
    }
}, { signal: abortController.signal });
for await(event of asyncIterator){
    console.log(event);
}
```


## Changelog

See [Releases page](https://github.com/azu/events-to-async/releases).

## Running tests

Install devDependencies and Run `npm test`:

    npm test

## Contributing

Pull requests and stars are always welcome.

For bugs and feature requests, [please create an issue](https://github.com/azu/events-to-async/issues).

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## Author

- azu: [GitHub](https://github.com/azu), [Twitter](https://twitter.com/azu_re)

## License

MIT © azu

## Acknowledgement

- Node.js `event.on` and `event.once`: <https://github.com/nodejs/node/blob/master/lib/events.js>
- [rolftimmermans/event-iterator: Convert event emitters and event targets to ES async iterators](https://github.com/rolftimmermans/event-iterator)

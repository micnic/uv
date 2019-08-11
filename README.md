# uv
Ultrafast UTF-8 data validation

## Installation

`npm i uv`

### Works with Node.js 6.0+!

## Usage

`uv` exports a function that accepts a buffer as an argument and validate it.

```js
const uv = require('uv');

const someBuffer = Buffer.from('Some UTF-8 data');

uv(someBuffer); // => true

uv(Buffer.from([255, 254, 253, 252, 251, 250])); // => false
```

## Comparison with other UTF-8 validation packages

This module is a pure JavaScript implementation of UTF-8 validation, in most
cases it is faster than other alternatives, performance may vary based on OS,
node version or CPU, please run the `bench.js` file from the github repo for a
benchmark on your machine to compare it with other UTF-8 validation
implementations.
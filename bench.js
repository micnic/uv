'use strict';

const Benchmark = require('benchmark');

const uv = require('uv');
const isValidUTF8 = require('utf-8-validate');
const isUtf8 = require('isutf8');

const suite = new Benchmark.Suite;

const validBuffer = Buffer.from('abcdefghijklmnopqrstuvwxyz');
const invalidBuffer = Buffer.from(validBuffer);
const randomBuffer = Buffer.from(Array.from(Array(26).map(() => Math.floor(Math.random() * 255))));

// Invalidate UTF-8 data
invalidBuffer[Math.floor(validBuffer.length / 2)] = 255;

// add tests
suite
.add('uv valid buffer', () => {
	uv(validBuffer);
})
.add('uv invalid buffer', () => {
	uv(invalidBuffer);
})
.add('uv random buffer', () => {
	uv(randomBuffer);
})
.add('utf-8-validate valid buffer', () => {
	isValidUTF8(validBuffer);
})
.add('utf-8-validate invalid buffer', () => {
	isValidUTF8(invalidBuffer);
})
.add('utf-8-validate random buffer', () => {
	isValidUTF8(randomBuffer);
})
.add('isutf8 valid buffer', () => {
	isUtf8(validBuffer);
})
.add('isutf8 invalid buffer', () => {
	isUtf8(invalidBuffer);
})
.add('isutf8 random buffer', () => {
	isUtf8(randomBuffer);
})
// add listeners
.on('cycle', (event) => {
  console.log(String(event.target));
})
// run async
.run({ 'async': true });
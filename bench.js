'use strict';

const Benchmark = require('benchmark');

const https = require('https');

const uv = require('uv');
const isValidUTF8 = require('utf-8-validate');
const isValidUTF8Fallback = require('utf-8-validate/fallback');
const isUtf8 = require('isutf8');

https.get('https://ro.wikipedia.org/wiki/Pagina_principal%C4%83', (response) => {

	console.log('Loading Romanian Wikipedia main page ...');

	let content = Buffer.alloc(0);

	response.on('data', (data) => {
		content = Buffer.concat([content, data]);
	}).on('end', () => {

		const buffer = Buffer.from(content);

		const suite = new Benchmark.Suite;

		// add tests
		suite
		.add('uv', () => {
			uv(buffer);
		})
		.add('utf-8-validate (default, C++)', () => {
			isValidUTF8(buffer);
		})
		.add('utf-8-validate (fallback, JS)', () => {
			isValidUTF8Fallback(buffer);
		})
		.add('isutf8', () => {
			isUtf8(buffer);
		})
		// add listeners
		.on('cycle', (event) => {
			console.log(String(event.target));
		})
		// run async
		.run({ 'async': true });
	});
});
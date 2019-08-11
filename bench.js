'use strict';

const Benchmark = require('benchmark');

const https = require('https');

const uv = require('uv');
const isValidUTF8 = require('utf-8-validate');
const isValidUTF8Fallback = require('utf-8-validate/fallback');
const isUtf8 = require('isutf8');

const { floor, pow, random } = Math;

const bench = (buffer, callback) => {

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
	.on('complete', () => {
		callback();
	})
	// run async
	.run({ 'async': true });
};

const generateBytes = (length) => {

	return Buffer.from(Array.from(Array(length)).map(() => floor(random() * 128)));
};

const loadPage = (url) => {

	return new Promise((resolve, reject) => {

		https.get(url, (response) => {

			let content = Buffer.alloc(0);

			response.on('data', (data) => {
				content = Buffer.concat([content, data]);
			}).on('end', () => {

				bench(Buffer.from(content), resolve);
			});
		}).on('error', (error) => {
			reject(error);
		});
	});
};

console.log(`Loading ${decodeURI('https://en.wikipedia.org/wiki/Main_Page')} ...`);

loadPage('https://en.wikipedia.org/wiki/Main_Page').then(() => {

	console.log('------------------------------------------------------------\n');
	console.log(`Loading ${decodeURI('https://ro.wikipedia.org/wiki/Pagina_principal%C4%83')} ...`);

	return loadPage('https://ro.wikipedia.org/wiki/Pagina_principal%C4%83')
}).then(() => {

	console.log('------------------------------------------------------------\n');
	console.log(`Loading ${decodeURI('https://ru.wikipedia.org/wiki/%D0%97%D0%B0%D0%B3%D0%BB%D0%B0%D0%B2%D0%BD%D0%B0%D1%8F_%D1%81%D1%82%D1%80%D0%B0%D0%BD%D0%B8%D1%86%D0%B0')} ...`);

	return loadPage('https://ru.wikipedia.org/wiki/%D0%97%D0%B0%D0%B3%D0%BB%D0%B0%D0%B2%D0%BD%D0%B0%D1%8F_%D1%81%D1%82%D1%80%D0%B0%D0%BD%D0%B8%D1%86%D0%B0');
}).then(() => {

	console.log('------------------------------------------------------------\n');
	console.log(`Loading ${decodeURI('https://ar.wikipedia.org/wiki/%D8%A7%D9%84%D8%B5%D9%81%D8%AD%D8%A9_%D8%A7%D9%84%D8%B1%D8%A6%D9%8A%D8%B3%D9%8A%D8%A9')} ...`);

	return loadPage('https://ar.wikipedia.org/wiki/%D8%A7%D9%84%D8%B5%D9%81%D8%AD%D8%A9_%D8%A7%D9%84%D8%B1%D8%A6%D9%8A%D8%B3%D9%8A%D8%A9');
}).then(() => {

	return new Promise((resolve) => {

		console.log('------------------------------------------------------------\n');
		console.log('Preparing 256B of random ASCII data');

		bench(generateBytes(pow(2, 8)), resolve);
	});
}).then(() => {

	return new Promise((resolve) => {

		console.log('------------------------------------------------------------\n');
		console.log('Preparing 1KB of random ASCII data');

		bench(generateBytes(pow(2, 10)), resolve);
	});
}).then(() => {

	return new Promise((resolve) => {

		console.log('------------------------------------------------------------\n');
		console.log('Preparing 64KB of random ASCII data');

		bench(generateBytes(pow(2, 16)), resolve);
	});
}).then(() => {

	return new Promise((resolve) => {

		console.log('------------------------------------------------------------\n');
		console.log('Preparing 1MB of random ASCII data');

		bench(generateBytes(pow(2, 20)), resolve);
	});
}).then(() => {

	return new Promise((resolve) => {

		console.log('------------------------------------------------------------\n');
		console.log('Preparing 4MB of random ASCII bytes');

		bench(generateBytes(pow(2, 22)), resolve);
	});
}).then(() => {

	console.log('------------------------------------------------------------\n');
	console.log('Preparing all valid UTF-8 bytes ~4.17 MB');

	let content = Buffer.alloc(0);

	let buffer = Buffer.alloc(0x80);

	for (let i = 0x00; i < 0x80; i++) {
		buffer[i] = i;
	}

	content = Buffer.concat([content, buffer]);

	buffer = Buffer.alloc((0xE0 - 0xC2) * (0xC0 - 0x80) * 2);

	for (let i = 0xC2; i < 0xE0; i++) {
		for (let j = 0x80; j < 0xC0; j++) {
			buffer[(i - 0xC2) * (0xC0 - 0x80) * 2 + (j - 0x80) * 2] = i;
			buffer[(i - 0xC2) * (0xC0 - 0x80) * 2 + (j - 0x80) * 2 + 1] = j;
		}
	}

	content = Buffer.concat([content, buffer]);

	buffer = Buffer.alloc((0xC0 - 0xA0) * (0xC0 - 0x80) * 3);

	for (let a = 0xE0; a < 0xE1; a++) {
		for (let b = 0xA0; b < 0xC0; b++) {
			for (let c = 0x80; c < 0xC0; c++) {
				buffer[(b - 0xA0) * (0xC0 - 0x80) * 3 + (c - 0x80) * 3] = a;
				buffer[(b - 0xA0) * (0xC0 - 0x80) * 3 + (c - 0x80) * 3 + 1] = b;
				buffer[(b - 0xA0) * (0xC0 - 0x80) * 3 + (c - 0x80) * 3 + 2] = c;
			}
		}
	}

	content = Buffer.concat([content, buffer]);

	buffer = Buffer.alloc((0xF0 - 0xE1 - 1) * (0xC0 - 0x80) * (0xC0 - 0x80) * 3);

	for (let a = 0xE1; a < 0xF0; a++) {

		if (a === 0xED) {
			continue;
		}

		for (let b = 0x80; b < 0xC0; b++) {
			for (let c = 0x80; c < 0xC0; c++) {

				if (a < 0xED) {
					buffer[(a - 0xE1) * (0xC0 - 0x80) * (0xC0 - 0x80) * 3 + (b - 0x80) * (0xC0 - 0x80) * 3 + (c - 0x80) * 3] = a;
					buffer[(a - 0xE1) * (0xC0 - 0x80) * (0xC0 - 0x80) * 3 + (b - 0x80) * (0xC0 - 0x80) * 3 + (c - 0x80) * 3 + 1] = b;
					buffer[(a - 0xE1) * (0xC0 - 0x80) * (0xC0 - 0x80) * 3 + (b - 0x80) * (0xC0 - 0x80) * 3 + (c - 0x80) * 3 + 2] = c;
				} else {
					buffer[(a - 0xE1 - 1) * (0xC0 - 0x80) * (0xC0 - 0x80) * 3 + (b - 0x80) * (0xC0 - 0x80) * 3 + (c - 0x80) * 3] = a;
					buffer[(a - 0xE1 - 1) * (0xC0 - 0x80) * (0xC0 - 0x80) * 3 + (b - 0x80) * (0xC0 - 0x80) * 3 + (c - 0x80) * 3 + 1] = b;
					buffer[(a - 0xE1 - 1) * (0xC0 - 0x80) * (0xC0 - 0x80) * 3 + (b - 0x80) * (0xC0 - 0x80) * 3 + (c - 0x80) * 3 + 2] = c;
				}

			}
		}
	}

	content = Buffer.concat([content, buffer]);

	buffer = Buffer.alloc((0xC0 - 0xA0) * (0xC0 - 0x80) * 3);

	for (let a = 0xED; a < 0xEE; a++) {
		for (let b = 0x80; b < 0xA0; b++) {
			for (let c = 0x80; c < 0xC0; c++) {
				buffer[(b - 0x80) * (0xC0 - 0x80) * 3 + (c - 0x80) * 3] = a;
				buffer[(b - 0x80) * (0xC0 - 0x80) * 3 + (c - 0x80) * 3 + 1] = b;
				buffer[(b - 0x80) * (0xC0 - 0x80) * 3 + (c - 0x80) * 3 + 2] = c;
			}
		}
	}

	content = Buffer.concat([content, buffer]);

	buffer = Buffer.alloc((0xC0 - 0x90) * (0xC0 - 0x80) * (0xC0 - 0x80) * 4);

	for (let a = 0xF0; a < 0xF1; a++) {
		for (let b = 0x90; b < 0xC0; b++) {
			for (let c = 0x80; c < 0xC0; c++) {
				for (let d = 0x80; d < 0xC0; d++) {
					buffer[(b - 0x90) * (0xC0 - 0x80) * (0xC0 - 0x80) * 4 + (c - 0x80) * (0xC0 - 0x80) * 4 + (d - 0x80) * 4] = a;
					buffer[(b - 0x90) * (0xC0 - 0x80) * (0xC0 - 0x80) * 4 + (c - 0x80) * (0xC0 - 0x80) * 4 + (d - 0x80) * 4 + 1] = b;
					buffer[(b - 0x90) * (0xC0 - 0x80) * (0xC0 - 0x80) * 4 + (c - 0x80) * (0xC0 - 0x80) * 4 + (d - 0x80) * 4 + 2] = c;
					buffer[(b - 0x90) * (0xC0 - 0x80) * (0xC0 - 0x80) * 4 + (c - 0x80) * (0xC0 - 0x80) * 4 + (d - 0x80) * 4 + 3] = d;
				}
			}
		}
	}

	content = Buffer.concat([content, buffer]);

	buffer = Buffer.alloc((0xF4 - 0xF1) * (0xC0 - 0x80) * (0xC0 - 0x80) * (0xC0 - 0x80) * 4);

	for (let a = 0xF1; a < 0xF4; a++) {
		for (let b = 0x80; b < 0xC0; b++) {
			for (let c = 0x80; c < 0xC0; c++) {
				for (let d = 0x80; d < 0xC0; d++) {
					buffer[(a - 0xF1) * (0xC0 - 0x80) * (0xC0 - 0x80) * (0xC0 - 0x80) * 4 + (b - 0x80) * (0xC0 - 0x80) * (0xC0 - 0x80) * 4 + (c - 0x80) * (0xC0 - 0x80) * 4 + (d - 0x80) * 4] = a;
					buffer[(a - 0xF1) * (0xC0 - 0x80) * (0xC0 - 0x80) * (0xC0 - 0x80) * 4 + (b - 0x80) * (0xC0 - 0x80) * (0xC0 - 0x80) * 4 + (c - 0x80) * (0xC0 - 0x80) * 4 + (d - 0x80) * 4 + 1] = b;
					buffer[(a - 0xF1) * (0xC0 - 0x80) * (0xC0 - 0x80) * (0xC0 - 0x80) * 4 + (b - 0x80) * (0xC0 - 0x80) * (0xC0 - 0x80) * 4 + (c - 0x80) * (0xC0 - 0x80) * 4 + (d - 0x80) * 4 + 2] = c;
					buffer[(a - 0xF1) * (0xC0 - 0x80) * (0xC0 - 0x80) * (0xC0 - 0x80) * 4 + (b - 0x80) * (0xC0 - 0x80) * (0xC0 - 0x80) * 4 + (c - 0x80) * (0xC0 - 0x80) * 4 + (d - 0x80) * 4 + 3] = d;
				}
			}
		}
	}

	content = Buffer.concat([content, buffer]);

	buffer = Buffer.alloc((0x90 - 0x80) * (0xC0 - 0x80) * (0xC0 - 0x80) * 4);

	for (let a = 0xF4; a < 0xF5; a++) {
		for (let b = 0x80; b < 0x90; b++) {
			for (let c = 0x80; c < 0xC0; c++) {
				for (let d = 0x80; d < 0xC0; d++) {
					buffer[(b - 0x80) * (0xC0 - 0x80) * (0xC0 - 0x80) * 4 + (c - 0x80) * (0xC0 - 0x80) * 4 + (d - 0x80) * 4] = a;
					buffer[(b - 0x80) * (0xC0 - 0x80) * (0xC0 - 0x80) * 4 + (c - 0x80) * (0xC0 - 0x80) * 4 + (d - 0x80) * 4 + 1] = b;
					buffer[(b - 0x80) * (0xC0 - 0x80) * (0xC0 - 0x80) * 4 + (c - 0x80) * (0xC0 - 0x80) * 4 + (d - 0x80) * 4 + 2] = c;
					buffer[(b - 0x80) * (0xC0 - 0x80) * (0xC0 - 0x80) * 4 + (c - 0x80) * (0xC0 - 0x80) * 4 + (d - 0x80) * 4 + 3] = d;
				}
			}
		}
	}

	bench(Buffer.concat([content, buffer]), () => {});
});
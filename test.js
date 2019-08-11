'use strict';

const tap = require('tap');

const uv = require('uv');

tap.test('Check uv validation', (test) => {

	test.ok(uv(Buffer.alloc(0)));

	test.ok(uv(Buffer.from([0x00]))); // 1
	test.ok(uv(Buffer.from([0x00, 0x00]))); // 1 + 1
	test.ok(uv(Buffer.from([0xC2, 0x80]))); // 2
	test.ok(uv(Buffer.from([0x00, 0x00, 0x00]))); // 1 + 1 + 1
	test.ok(uv(Buffer.from([0x00, 0xC2, 0x80]))); // 1 + 2
	test.ok(uv(Buffer.from([0xC2, 0x80, 0x00]))); // 2 + 1
	test.ok(uv(Buffer.from([0xE0, 0xA0, 0x80]))); // 3
	test.ok(uv(Buffer.from([0xE1, 0x80, 0x80]))); // 3
	test.ok(uv(Buffer.from([0xED, 0x80, 0x80]))); // 3
	test.ok(uv(Buffer.from([0x00, 0x00, 0x00, 0x00]))); // 1 + 1 + 1
	test.ok(uv(Buffer.from([0x00, 0x00, 0xC2, 0x80]))); // 1 + 1 + 2
	test.ok(uv(Buffer.from([0x00, 0xC2, 0x80, 0x00]))); // 1 + 2 + 1
	test.ok(uv(Buffer.from([0xC2, 0x80, 0x00, 0x00]))); // 2 + 1 + 1
	test.ok(uv(Buffer.from([0xC2, 0x80, 0xC2, 0x80]))); // 2 + 2
	test.ok(uv(Buffer.from([0x00, 0xE0, 0xA0, 0x80]))); // 1 + 3
	test.ok(uv(Buffer.from([0xE0, 0xA0, 0x80, 0x00]))); // 3 + 1
	test.ok(uv(Buffer.from([0x00, 0xE1, 0x80, 0x80]))); // 1 + 3
	test.ok(uv(Buffer.from([0xE1, 0x80, 0x80, 0x00]))); // 3 + 1
	test.ok(uv(Buffer.from([0x00, 0xED, 0x80, 0x80]))); // 1 + 3
	test.ok(uv(Buffer.from([0xED, 0x80, 0x80, 0x00]))); // 3 + 1
	test.ok(uv(Buffer.from([0xF0, 0x90, 0x80, 0x80]))); // 4
	test.ok(uv(Buffer.from([0xF1, 0x80, 0x80, 0x80]))); // 4
	test.ok(uv(Buffer.from([0xF4, 0x80, 0x80, 0x80]))); // 4

	test.ok(uv(Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00]))); // 1 + 1 + 1 + 1 + 1
	test.ok(uv(Buffer.from([0x00, 0x00, 0x00, 0xC2, 0x80]))); // 1 + 1 + 1 + 2
	test.ok(uv(Buffer.from([0x00, 0x00, 0xC2, 0x80, 0x00]))); // 1 + 1 + 2 + 1
	test.ok(uv(Buffer.from([0x00, 0xC2, 0x80, 0x00, 0x00]))); // 1 + 2 + 1 + 1
	test.ok(uv(Buffer.from([0xC2, 0x80, 0x00, 0x00, 0x00]))); // 2 + 1 + 1 + 1
	test.ok(uv(Buffer.from([0x00, 0xC2, 0x80, 0xC2, 0x80]))); // 1 + 2 + 2
	test.ok(uv(Buffer.from([0xC2, 0x80, 0x00, 0xC2, 0x80]))); // 2 + 1 + 2
	test.ok(uv(Buffer.from([0xC2, 0x80, 0xC2, 0x80, 0x00]))); // 2 + 2 + 1
	test.ok(uv(Buffer.from([0x00, 0x00, 0xE0, 0xA0, 0x80]))); // 1 + 1 + 3
	test.ok(uv(Buffer.from([0x00, 0xE0, 0xA0, 0x80, 0x00]))); // 1 + 3 + 1
	test.ok(uv(Buffer.from([0xE0, 0xA0, 0x80, 0x00, 0x00]))); // 3 + 1 + 1
	test.ok(uv(Buffer.from([0x00, 0x00, 0xE1, 0x80, 0x80]))); // 1 + 1 + 3
	test.ok(uv(Buffer.from([0x00, 0xE1, 0x80, 0x80, 0x00]))); // 1 + 3 + 1
	test.ok(uv(Buffer.from([0xE1, 0x80, 0x80, 0x00, 0x00]))); // 3 + 1 + 1
	test.ok(uv(Buffer.from([0x00, 0x00, 0xED, 0x80, 0x80]))); // 1 + 1 + 3
	test.ok(uv(Buffer.from([0x00, 0xED, 0x80, 0x80, 0x00]))); // 1 + 3 + 1
	test.ok(uv(Buffer.from([0xED, 0x80, 0x80, 0x00, 0x00]))); // 3 + 1 + 1
	test.ok(uv(Buffer.from([0xC2, 0x80, 0xE0, 0xA0, 0x80]))); // 2 + 3
	test.ok(uv(Buffer.from([0xE0, 0xA0, 0x80, 0xC2, 0x80]))); // 3 + 2
	test.ok(uv(Buffer.from([0xC2, 0x80, 0xE1, 0x80, 0x80]))); // 2 + 3
	test.ok(uv(Buffer.from([0xE1, 0x80, 0x80, 0xC2, 0x80]))); // 3 + 2
	test.ok(uv(Buffer.from([0xC2, 0x80, 0xED, 0x80, 0x80]))); // 2 + 3
	test.ok(uv(Buffer.from([0xED, 0x80, 0x80, 0xC2, 0x80]))); // 3 + 2
	test.ok(uv(Buffer.from([0x00, 0xF0, 0x90, 0x80, 0x80]))); // 1 + 4
	test.ok(uv(Buffer.from([0xF0, 0x90, 0x80, 0x80, 0x00]))); // 4 + 1
	test.ok(uv(Buffer.from([0x00, 0xF1, 0x80, 0x80, 0x80]))); // 1 + 4
	test.ok(uv(Buffer.from([0xF1, 0x80, 0x80, 0x80, 0x00]))); // 4 + 1
	test.ok(uv(Buffer.from([0x00, 0xF4, 0x80, 0x80, 0x80]))); // 1 + 4
	test.ok(uv(Buffer.from([0xF4, 0x80, 0x80, 0x80, 0x00]))); // 4 + 1

	test.ok(uv(Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]))); // 1 * 16
	test.ok(uv(Buffer.from([0xC2, 0x80, 0xC2, 0x80, 0xC2, 0x80, 0xC2, 0x80, 0xC2, 0x80, 0xC2, 0x80, 0xC2, 0x80, 0xC2, 0x80]))); // 2 * 8
	test.ok(uv(Buffer.from([0xE0, 0xA0, 0x80, 0xE0, 0xA0, 0x80, 0xE0, 0xA0, 0x80, 0xE0, 0xA0, 0x80, 0xE0, 0xA0, 0x80, 0x00]))); // 3 * 5 + 1
	test.ok(uv(Buffer.from([0xE1, 0x80, 0x80, 0xE1, 0x80, 0x80, 0xE1, 0x80, 0x80, 0xE1, 0x80, 0x80, 0xE1, 0x80, 0x80, 0x00]))); // 3 * 5 + 1
	test.ok(uv(Buffer.from([0xED, 0x80, 0x80, 0xED, 0x80, 0x80, 0xED, 0x80, 0x80, 0xED, 0x80, 0x80, 0xED, 0x80, 0x80, 0x00]))); // 3 * 5 + 1
	test.ok(uv(Buffer.from([0xF0, 0x90, 0x80, 0x80, 0xF0, 0x90, 0x80, 0x80, 0xF0, 0x90, 0x80, 0x80, 0xF0, 0x90, 0x80, 0x80]))); // 4 * 4
	test.ok(uv(Buffer.from([0xF1, 0x80, 0x80, 0x80, 0xF1, 0x80, 0x80, 0x80, 0xF1, 0x80, 0x80, 0x80, 0xF1, 0x80, 0x80, 0x80]))); // 4 * 4
	test.ok(uv(Buffer.from([0xF4, 0x80, 0x80, 0x80, 0xF4, 0x80, 0x80, 0x80, 0xF4, 0x80, 0x80, 0x80, 0xF4, 0x80, 0x80, 0x80]))); // 4 * 4

	test.ok(!uv(Buffer.from([0xC2, 0x00, 0x00, 0x00, 0x00]))); // 2x
	test.ok(!uv(Buffer.from([0x00, 0xC2, 0x00, 0x00, 0x00]))); // 1 + 2x
	test.ok(!uv(Buffer.from([0x00, 0x00, 0xC2, 0x00, 0x00]))); // 1 + 1 + 2x
	test.ok(!uv(Buffer.from([0xC2, 0x80, 0xC2, 0x00, 0x00]))); // 2 + 2x
	test.ok(!uv(Buffer.from([0xE0, 0xA0, 0x00, 0x00, 0x00]))); // 3x
	test.ok(!uv(Buffer.from([0xE1, 0x80, 0x00, 0x00, 0x00]))); // 3x
	test.ok(!uv(Buffer.from([0xED, 0x80, 0x00, 0x00, 0x00]))); // 3x
	test.ok(!uv(Buffer.from([0x00, 0xE0, 0xA0, 0x00, 0x00]))); // 1 + 3x
	test.ok(!uv(Buffer.from([0x00, 0xE1, 0x80, 0x00, 0x00]))); // 1 + 3x
	test.ok(!uv(Buffer.from([0x00, 0xED, 0x80, 0x00, 0x00]))); // 1 + 3x
	test.ok(!uv(Buffer.from([0xF0, 0x90, 0x80, 0x00, 0x00]))); // 4x
	test.ok(!uv(Buffer.from([0xF1, 0x80, 0x80, 0x00, 0x00]))); // 4x
	test.ok(!uv(Buffer.from([0xF4, 0x80, 0x80, 0x00, 0x00]))); // 4x
	test.ok(!uv(Buffer.from([0x80, 0x00, 0x00, 0x00, 0x00]))); // x

	test.end();
});
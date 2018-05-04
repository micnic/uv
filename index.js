'use strict';

// The following algorithm follows the UTF-8 automaton for validating any bytes
// sequence, it starts and should end in the inial state "a", if it gets to the
// invalid state "x" or ends in a different state then the bytes sequence is not
// a valid UTF-8 sequence. The invalid state "x" is not displayed for
// readability, the validation process can go to the invalid state from any
// other state.
//
// +---------+
// |         |-----------+
// |         |           | 00..7F
// |         |<----------+
// |         |                        C2..DF                         +---------+
// |         |------------------------------------------------------>|         |
// |         |                                                       |         |
// |         |           +-------------------------------+           |         |
// |         |    E0     |                               |  A0..BF   |         |
// |         |---------->|               c               |---------->|         |
// |         |           |                               |           |         |
// |         |           +-------------------------------+           |         |
// |         |                                                       |         |
// |         |         E1..EC, EE, EF          +---------+           |         |
// |         |-------------------------------->|         |           |         |
// |         |                                 |         |           |         |
// |         |           +---------+           |         |           |         |
// |         |    F0     |         |  90..BF   |         |           |         |
// |         |---------->|    f    |---------->|         |           |         |
// |         |           |         |           |         |           |         |
// |         |           +---------+           |         |           |         |
// |         |                                 |         |           |         |
// |         |           +---------+           |         |           |         |
// |         |  F1..F3   |         |  80..BF   |         |  80..BF   |         |
// |    a    |---------->|    g    |---------->|    d    |---------->|    b    |
// |         |           |         |           |         |           |         |
// |         |           +---------+           |         |           |         |
// |         |                                 |         |           |         |
// |         |           +---------+           |         |           |         |
// |         |    F4     |         |  80..8F   |         |           |         |
// |         |---------->|    h    |---------->|         |           |         |
// |         |           |         |           |         |           |         |
// |         |           +---------+           +---------+           |         |
// |         |                                                       |         |
// |         |           +-------------------------------+           |         |
// |         |    ED     |                               |  80..9F   |         |
// |         |---------->|               e               |---------->|         |
// |         |           |                               |           |         |
// |         |           +-------------------------------+           |         |
// |         |                                                       |         |
// |         |                        80..BF                         |         |
// |         |<------------------------------------------------------|         |
// +---------+                                                       +---------+

const a = 0; // Initial state and ending state
const b = 1; // Intermediate state for multi-byte UTF-8 sequence
const c = 2; // Intermediate state for 3-byte chars that starts with 0xE0
const d = 3; // Intermediate state for 3-byte and 4-byte chars
const e = 4; // Intermediate state for 3-byte chars that starts with 0xED
const f = 5; // Intermediate state for 4-byte chars that starts with 0xF0
const g = 6; // Intermediate state for 4-byte chars that starts with 0xF1 - 0xF3
const h = 7; // Intermediate state for 4-byte chars that starts with 0xF4
const x = 8; // Invalid state

const stateSize = 256; // Bytes in one state sequence 0x00 - 0xFF

const states = [
	a, a, a, a, a, a, a, a, a, a, a, a, a, a, a, a, // 000 - 00F ------+
	a, a, a, a, a, a, a, a, a, a, a, a, a, a, a, a, // 010 - 01F       |
	a, a, a, a, a, a, a, a, a, a, a, a, a, a, a, a, // 020 - 02F       |
	a, a, a, a, a, a, a, a, a, a, a, a, a, a, a, a, // 030 - 03F       |
	a, a, a, a, a, a, a, a, a, a, a, a, a, a, a, a, // 040 - 04F       |
	a, a, a, a, a, a, a, a, a, a, a, a, a, a, a, a, // 050 - 05F       |
	a, a, a, a, a, a, a, a, a, a, a, a, a, a, a, a, // 060 - 06F       |
	a, a, a, a, a, a, a, a, a, a, a, a, a, a, a, a, // 070 - 07F       | state a
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 080 - 08F       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 090 - 09F       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 0A0 - 0AF       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 0B0 - 0BF       |
	x, x, b, b, b, b, b, b, b, b, b, b, b, b, b, b, // 0C0 - 0CF       |
	b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, // 0D0 - 0DF       |
	c, d, d, d, d, d, d, d, d, d, d, d, d, e, d, d, // 0E0 - 0EF       |
	f, g, g, g, h, x, x, x, x, x, x, x, x, x, x, x, // 0F0 - 0FF ------+
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 100 - 10F ------+
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 110 - 11F       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 120 - 12F       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 130 - 13F       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 140 - 14F       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 150 - 15F       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 160 - 16F       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 170 - 17F       | state b
	a, a, a, a, a, a, a, a, a, a, a, a, a, a, a, a, // 180 - 18F       |
	a, a, a, a, a, a, a, a, a, a, a, a, a, a, a, a, // 190 - 19F       |
	a, a, a, a, a, a, a, a, a, a, a, a, a, a, a, a, // 1A0 - 1AF       |
	a, a, a, a, a, a, a, a, a, a, a, a, a, a, a, a, // 1B0 - 1BF       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 1C0 - 1CF       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 1D0 - 1DF       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 1E0 - 1EF       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 1F0 - 1FF ------+
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 200 - 20F ------+
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 210 - 21F       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 220 - 22F       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 230 - 23F       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 240 - 24F       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 250 - 25F       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 260 - 26F       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 270 - 27F       | state c
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 280 - 28F       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 290 - 29F       |
	b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, // 2A0 - 2AF       |
	b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, // 2B0 - 2BF       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 2C0 - 2CF       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 2D0 - 2DF       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 2E0 - 2EF       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 2F0 - 2FF ------+
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 300 - 30F ------+
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 310 - 31F       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 320 - 32F       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 330 - 33F       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 340 - 34F       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 350 - 35F       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 360 - 36F       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 370 - 37F       | state d
	b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, // 380 - 38F       |
	b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, // 390 - 39F       |
	b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, // 3A0 - 3AF       |
	b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, // 3B0 - 3BF       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 3C0 - 3CF       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 3D0 - 3DF       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 3E0 - 3EF       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 3F0 - 3FF ------+
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 400 - 40F ------+
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 410 - 41F       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 420 - 42F       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 430 - 43F       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 440 - 44F       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 450 - 45F       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 460 - 46F       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 470 - 47F       | state e
	b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, // 480 - 48F       |
	b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, b, // 490 - 49F       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 4A0 - 4AF       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 4B0 - 4BF       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 4C0 - 4CF       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 4D0 - 4DF       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 4E0 - 4EF       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 4F0 - 4FF ------+
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 500 - 50F ------+
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 510 - 51F       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 520 - 52F       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 530 - 53F       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 540 - 54F       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 550 - 55F       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 560 - 56F       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 570 - 57F       | state f
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 580 - 58F       |
	d, d, d, d, d, d, d, d, d, d, d, d, d, d, d, d, // 590 - 59F       |
	d, d, d, d, d, d, d, d, d, d, d, d, d, d, d, d, // 5A0 - 5AF       |
	d, d, d, d, d, d, d, d, d, d, d, d, d, d, d, d, // 5B0 - 5BF       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 5C0 - 5CF       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 5D0 - 5DF       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 5E0 - 5EF       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 5F0 - 5FF ------+
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 600 - 60F ------+
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 610 - 61F       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 620 - 62F       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 630 - 63F       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 640 - 64F       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 650 - 65F       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 660 - 66F       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 670 - 67F       | state g
	d, d, d, d, d, d, d, d, d, d, d, d, d, d, d, d, // 680 - 68F       |
	d, d, d, d, d, d, d, d, d, d, d, d, d, d, d, d, // 690 - 69F       |
	d, d, d, d, d, d, d, d, d, d, d, d, d, d, d, d, // 6A0 - 6AF       |
	d, d, d, d, d, d, d, d, d, d, d, d, d, d, d, d, // 6B0 - 6BF       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 6C0 - 6CF       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 6D0 - 6DF       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 6E0 - 6EF       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 6F0 - 6FF ------+
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 700 - 70F ------+
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 710 - 71F       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 720 - 72F       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 730 - 73F       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 740 - 74F       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 750 - 75F       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 760 - 76F       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 770 - 77F       | state h
	d, d, d, d, d, d, d, d, d, d, d, d, d, d, d, d, // 780 - 78F       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 790 - 79F       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 7A0 - 7AF       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 7B0 - 7BF       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 7C0 - 7CF       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 7D0 - 7DF       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, // 7E0 - 7EF       |
	x, x, x, x, x, x, x, x, x, x, x, x, x, x, x, x  // 7F0 - 7FF ------+
];

module.exports = (buffer) => {

	const length = buffer.length;

	let byte = 0;
	let index = 0;
	let state = a;

	// Loop through all buffer bytes
	while (index < length) {

		// Save the byte reference
		byte = buffer[index];

		// Optimize for common ASCII bytes
		if (state === a && byte < 0x80) {
			index++;
			continue;
		}

		// Optimize for invalid bytes
		if (byte === 0xC0 || byte === 0xC1 || byte > 0xF4) {
			return false;
		}

		// Get next state
		state = states[(state * stateSize) + byte];

		// Check for invalid state
		if (state === x) {
			return false;
		}

		// Get the index of the next byte
		index++;
	}

	// Check for invalid state at the end of validation
	if (state !== a) {
		return false;
	}

	return true;
};
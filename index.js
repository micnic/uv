'use strict';

// Below is the deterministic finite automaton used for UTF-8 data validation,
// it is added here for easier understanding of the algorithm used in the
// exported function. The validation process should start in the state "a" and
// should end in the same state to have a valid UTF-8 sequence, in any other
// case an invalid bytes sequence is received.
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

const one = (byte) => {

	return ((byte & 0x80) === 0); // 00..7F
};

const two = (byteA, byteB) => {

	return (
		(byteA & 0xE0) === 0xC0 &&
		(byteA & 0xFE) !== 0xC0 && // C2..DF
		(byteB & 0xC0) === 0x80    // 80..BF
	);
};

const three = (byteA, byteB, byteC) => {

	return (
		(
			byteA === 0xE0 &&          // E0
			(byteB & 0xE0) === 0xA0 || // A0..BF

			(byteA & 0xF0) === 0xE0 &&
			byteA !== 0xE0 &&
			byteA !== 0xED &&          // E1..EC, EE, EF
			(byteB & 0xC0) === 0x80 || // 80..BF

			byteA === 0xED &&          // ED
			(byteB & 0xE0) === 0x80    // 80..9F
		) &&
		(byteC & 0xC0) === 0x80        // 80..BF
	);
};

const four = (byteA, byteB, byteC, byteD) => {

	return (
		(
			(byteA === 0xF0 &&         // F0
			(byteB & 0xF0) !== 0x80 || // 80..BF

			(byteA & 0xFC) === 0xF0 &&
			(byteA & 0x03) !== 0x00    // F1..F3
		) &&
		(byteB & 0xC0) === 0x80 ||     // 80..BF

		byteA === 0xF4 &&              // F4
		(byteB & 0xF0) === 0x80) &&    // 80..8F
		(byteC & 0xC0) === 0x80 &&     // 80..BF
		(byteD & 0xC0) === 0x80        // 80..BF
	);
};

module.exports = (buffer) => {

	const length = buffer.length;
	const stop = length - 3;

	let byteA = 0;
	let byteB = 0;
	let byteC = 0;
	let byteD = 0;

	let index = 0;

	// Loop through all buffer bytes
	while (index < stop) {

		// Read next 4 bytes
		byteA = buffer[index];
		byteB = buffer[index + 1];
		byteC = buffer[index + 2];
		byteD = buffer[index + 3];

		// Check for one byte character
		if (one(byteA)) {

			// Optimize for reading the next 3 bytes
			if (
				one(byteB) && one(byteC) && one(byteD) ||
				one(byteB) && two(byteC, byteD) ||
				two(byteB, byteC) && one(byteD) ||
				three(byteB, byteC, byteD)
			) {
				index += 4;
			} else if (one(byteB) && one(byteC) || two(byteB, byteC)) {
				index += 3;
			} else if (one(byteB)) {
				index += 2;
			} else {
				index++;
			}

		// Check for 2 bytes sequence
		} else if (two(byteA, byteB)) {

			// Optimize for reading the next 2 bytes
			if (one(byteC) && one(byteB) || two(byteC, byteD)) {
				index += 4;
			} else if (one(byteC)) {
				index += 3;
			} else {
				index += 2;
			}

		// Check for 3 bytes sequence
		} else if (three(byteA, byteB, byteC)) {

			// Optimize for reading the next byte
			if (one(byteD)) {
				index += 4;
			} else {
				index += 3;
			}

		// Check for 4 bytes sequence
		} else if (four(byteA, byteB, byteC, byteD)) {
			index += 4;
		} else {
			return false;
		}
	}

	// Check for trailing bytes that were not covered in the previous loop
	if (index < length) {

		// Check for how many bytes remains, up to 3 bytes
		if (length - index === 1) {

			// Read next byte
			byteA = buffer[index];

			return one(byteA);
		} else if (length - index === 2) {

			// Read next 2 bytes
			byteA = buffer[index];
			byteB = buffer[index + 1];

			return (one(byteA) && one(byteB) || two(byteA, byteB));
		} else {

			// Read next 3 bytes
			byteA = buffer[index];
			byteB = buffer[index + 1];
			byteC = buffer[index + 2];

			return (
				one(byteA) && one(byteB) && one(byteC) ||
				one(byteA) && two(byteB, byteC) ||
				two(byteA, byteB) && one(byteC) ||
				three(byteA, byteB, byteC)
			);
		}
	}

	return true;
};
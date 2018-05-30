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

	return ((byte & 0x80) === 0x00); // 00..7F
};

const two = (bytes) => {

	return (
		(bytes & 0xE0C0) === 0xC080 &&
		(bytes & 0xFE00) !== 0xC000    // C2..DF 80..BF
	);
};

const three = (bytes) => {

	return (
		(bytes & 0xFFE0C0) === 0xE0A080 || // E0 A0..BF 80..BF

		(bytes & 0xF0C0C0) === 0xE08080 &&
		(bytes & 0xFF0000) !== 0xE00000 &&
		(bytes & 0xFF0000) !== 0xED0000 || // E1..EC | EE | EF 2*(80..BF)

		(bytes & 0xFFE0C0) === 0xED8080    // ED 80..9F 80..BF
	);
};

const four = (bytes) => {

	return (
		(
			(bytes & 0xFFC0C0C0) >>> 0 === 0xF0808080 &&
			(bytes & 0xF00000) !== 0x800000 ||           // F0 90..BF 2*(80..BF)

			(bytes & 0xFCC0C0C0) >>> 0 === 0xF0808080 &&
			(bytes & 0x03000000) !== 0x00                // F1..F3 3*(80..BF)
		) ||

		(bytes & 0xFFF0C0C0) >>> 0 === 0xF4808080        // F4 80..8F 2*(80..BF)
	);
};

const validOne = (byte) => {

	return one(byte);
};

const validTwoSingle = (bytes) => {

	return ((bytes & 0x8080) === 0x00);
};

const validFourSingle = (bytes) => {

	return ((bytes & 0x80808080) === 0x00);
};

const validTwo = (bytes) => {

	return (validTwoSingle(bytes) || two(bytes));
};

const validTwoDouble = (bytes) => {

	return (
		(bytes & 0xE0C0E0C0) >>> 0 === 0xC080C080 &&
		(bytes & 0xFE000000) >>> 0 !== 0xC0000000 &&
		(bytes & 0xFE00) !== 0xC000
	);
};

const validNextThree = (bytes) => {

	return (
		(
			(bytes & 0x80E0C0) === 0xC080 &&
			(bytes & 0xFE00) !== 0xC000
		) ||
		(
			(bytes & 0xE0C080) === 0xC08000 &&
			(bytes & 0xFE0000) !== 0xC00000
		) ||
		three(bytes)
	);
};

const validThree = (bytes) => {

	return (
		((bytes & 0x808080) === 0) ||
		validNextThree(bytes)
	);
};

module.exports = (buffer) => {

	const length = buffer.length;
	const stop = length - 3;

	let byteA = 0;
	let byteAB = 0;
	let byteABC = 0;
	let byteABCD = 0;

	let index = 0;

	// Loop through all buffer bytes
	while (index < stop) {

		// Read next 4 bytes as uint32 values
		byteA = buffer[index];
		byteAB = (byteA << 8) | buffer[index + 1];
		byteABC = (byteAB << 8) | buffer[index + 2];
		byteABCD = ((byteABC << 8) | buffer[index + 3]) >>> 0;

		// Optimize for 4 consecutive ASCII bytes
		if (validFourSingle(byteABCD)) {
			index += 4;

		// Check for one byte character
		} else if (one(byteA)) {

			// Optimize for reading the next 3 bytes
			if (validNextThree(byteABCD)) {
				index += 4;
			} else if (validTwo(byteABC)) {
				index += 3;
			} else if (validOne(byteAB)) {
				index += 2;
			} else {
				index++;
			}

		// Optimize for repeated 2 bytes sequence
		} else if (validTwoDouble(byteABCD)) {
			index += 4;

		// Check for 2 bytes sequence
		} else if (two(byteAB)) {

			// Optimize for reading the next 2 bytes
			if (validTwoSingle(byteABCD)) {
				index += 4;
			} else if (validOne(byteABC)) {
				index += 3;
			} else {
				index += 2;
			}

		// Check for 3 bytes sequence
		} else if (three(byteABC)) {

			// Optimize for reading the next byte
			if (validOne(byteABCD)) {
				index += 4;
			} else {
				index += 3;
			}

		// Check for 4 bytes sequence
		} else if (four(byteABCD)) {
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

			return validOne(byteA);
		} else if (length - index === 2) {

			// Read next 2 bytes
			byteA = buffer[index];
			byteAB = (byteA << 8) | buffer[index + 1];

			return validTwo(byteAB);
		} else {

			// Read next 3 bytes
			byteA = buffer[index];
			byteAB = (byteA << 8) | buffer[index + 1];
			byteABC = (byteAB << 8) | buffer[index + 2];

			return validThree(byteABC);
		}
	}

	return true;
};
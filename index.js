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

const validOne = (byte) => {

	return one(byte);
};

const validTwo = (byteA, byteB) => {

	return (one(byteA) && one(byteB) || two(byteA, byteB));
};

const validThree = (byteA, byteB, byteC) => {

	return (
		one(byteA) && one(byteB) && one(byteC) ||
		one(byteA) && two(byteB, byteC) ||
		two(byteA, byteB) && one(byteC) ||
		three(byteA, byteB, byteC)
	);
};

const validFour = (byteA, byteB, byteC, byteD) => {

	return (
		one(byteA) && one(byteB) && one(byteC) && one(byteD) ||
		one(byteA) && one(byteB) && two(byteC, byteD) ||
		one(byteA) && two(byteB, byteC) && one(byteD) ||
		two(byteA, byteB) && one(byteC) && one(byteD) ||
		one(byteA) && three(byteB, byteC, byteD) ||
		three(byteA, byteB, byteC) && one(byteD) ||
		two(byteA, byteB) && two(byteC, byteD) ||
		four(byteA, byteB, byteC, byteD)
	);
};

const validFive = (byteA, byteB, byteC, byteD, byteE) => {

	return (
		validOne(byteA) && validFour(byteB, byteC, byteD, byteE) ||
		validFour(byteA, byteB, byteC, byteD) && validOne(byteE) ||
		validTwo(byteA, byteB) && validThree(byteC, byteD, byteE) ||
		validThree(byteA, byteB, byteC) && validTwo(byteD, byteE)
	);
};

const validSix = (byteA, byteB, byteC, byteD, byteE, byteF) => {

	return (
		validOne(byteA) && validFive(byteB, byteC, byteD, byteE, byteF) ||
		validFive(byteA, byteB, byteC, byteD, byteE) && validOne(byteF) ||
		validTwo(byteA, byteB) && validFour(byteC, byteD, byteE, byteF) ||
		validFour(byteA, byteB, byteC, byteD) && validTwo(byteE, byteF) ||
		validThree(byteA, byteB, byteC) && validThree(byteD, byteE, byteF)
	);
}

const validSeven = (byteA, byteB, byteC, byteD, byteE, byteF, byteG) => {

	return (
		validOne(byteA) && validSix(byteB, byteC, byteD, byteE, byteF, byteG) ||
		validSix(byteA, byteB, byteC, byteD, byteE, byteF) && validOne(byteG) ||
		validTwo(byteA, byteB) && validFive(byteC, byteD, byteE, byteF, byteG) ||
		validFive(byteA, byteB, byteC, byteD, byteE) && validTwo(byteF, byteG) ||
		validThree(byteA, byteB, byteC) && validFour(byteD, byteE, byteF, byteG) ||
		validFour(byteA, byteB, byteC, byteD) && validThree(byteE, byteF, byteG)
	);
};

module.exports = (buffer) => {

	const length = buffer.length;
	const stop = length - 7;

	let byteA = 0;
	let byteB = 0;
	let byteC = 0;
	let byteD = 0;
	let byteE = 0;
	let byteF = 0;
	let byteG = 0;
	let byteH = 0;

	let index = 0;

	// Loop through all buffer bytes
	while (index < stop) {

		// Read next 8 bytes
		byteA = buffer[index];
		byteB = buffer[index + 1];
		byteC = buffer[index + 2];
		byteD = buffer[index + 3];
		byteE = buffer[index + 4];
		byteF = buffer[index + 5];
		byteG = buffer[index + 6];
		byteH = buffer[index + 7];

		// Check for one byte character
		if (one(byteA)) {

			// Optimize for reading the next 7 bytes
			if (validSeven(byteB, byteC, byteD, byteE, byteF, byteG, byteH)) {
				index += 8;
			} else if (validSix(byteB, byteC, byteD, byteE, byteF, byteG)) {
				index += 7;
			} else if (validFive(byteB, byteC, byteD, byteE, byteF)) {
				index += 6;
			} else if (validFour(byteB, byteC, byteD, byteE)) {
				index += 5;
			} else {
				return false;
			}

		// Check for 2 bytes sequence
		} else if (two(byteA, byteB)) {

			// Optimize for reading the next 6 bytes
			if (validSix(byteC, byteD, byteE, byteF, byteG, byteH)) {
				index += 8;
			} else if (validFive(byteC, byteD, byteE, byteF, byteG)) {
				index += 7;
			} else if (validFour(byteC, byteD, byteE, byteF)) {
				index += 6;
			} else if (validThree(byteC, byteD, byteE)) {
				index += 5;
			} else {
				return false;
			}

		// Check for 3 bytes sequence
		} else if (three(byteA, byteB, byteC)) {

			// Optimize for reading the next 5 bytes
			if (validFive(byteD, byteE, byteF, byteG, byteH)) {
				index += 8;
			} else if (validFour(byteD, byteE, byteF, byteG)) {
				index += 7;
			} else if (validThree(byteD, byteE, byteF)) {
				index += 6;
			} else if (validTwo(byteD, byteE)) {
				index += 5;
			} else {
				return false;
			}

		// Check for 4 bytes sequence
		} else if (four(byteA, byteB, byteC, byteD)) {

			// Optimize for reading the next 4 bytes
			if (validFour(byteE, byteF, byteG, byteH)) {
				index += 8;
			} else if (validThree(byteE, byteF, byteG)) {
				index += 7;
			} else if (validTwo(byteE, byteF)) {
				index += 6;
			} else if (validOne(byteE)) {
				index += 5;
			} else {
				return false;
			}
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
			byteB = buffer[index + 1];

			return validTwo(byteA, byteB);
		} else if (length - index === 3) {

			// Read next 3 bytes
			byteA = buffer[index];
			byteB = buffer[index + 1];
			byteC = buffer[index + 2];

			return validThree(byteA, byteB, byteC);
		} else if (length - index === 4) {

			// Read next 4 bytes
			byteA = buffer[index];
			byteB = buffer[index + 1];
			byteC = buffer[index + 2];
			byteD = buffer[index + 3];

			return validFour(byteA, byteB, byteC, byteD);
		} else if (length - index === 5) {

			// Read next 5 bytes
			byteA = buffer[index];
			byteB = buffer[index + 1];
			byteC = buffer[index + 2];
			byteD = buffer[index + 3];
			byteE = buffer[index + 4];

			return validFive(byteA, byteB, byteC, byteD, byteE);
		} else if (length - index === 6) {

			// Read next 6 bytes
			byteA = buffer[index];
			byteB = buffer[index + 1];
			byteC = buffer[index + 2];
			byteD = buffer[index + 3];
			byteE = buffer[index + 4];
			byteF = buffer[index + 5];

			return validSix(byteA, byteB, byteC, byteD, byteE, byteF);
		} else {

			// Read next 7 bytes
			byteA = buffer[index];
			byteB = buffer[index + 1];
			byteC = buffer[index + 2];
			byteD = buffer[index + 3];
			byteE = buffer[index + 4];
			byteF = buffer[index + 5];
			byteG = buffer[index + 6];

			return validSeven(byteA, byteB, byteC, byteD, byteE, byteF, byteG);
		}
	}

	return true;
};
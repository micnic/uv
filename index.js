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

module.exports = (buffer) => {

	const length = buffer.length;

	let byteA = 0;
	let byteB = 0;
	let byteC = 0;
	let byteD = 0;

	let index = 0;

	// Loop through all buffer bytes
	while (index < length) {

		// Read next 4 bytes
		byteA = buffer[index];
		byteB = buffer[index + 1];
		byteC = buffer[index + 2];
		byteD = buffer[index + 3];

		// Optimize for 4 consecutive ASCII bytes
		if (
			(byteA & 0x80) === 0 &&                               // 00..7F
			(byteB & 0x80) === 0 &&                               // 00..7F
			(byteC & 0x80) === 0 &&                               // 00..7F
			(byteD & 0x80) === 0                                  // 00..7F
		) {
			index += 4;

		// Check for one ASCII bytes
		} else if ((byteA & 0x80) === 0) {                        // 00..7F
			index++;

		// Check for 2 bytes sequence
		} else if (
			(byteA & 0xE0) === 0xC0 && byteA > 0xC1 &&            // C2..DF
			(byteB & 0xC0) === 0x80                               // 80..BF
		) {
			index += 2;

		// Check for 3 bytes sequence
		} else if (
			(
				byteA === 0xE0 &&                                 // E0
				(byteB & 0xE0) === 0xA0 ||                        // A0..BF
				byteA > 0xE0 && byteA < 0xF0 && byteA !== 0xED && // E1..EF !ED
				(byteB & 0xC0) === 0x80 ||                        // 80..BF
				byteA === 0xED &&                                 // ED
				(byteB & 0xE0) === 0x80                           // 80..9F
			) &&
			(byteC & 0xC0) === 0x80                               // 80..BF
		) {
			index += 3;

		// Check for 4 bytes sequence
		} else if (
			(
				(
					byteA === 0xF0 &&                             // F0
					(byteB & 0xF0) !== 0x80 ||                    // !80..8F
					byteA > 0xF0 && byteA < 0xF4                  // F1..F3
				) &&
				(byteB & 0xC0) === 0x80 ||                        // 80..BF
				byteA === 0xF4 &&                                 // F4
				(byteB & 0xF0) === 0x80                           // 80..8F
			) &&
			(byteC & 0xC0) === 0x80 &&                            // 80..BF
			(byteD & 0xC0) === 0x80                               // 80..BF
		) {
			index += 4;
		} else {
			return false;
		}
	}

	return true;
};
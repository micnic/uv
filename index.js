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

/**
 * @typedef {Buffer | Uint8Array} BufferData
 * @typedef {(byte: number) => boolean} SingleByteValidation
 * @typedef {(buffer: BufferData, index: number) => boolean} MultiByteValidation
 */

/**
 * Validate 00..7F bytes
 * @type {SingleByteValidation}
 */
const aa = (byte) => (byte < 0x80);

/**
 * Validate C2..DF bytes
 * @type {SingleByteValidation}
 */
const ab = (byte) => (byte - 0xC2 < 0x1E);

/**
 * Validate E0 byte
 * @type {SingleByteValidation}
 */
const ac = (byte) => (byte === 0xE0);

/**
 * Validate E0..EF bytes
 * @type {SingleByteValidation}
 */
const ad = (byte) => ((byte & 0xF0) === 0xE0);

/**
 * Validate ED byte
 * @type {SingleByteValidation}
 */
const ae = (byte) => (byte === 0xED);

/**
 * Validate F0 byte
 * @type {SingleByteValidation}
 */
const af = (byte) => (byte === 0xF0);

/**
 * Validate F1..F3 bytes
 * @type {SingleByteValidation}
 */
const ag = (byte) => (byte - 0xF1 < 0x03);

/**
 * Validate F4 byte
 * @type {SingleByteValidation}
 */
const ah = (byte) => (byte === 0xF4);

/**
 * Validate 80..BF bytes
 * @type {SingleByteValidation}
 */
const ba = (byte) => ((byte & 0xC0) === 0x80);

/**
 * Validate A0..BF bytes
 * @type {SingleByteValidation}
 */
const cb = (byte) => ((byte & 0xE0) === 0xA0);

/**
 * Validate 80..9F bytes
 * @type {SingleByteValidation}
 */
const eb = (byte) => ((byte & 0xE0) === 0x80);

/**
 * Validate 90..BF bytes
 * @type {SingleByteValidation}
 */
const fd = (byte) => (byte - 0x90 < 0x30);

/**
 * Validate 80..8F bytes
 * @type {SingleByteValidation}
 */
const hd = (byte) => ((byte & 0xF0) === 0x80);

/**
 * Validate A0..BF -> 80..BF byte sequence
 * @type {MultiByteValidation}
 */
const ca = (b, i) => (cb(b[i]) && ba(b[i + 1]));

/**
 * Validate 80..BF -> 80..BF byte sequence
 * @type {MultiByteValidation}
 */
const da = (b, i) => (ba(b[i]) && ba(b[i + 1]));

/**
 * Validate 80..9F -> 80..BF byte sequence
 * @type {MultiByteValidation}
 */
const ea = (b, i) => (eb(b[i]) && ba(b[i + 1]));

/**
 * Validate 90..BF -> 80..BF -> 80..BF byte sequence
 * @type {MultiByteValidation}
 */
const fa = (b, i) => (fd(b[i]) && da(b, i + 1));

/**
 * Validate 80..BF -> 80..BF -> 80..BF byte sequence
 * @type {MultiByteValidation}
 */
const ga = (b, i) => (ba(b[i]) && da(b, i + 1));

/**
 * Validate 80..8F -> 80..BF -> 80..BF byte sequence
 * @type {MultiByteValidation}
 */
const ha = (b, i) => (hd(b[i]) && da(b, i + 1));

/**
 * Validate C2..DF -> 80..BF byte sequence
 * @type {MultiByteValidation}
 */
const aba = (b, i) => (ab(b[i]) && ba(b[i + 1]));

/**
 * Validate E0 -> A0..BF -> 80..BF byte sequence
 * @type {MultiByteValidation}
 */
const aca = (b, i) => (ac(b[i]) && ca(b, i + 1));

/**
 * Validate E1..EC, EE, EF -> 80..BF -> 80..BF byte sequence
 * @type {MultiByteValidation}
 */
const ada = (b, i) => (ad(b[i]) && !ac(b[i]) && !ae(b[i]) && da(b, i + 1));

/**
 * Validate ED -> 80..9F -> 80..BF byte sequence
 * @type {MultiByteValidation}
 */
const aea = (b, i) => (ae(b[i]) && ea(b, i + 1));

/**
 * Validate F0 -> 90..BF -> 80..BF -> 80..BF byte sequence
 * @type {MultiByteValidation}
 */
const afa = (b, i) => (af(b[i]) && fa(b, i + 1));

/**
 * Validate F1..F3 -> 80..BF -> 80..BF -> 80..BF byte sequence
 * @type {MultiByteValidation}
 */
const aga = (b, i) => (ag(b[i]) && ga(b, i + 1));

/**
 * Validate F4 -> 80..8F -> 80..BF -> 80..BF byte sequence
 * @type {MultiByteValidation}
 */
const aha = (b, i) => (ah(b[i]) && ha(b, i + 1));

/**
 * Validate a 00..7F sequence of 4 bytes
 * @type {MultiByteValidation}
 */
const aam = (b, i) => aa(b[i] | b[i + 1] | b[i + 2] | b[i + 3]);

/**
 * Validate two C2..DF -> 80..BF sequences
 * @type {MultiByteValidation}
 */
const abm = (b, i) => (aba(b, i) && aba(b, i + 2));

/**
 * Validate trailing bytes in buffer
 * @param {BufferData} buffer
 * @param {number} index
 * @param {number} length
 * @returns {boolean}
 */
const vt = (buffer, index, length) => {

	// Check for one byte to validate
	if (length === 1) {

		// a -> a
		return aa(buffer[index]);
	}

	// Check for two bytes to validate
	if (length === 2) {

		// a -> a
		if (aa(buffer[index])) {

			// a -> a -> a
			return aa(buffer[index + 1]);
		}

		// a -> b -> a
		return aba(buffer, index);
	}

	// a -> a
	if (aa(buffer[index])) {

		// a -> a -> a
		if (aa(buffer[index + 1])) {

			// a -> a -> a -> a
			return aa(buffer[index + 2]);
		}

		// a -> a -> b -> a
		return aba(buffer, index + 1);

	// a -> b
	} else if (ab(buffer[index])) {

		// a -> b -> a -> a
		return ba(buffer[index + 1]) && aa(buffer[index + 2]);

	// a -> c
	} else if (ac(buffer[index])) {

		// a -> c -> b -> a
		return ca(buffer, index + 1);

	// a -> e
	} else if (ae(buffer[index])) {

		// a -> e -> b -> a
		return ea(buffer, index + 1);
	}

	// a -> d -> b -> a
	return ada(buffer, index);
};

/**
 * Validate UTF-8 data in the buffer
 * @param {BufferData} buffer
 * @param {number} [start]
 * @param {number} [end]
 * @returns {boolean}
 */
module.exports = (buffer, start = 0, end = buffer.length) => {

	const stop = end - 3;

	let byteA = 0;
	let byteB = 0;
	let index = start;

	// Loop through all buffer bytes
	while (index < stop) {

		// Cache first byte value
		byteA = buffer[index];

		// a -> a
		if (aa(byteA)) {

			// Cache second byte value
			byteB = buffer[index + 1];

			// a -> a -> a
			if (aa(byteB)) {

				// a -> a -> a -> a
				if (aa(buffer[index + 2])) {

					// a -> a -> a -> a -> a
					if (aa(buffer[index + 3])) {
						index += 4;

						// Optimize for 4 consecutive ASCII bytes
						while (index < stop && aam(buffer, index)) {
							index += 4;
						}
					} else {
						index += 3;
					}

				// a -> a -> a -> b
				} else if (ab(buffer[index + 2])) {

					// a -> a -> a -> b -> a
					if (ba(buffer[index + 3])) {
						index += 4;

					// a -> a -> a -> b -> x
					} else {
						return false;
					}

				// a -> a -> a -> ...
				} else {
					index += 2;
				}

			// a -> a -> b
			} else if (ab(byteB)) {

				// a -> a -> b -> a
				if (ba(buffer[index + 2])) {

					// a -> a -> b -> a -> a
					if (aa(buffer[index + 3])) {
						index += 4;

					// a -> a -> b -> a -> ...
					} else {
						index += 3;
					}

				// a -> a -> b -> x
				} else {
					return false;
				}

			// a -> a -> c
			} else if (ac(byteB)) {

				// a -> a -> c -> b -> a
				if (ca(buffer, index + 2)) {
					index += 4;

				// a -> a -> c -> b -> x
				} else {
					return false;
				}

			// a -> a -> e
			} else if (ae(byteB)) {

				// a -> a -> e -> b -> a
				if (ea(buffer, index + 2)) {
					index += 4;

				// a -> a -> e -> b -> x
				} else {
					return false;
				}

			// a -> a -> d
			} else if (ad(byteB)) {

				// a -> a -> d -> b -> a
				if (da(buffer, index + 2)) {
					index += 4;

				// a -> a -> d -> b -> x
				} else {
					return false;
				}

			// a -> a -> ...
			} else {
				index++;
			}

		// a -> b
		} else if (ab(byteA)) {

			// a -> b -> a
			if (ba(buffer[index + 1])) {

				// a -> b -> a -> a
				if (aa(buffer[index + 2])) {

					// a -> b -> a -> a -> a
					if (aa(buffer[index + 3])) {
						index += 4;

					// a -> b -> a -> a -> ...
					} else {
						index += 3;
					}

				// a -> b -> a -> b
				} else if (ab(buffer[index + 2])) {

					// a -> b -> a -> b -> a
					if (ba(buffer[index + 3])) {
						index += 4;

						// Optimize for repeated 2 bytes sequence
						while (index < stop && abm(buffer, index)) {
							index += 4;
						}

					// a -> b -> a -> b -> x
					} else {
						return false;
					}

				// a -> b -> a -> ...
				} else {
					index += 2;
				}

			// a -> b -> x
			} else {
				return false;
			}

		// a -> c
		} else if (ac(byteA)) {

			// a -> c -> b -> a
			if (ca(buffer, index + 1)) {

				// a -> c -> b -> a -> a
				if (aa(buffer[index + 3])) {
					index += 4;

				// a -> c -> b -> a -> ...
				} else {
					index += 3;

					// Optimize for repeated 3 bytes sequence (a -> c -> ...)
					while (index < stop && aca(buffer, index)) {
						index += 3;
					}
				}

			// a -> c -> x
			} else {
				return false;
			}

		// a -> e
		} else if (ae(byteA)) {

			// a -> e -> b -> a
			if (ea(buffer, index + 1)) {

				// a -> e -> b -> a -> a
				if (aa(buffer[index + 3])) {
					index += 4;

				// a -> e -> b -> a -> ...
				} else {
					index += 3;

					// Optimize for repeated 3 bytes sequence (a -> e -> ...)
					while (index < stop && aea(buffer, index)) {
						index += 3;
					}
				}

			// a -> e -> x
			} else {
				return false;
			}

		// a -> d
		} else if (ad(byteA)) {

			// a -> d -> b -> a
			if (da(buffer, index + 1)) {

				// a -> d -> b -> a -> a
				if (aa(buffer[index + 3])) {
					index += 4;

				// a -> d -> b -> a -> ...
				} else {
					index += 3;

					// Optimize for repeated 3 bytes sequence (a -> d -> ...)
					while (index < stop && ada(buffer, index)) {
						index += 3;
					}
				}

			// a -> d -> x
			} else {
				return false;
			}

		// a -> f
		} else if (af(byteA)) {

			// a -> f -> d -> b -> a
			if (fa(buffer, index + 1)) {
				index += 4;

				// Optimize for repeated 4 bytes sequence (a -> f -> ...)
				while (index < stop && afa(buffer, index)) {
					index += 4;
				}

			// a -> f -> x
			} else {
				return false;
			}

		// a -> g
		} else if (ag(byteA)) {

			// a -> g -> d -> b -> a
			if (ga(buffer, index + 1)) {
				index += 4;

				// Optimize for repeated 4 bytes sequence (a -> g -> ...)
				while (index < stop && aga(buffer, index)) {
					index += 4;
				}

			// a -> g -> x
			} else {
				return false;
			}

		// a -> h
		} else if (ah(byteA)) {

			// a -> h -> d -> b -> a
			if (ha(buffer, index + 1)) {
				index += 4;

				// Optimize for repeated 4 bytes sequence (a -> h -> ...)
				while (index < stop && aha(buffer, index)) {
					index += 4;
				}

			// a -> h -> x
			} else {
				return false;
			}

		// x
		} else {
			return false;
		}
	}

	// Check for trailing bytes that were not covered in the previous loop
	if (index < end) {
		return vt(buffer, index, end - index);
	}

	return true;
};
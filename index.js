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

const aa = (byte) => (byte < 0x80);
const ab = (byte) => (byte > 0xC1 && (byte & 0xE0) === 0xC0);
const ac = (byte) => (byte === 0xE0);
const ad = (byte) => ((byte & 0xF0) === 0xE0 && byte !== 0xE0 && byte !== 0xED);
const ae = (byte) => (byte === 0xED);
const af = (byte) => (byte === 0xF0);
const ag = (byte) => ((byte & 0xFC) === 0xF0 && (byte & 0x03) !== 0x00);
const ah = (byte) => (byte === 0xF4);
const ba = (byte) => ((byte & 0xC0) === 0x80);
const cb = (byte) => ((byte & 0xE0) === 0xA0);
const db = ba;
const eb = (byte) => ((byte & 0xE0) === 0x80);
const fd = (byte) => ((byte & 0xC0) === 0x80 && (byte & 0xF0) !== 0x80);
const gd = ba;
const hd = (byte) => ((byte & 0xF0) === 0x80);

const ca = (b, i) => (cb(b[i]) && ba(b[i + 1]));
const da = (b, i) => (db(b[i]) && ba(b[i + 1]));
const ea = (b, i) => (eb(b[i]) && ba(b[i + 1]));
const fa = (b, i) => (fd(b[i]) && da(b, i + 1));
const ga = (b, i) => (gd(b[i]) && da(b, i + 1));
const ha = (b, i) => (hd(b[i]) && da(b, i + 1));

const aba = (b, i) => (ab(b[i]) && ba(b[i + 1]));
const aca = (b, i) => (ac(b[i]) && ca(b, i + 1));
const ada = (b, i) => (ad(b[i]) && da(b, i + 1));
const aea = (b, i) => (ae(b[i]) && ea(b, i + 1));
const afa = (b, i) => (af(b[i]) && fa(b, i + 1));
const aga = (b, i) => (ag(b[i]) && ga(b, i + 1));
const aha = (b, i) => (ah(b[i]) && ha(b, i + 1));

const aao = (b, i) => aa(b[i] | b[i + 1] | b[i + 2] | b[i + 3]);
const abo = (b, i) => (ab(b[i] | b[i + 2]) && ba(b[i + 1] | b[i + 3]));

module.exports = (buffer) => {

	const { length } = buffer;

	let index = 0;
	let stop = length - 3;

	// Loop through all buffer bytes
	while (index < stop) {

		// a -> a
		if (aa(buffer[index])) {

			// a -> a -> a
			if (aa(buffer[index + 1])) {

				// a -> a -> a -> a
				if (aa(buffer[index + 2])) {

					// a -> a -> a -> a -> a
					if (aa(buffer[index + 3])) {
						index += 4;

						// Optimize for 4 consecutive ASCII bytes
						while (index < stop && aao(buffer, index)) {
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
			} else if (ab(buffer[index + 1])) {

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
			} else if (ac(buffer[index + 1])) {

				// a -> a -> c -> b -> a
				if (ca(buffer, index + 2)) {
					index += 4;

				// a -> a -> c -> b -> x
				} else {
					return false;
				}

			// a -> a -> d
			} else if (ad(buffer[index + 1])) {

				// a -> a -> d -> b -> a
				if (da(buffer, index + 2)) {
					index += 4;

				// a -> a -> d -> b -> x
				} else {
					return false;
				}

			// a -> a -> e
			} else if (ae(buffer[index + 1])) {

				// a -> a -> e -> b -> a
				if (ea(buffer, index + 2)) {
					index += 4;

				// a -> a -> e -> b -> x
				} else {
					return false;
				}

			// a -> a -> ...
			} else {
				index++;
			}

		// a -> b
		} else if (ab(buffer[index])) {

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
						while (index < stop && abo(buffer, index)) {
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
		} else if (ac(buffer[index])) {

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

			// a -> c -> x -> x
			} else {
				return false;
			}

		// a -> d
		} else if (ad(buffer[index])) {

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

			// a -> d -> x -> x
			} else {
				return false;
			}

		// a -> e
		} else if (ae(buffer[index])) {

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

			// a -> e -> x -> x
			} else {
				return false;
			}

		// a -> f
		} else if (af(buffer[index])) {

			// a -> f -> d -> b -> a
			if (fa(buffer, index + 1)) {
				index += 4;

				// Optimize for repeated 4 bytes sequence (a -> f -> ...)
				while (index < stop && afa(buffer, index)) {
					index += 4;
				}

			// a -> f -> x -> x -> x
			} else {
				return false;
			}

		// a -> g
		} else if (ag(buffer[index])) {

			// a -> g -> d -> b -> a
			if (ga(buffer, index + 1)) {
				index += 4;

				// Optimize for repeated 4 bytes sequence (a -> g -> ...)
				while (index < stop && aga(buffer, index)) {
					index += 4;
				}

			// a -> g -> x -> x -> x
			} else {
				return false;
			}

		// a -> h
		} else if (ah(buffer[index])) {

			// a -> h -> d -> b -> a
			if (ha(buffer, index + 1)) {
				index += 4;

				// Optimize for repeated 4 bytes sequence (a -> h -> ...)
				while (index < stop && aha(buffer, index)) {
					index += 4;
				}

			// a -> h -> x -> x -> x
			} else {
				return false;
			}

		// x
		} else {
			return false;
		}
	}

	// Check for trailing bytes that were not covered in the previous loop
	if (index < length) {

		// Get remaining bytes count
		stop = length - index;

		// Check for one byte to validate
		if (stop === 1) {

			// a -> a
			return aa(buffer[index]);
		}

		// Check for two bytes to validate
		if (stop === 2) {

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

		// a -> d
		} else if (ad(buffer[index])) {

			// a -> d -> b -> a
			return da(buffer, index + 1);
		}

		// a -> e -> b -> a
		return aea(buffer, index);
	}

	return true;
};
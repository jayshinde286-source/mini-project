/**
 * CRC32 Checksum Calculator
 * Implements standard IEEE 802.3 32-bit Cyclic Redundancy Check
 * conformed with java.util.zip.CRC32.
 */

// Precomputed standard polynomial lookup table
const CRC32_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  CRC32_TABLE[i] = c >>> 0;
}

export function computeCRC32(data) {
  let buf;
  if (typeof data === 'string') {
    buf = Buffer.from(data, 'utf-8');
  } else if (Buffer.isBuffer(data)) {
    buf = data;
  } else if (data instanceof Uint8Array) {
    buf = Buffer.from(data);
  } else {
    buf = Buffer.from(JSON.stringify(data), 'utf-8');
  }

  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ (-1)) >>> 0;
}

export function computeCRC32Hex(data) {
  return computeCRC32(data).toString(16).toUpperCase().padStart(8, '0');
}

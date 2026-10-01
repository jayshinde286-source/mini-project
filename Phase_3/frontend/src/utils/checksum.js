/**
 * CRC32 Checksum implementation matching java.util.zip.CRC32 & ChecksumUtil.crc32Hex
 */
const makeCRCTable = () => {
  let c;
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[n] = c;
  }
  return crcTable;
};

const crcTable = makeCRCTable();

export const crc32 = (str) => {
  const utf8 = new TextEncoder().encode(str);
  let crc = 0 ^ (-1);
  for (let i = 0; i < utf8.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ utf8[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
};

export const crc32Hex = (str) => {
  return crc32(str).toString(16).toUpperCase();
};

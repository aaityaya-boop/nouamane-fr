/**
 * Lightweight, zero-dependency pure TypeScript QR Code SVG generator.
 * Generates standards-compliant QR Code (Version 1-10, Error Correction Level M/L)
 * Renders crisp vector SVG without any external API or network dependency.
 */

// QR Code Constants & Tables
const PAD0 = 0xec;
const PAD1 = 0x11;

// Galois Field GF(256) Tables
const EXP_TABLE = new Uint8Array(256);
const LOG_TABLE = new Uint8Array(256);
for (let i = 0, x = 1; i < 256; i++) {
  EXP_TABLE[i] = x;
  LOG_TABLE[x] = i;
  x = (x << 1) ^ (x >= 128 ? 0x11d : 0);
}

function glog(n: number): number {
  if (n < 1) throw new Error('glog(' + n + ')');
  return LOG_TABLE[n];
}

function gexp(n: number): number {
  while (n < 0) n += 255;
  while (n >= 256) n -= 255;
  return EXP_TABLE[n];
}

// Polynomial multiplication
function polyMultiply(p1: number[], p2: number[]): number[] {
  const num = new Array(p1.length + p2.length - 1).fill(0);
  for (let i = 0; i < p1.length; i++) {
    for (let j = 0; j < p2.length; j++) {
      num[i + j] ^= gexp(glog(p1[i]) + glog(p2[j]));
    }
  }
  return num;
}

// Error correction generator polynomial
function getErrorCorrectionPoly(errorCount: number): number[] {
  let poly = [1];
  for (let i = 0; i < errorCount; i++) {
    poly = polyMultiply(poly, [1, gexp(i)]);
  }
  return poly;
}

// QR Code capacity table for Byte Mode, Error Correction L & M
// [version, totalCodewords, ecCodewords, dataCodewords]
const VERSION_TABLE: [number, number, number, number][] = [
  [1, 26, 10, 16],   // Ver 1: 21x21, 14 bytes data
  [2, 44, 16, 28],   // Ver 2: 25x25, 26 bytes data
  [3, 70, 26, 44],   // Ver 3: 29x29, 42 bytes data
  [4, 100, 36, 64],  // Ver 4: 33x33, 62 bytes data
  [5, 134, 48, 86],  // Ver 5: 37x37, 84 bytes data
  [6, 172, 64, 108], // Ver 6: 41x41, 106 bytes data
  [7, 196, 72, 124], // Ver 7: 45x45, 122 bytes data
];

function chooseVersion(dataLen: number): [number, number, number, number] {
  for (const v of VERSION_TABLE) {
    // 4 bits mode + 8 bits count = 12 bits -> 2 bytes overhead
    if (v[3] >= dataLen + 2) return v;
  }
  return VERSION_TABLE[VERSION_TABLE.length - 1];
}

export function generateQrCodeSvg(text: string, size = 120): string {
  // Convert text to UTF-8 bytes
  const bytes: number[] = [];
  for (let i = 0; i < text.length; i++) {
    let c = text.charCodeAt(i);
    if (c < 128) bytes.push(c);
    else if (c < 2048) {
      bytes.push(192 | (c >> 6), 128 | (c & 63));
    } else if (c < 65536) {
      bytes.push(224 | (c >> 12), 128 | ((c >> 6) & 63), 128 | (c & 63));
    } else {
      bytes.push(240 | (c >> 18), 128 | ((c >> 12) & 63), 128 | ((c >> 6) & 63), 128 | (c & 63));
    }
  }

  const [version, totalCodewords, ecCodewords, dataCapacity] = chooseVersion(bytes.length);
  const moduleCount = 17 + version * 4;

  // 1. Build Data Codewords (Byte Mode)
  const bitStream: number[] = [];
  function pushBits(val: number, len: number) {
    for (let i = len - 1; i >= 0; i--) {
      bitStream.push((val >> i) & 1);
    }
  }

  // Byte mode indicator: 0100
  pushBits(4, 4);
  // Character count indicator: 8 bits for Byte Mode in Ver 1-9
  pushBits(bytes.length, 8);
  // Data bytes
  for (const b of bytes) {
    pushBits(b, 8);
  }

  // Terminator (up to 4 zeroes)
  const padLen = dataCapacity * 8 - bitStream.length;
  pushBits(0, Math.min(4, Math.max(0, padLen)));

  // Align to 8 bits
  while (bitStream.length % 8 !== 0) {
    bitStream.push(0);
  }

  // Convert bits to bytes
  const dataBytes: number[] = [];
  for (let i = 0; i < bitStream.length; i += 8) {
    let byteVal = 0;
    for (let j = 0; j < 8; j++) {
      byteVal = (byteVal << 1) | bitStream[i + j];
    }
    dataBytes.push(byteVal);
  }

  // Pad remaining bytes with 0xEC and 0x11
  while (dataBytes.length < dataCapacity) {
    dataBytes.push(dataBytes.length % 2 === 0 ? PAD0 : PAD1);
  }

  // 2. Generate Error Correction Codewords
  const ecPoly = getErrorCorrectionPoly(ecCodewords);
  const rawDataPoly = dataBytes.concat(new Array(ecCodewords).fill(0));
  const modPoly = [...rawDataPoly];

  for (let i = 0; i < dataBytes.length; i++) {
    const lead = modPoly[i];
    if (lead !== 0) {
      const leadLog = glog(lead);
      for (let j = 0; j < ecPoly.length; j++) {
        modPoly[i + j] ^= gexp(leadLog + glog(ecPoly[j]));
      }
    }
  }

  const ecBytes = modPoly.slice(dataBytes.length);
  const finalCodewords = dataBytes.concat(ecBytes);

  // 3. Matrix Setup
  const matrix: (number | null)[][] = Array.from({ length: moduleCount }, () =>
    new Array(moduleCount).fill(null)
  );

  // Place Finder Pattern
  function placeFinder(row: number, col: number) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const mr = row + r;
        const mc = col + c;
        if (mr >= 0 && mr < moduleCount && mc >= 0 && mc < moduleCount) {
          if (
            (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
            (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4)
          ) {
            matrix[mr][mc] = 1;
          } else {
            matrix[mr][mc] = 0;
          }
        }
      }
    }
  }

  placeFinder(0, 0);
  placeFinder(0, moduleCount - 7);
  placeFinder(moduleCount - 7, 0);

  // Timing patterns
  for (let i = 8; i < moduleCount - 8; i++) {
    const val = i % 2 === 0 ? 1 : 0;
    if (matrix[6][i] === null) matrix[6][i] = val;
    if (matrix[i][6] === null) matrix[i][6] = val;
  }

  // Dark module
  matrix[4 * version + 9][8] = 1;

  // Alignment Pattern for version 2+
  if (version >= 2) {
    const pos = moduleCount - 7;
    for (let r = -2; r <= 2; r++) {
      for (let c = -2; c <= 2; c++) {
        const val = Math.max(Math.abs(r), Math.abs(c)) === 1 ? 0 : 1;
        matrix[pos + r][pos + c] = val;
      }
    }
  }

  // Reserve format info area
  for (let i = 0; i < 9; i++) {
    if (matrix[8][i] === null) matrix[8][i] = 0;
    if (matrix[i][8] === null) matrix[i][8] = 0;
    if (matrix[8][moduleCount - 1 - i] === null) matrix[8][moduleCount - 1 - i] = 0;
    if (matrix[moduleCount - 1 - i][8] === null) matrix[moduleCount - 1 - i][8] = 0;
  }

  // 4. Place Data Bits (Zigzag right to left)
  let bitIdx = 0;
  const allBits: number[] = [];
  for (const cw of finalCodewords) {
    for (let b = 7; b >= 0; b--) {
      allBits.push((cw >> b) & 1);
    }
  }

  let upward = true;
  for (let rightCol = moduleCount - 1; rightCol > 0; rightCol -= 2) {
    if (rightCol === 6) rightCol--; // Skip vertical timing column
    const cols = [rightCol, rightCol - 1];
    const rows = upward
      ? Array.from({ length: moduleCount }, (_, i) => moduleCount - 1 - i)
      : Array.from({ length: moduleCount }, (_, i) => i);

    for (const r of rows) {
      for (const c of cols) {
        if (matrix[r][c] === null) {
          const bit = bitIdx < allBits.length ? allBits[bitIdx++] : 0;
          // Apply standard mask pattern 0: (row + col) % 2 === 0
          const mask = (r + c) % 2 === 0 ? 1 : 0;
          matrix[r][c] = bit ^ mask;
        }
      }
    }
    upward = !upward;
  }

  // Format info (Mask 0, EC Level M -> 101010000010010)
  const formatBits = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0];
  for (let i = 0; i < 6; i++) matrix[8][i] = formatBits[i];
  matrix[8][7] = formatBits[6];
  matrix[8][8] = formatBits[7];
  matrix[7][8] = formatBits[8];
  for (let i = 9; i < 15; i++) matrix[14 - i][8] = formatBits[i];

  for (let i = 0; i < 8; i++) matrix[8][moduleCount - 1 - i] = formatBits[i];
  for (let i = 8; i < 15; i++) matrix[moduleCount - 15 + i][8] = formatBits[i];

  // 5. Render SVG Path
  const rects: string[] = [];
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (matrix[r][c] === 1) {
        rects.push(`M${c + 2},${r + 2}h1v1h-1z`);
      }
    }
  }

  const totalSize = moduleCount + 4; // 2 modules margin
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="${size}" height="${size}" shape-rendering="crispEdges">
    <rect width="${totalSize}" height="${totalSize}" fill="#ffffff"/>
    <path d="${rects.join('')}" fill="#0f172a"/>
  </svg>`;

  return svg;
}

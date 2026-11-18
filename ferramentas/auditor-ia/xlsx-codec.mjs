// Codec OOXML (.xlsx) 100% nativo usando Web CompressionStream / DecompressionStream.
// Carregado sob demanda via import() dinâmico para manter carregamento inicial ultrarrápido.

import { BRAND_CONFIG } from '../../data/brandConfig.mjs';
import { formatBRL, formatInt, formatPct, parsePtBrNumber } from './financial-engine.mjs';

const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8');

const MAX_ZIP_ENTRIES = 64;
const MAX_ENTRY_BYTES = 4 * 1024 * 1024;
const MAX_TOTAL_BYTES = 8 * 1024 * 1024;
const MAX_SHEET_ROWS = 2000;

// Tabela CRC-32 IEEE 802.3 pré-computada
const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    c = CRC32_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

async function deflateRaw(bytes) {
  if (typeof CompressionStream === 'undefined') {
    return { method: 0, compressed: bytes };
  }
  const stream = new CompressionStream('deflate-raw');
  const writer = stream.writable.getWriter();
  await writer.write(bytes);
  await writer.close();
  const out = new Uint8Array(await new Response(stream.readable).arrayBuffer());
  if (out.length >= bytes.length) {
    return { method: 0, compressed: bytes };
  }
  return { method: 8, compressed: out };
}

async function inflateRaw(bytes, expectedMaxBytes = MAX_ENTRY_BYTES) {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('Este navegador não suporta leitura nativa de arquivos .xlsx compactados. Exporte em CSV (;) e tente novamente.');
  }
  const stream = new DecompressionStream('deflate-raw');
  const writer = stream.writable.getWriter();
  const writePromise = writer.write(bytes).then(() => writer.close());

  const reader = stream.readable.getReader();
  const chunks = [];
  let total = 0;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (value) {
      total += value.byteLength;
      if (total > expectedMaxBytes) {
        await reader.cancel();
        throw new Error('Arquivo .xlsx excede o limite de segurança de memória.');
      }
      chunks.push(value);
    }
  }
  await writePromise;

  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}

/**
 * Monta um arquivo ZIP válido com entradas UTF-8 e compressão deflate-raw.
 * @param {Array<{ name: string, data: Uint8Array | string }>} entries
 */
async function buildZipArchive(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name);
    const rawBytes = typeof entry.data === 'string' ? encoder.encode(entry.data) : entry.data;
    const checksum = crc32(rawBytes);
    const { method, compressed } = await deflateRaw(rawBytes);

    // Local File Header (30 bytes + filename)
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(localHeader.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0x0800, true); // UTF-8
    lv.setUint16(8, method, true);
    lv.setUint16(10, 0x0000, true);
    lv.setUint16(12, 0x5421, true);
    lv.setUint32(14, checksum, true);
    lv.setUint32(18, compressed.length, true);
    lv.setUint32(22, rawBytes.length, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);

    localParts.push(localHeader, compressed);

    // Central Directory Header (46 bytes + filename)
    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(centralHeader.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0x0800, true);
    cv.setUint16(10, method, true);
    cv.setUint16(12, 0x0000, true);
    cv.setUint16(14, 0x5421, true);
    cv.setUint32(16, checksum, true);
    cv.setUint32(20, compressed.length, true);
    cv.setUint32(24, rawBytes.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);

    centralParts.push(centralHeader);
    offset += localHeader.length + compressed.length;
  }

  const centralSize = centralParts.reduce((acc, part) => acc + part.length, 0);
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  const totalBytes = offset + centralSize + eocd.length;
  const output = new Uint8Array(totalBytes);
  let cursor = 0;
  for (const part of localParts) {
    output.set(part, cursor);
    cursor += part.length;
  }
  for (const part of centralParts) {
    output.set(part, cursor);
    cursor += part.length;
  }
  output.set(eocd, cursor);
  return output;
}

function decodeXmlEntities(value) {
  return String(value ?? '')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number.parseInt(dec, 10)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function escapeXml(value) {
  return String(value ?? '')
    .replace(/[\u0000-\u0008\u000b-\u000c\u000e-\u001f]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function columnLettersToIndex(letters) {
  let col = 0;
  for (let i = 0; i < letters.length; i++) {
    col = col * 26 + (letters.charCodeAt(i) - 64);
  }
  return Math.max(0, col - 1);
}

function indexToColumnLetters(index) {
  let n = index + 1;
  let letters = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    letters = String.fromCharCode(65 + rem) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return letters;
}

/**
 * Lê um ArrayBuffer .xlsx (OOXML) no navegador ou Node e devolve matriz de strings [linha][coluna].
 * @param {ArrayBuffer | Uint8Array} inputBuffer
 * @returns {Promise<string[][]>}
 */
export async function parseXlsxBuffer(inputBuffer) {
  const bytes = inputBuffer instanceof Uint8Array ? inputBuffer : new Uint8Array(inputBuffer);
  if (bytes.byteLength < 22) {
    throw new Error('Arquivo .xlsx inválido ou corrompido.');
  }
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  // Localiza End of Central Directory (0x06054b50)
  const minPos = Math.max(0, bytes.length - 65557);
  let eocdOffset = -1;
  for (let i = bytes.length - 22; i >= minPos; i--) {
    if (dv.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset === -1) {
    throw new Error('Estrutura ZIP não encontrada no arquivo .xlsx.');
  }

  const totalEntries = dv.getUint16(eocdOffset + 10, true);
  const centralOffset = dv.getUint32(eocdOffset + 16, true);
  if (totalEntries > MAX_ZIP_ENTRIES) {
    throw new Error('Arquivo .xlsx excede o número máximo de entradas permitidas.');
  }

  const files = new Map();
  let ptr = centralOffset;
  let totalUncompressed = 0;

  for (let i = 0; i < totalEntries; i++) {
    if (ptr + 46 > bytes.length || dv.getUint32(ptr, true) !== 0x02014b50) {
      throw new Error('Cabeçalho de diretório inválido no .xlsx.');
    }
    const method = dv.getUint16(ptr + 10, true);
    const compSize = dv.getUint32(ptr + 20, true);
    const uncompSize = dv.getUint32(ptr + 24, true);
    const nameLen = dv.getUint16(ptr + 28, true);
    const extraLen = dv.getUint16(ptr + 30, true);
    const commentLen = dv.getUint16(ptr + 32, true);
    const localOffset = dv.getUint32(ptr + 42, true);
    const fileName = decoder.decode(bytes.subarray(ptr + 46, ptr + 46 + nameLen));
    ptr += 46 + nameLen + extraLen + commentLen;

    const needed = fileName === 'xl/sharedStrings.xml' ||
      fileName === 'xl/workbook.xml' ||
      fileName === 'xl/_rels/workbook.xml.rels' ||
      fileName.startsWith('xl/worksheets/sheet');

    if (!needed) continue;
    if (uncompSize > MAX_ENTRY_BYTES || totalUncompressed + uncompSize > MAX_TOTAL_BYTES) {
      throw new Error('Planilha excede o limite de tamanho suportado no navegador.');
    }
    if (localOffset + 30 > bytes.length || dv.getUint32(localOffset, true) !== 0x04034b50) {
      throw new Error('Entrada local inválida no arquivo .xlsx.');
    }

    const localNameLen = dv.getUint16(localOffset + 26, true);
    const localExtraLen = dv.getUint16(localOffset + 28, true);
    const dataStart = localOffset + 30 + localNameLen + localExtraLen;
    const slice = bytes.subarray(dataStart, dataStart + compSize);

    let unpacked;
    if (method === 0) {
      unpacked = slice;
    } else if (method === 8) {
      unpacked = await inflateRaw(slice, MAX_ENTRY_BYTES);
    } else {
      throw new Error(`Método de compressão ZIP (${method}) não suportado no arquivo .xlsx.`);
    }
    totalUncompressed += unpacked.byteLength;
    files.set(fileName, decoder.decode(unpacked));
  }

  // Lê sharedStrings.xml se existir
  const sharedStrings = [];
  if (files.has('xl/sharedStrings.xml')) {
    const ssXml = files.get('xl/sharedStrings.xml');
    const siMatches = ssXml.match(/<si\b[^>]*>[\s\S]*?<\/si>/g) || [];
    for (const si of siMatches) {
      const tMatches = [...si.matchAll(/<t(?:\s+[^>]*)?>([\s\S]*?)<\/t>/g)];
      sharedStrings.push(decodeXmlEntities(tMatches.map((m) => m[1]).join('')));
    }
  }

  // Descobre o arquivo XML da primeira aba
  let sheetPath = 'xl/worksheets/sheet1.xml';
  if (files.has('xl/workbook.xml') && files.has('xl/_rels/workbook.xml.rels')) {
    const wbXml = files.get('xl/workbook.xml');
    const relsXml = files.get('xl/_rels/workbook.xml.rels');
    const firstSheetMatch = wbXml.match(/<sheet\b[^>]*r:id="([^"]+)"/);
    if (firstSheetMatch) {
      const rid = firstSheetMatch[1];
      const relRegex = new RegExp(`<Relationship\\b[^>]*Id="${rid}"[^>]*Target="([^"]+)"`);
      const relAltRegex = new RegExp(`<Relationship\\b[^>]*Target="([^"]+)"[^>]*Id="${rid}"`);
      const targetMatch = relXmlMatch(relsXml, relRegex, relAltRegex);
      if (targetMatch) {
        const cleanTarget = targetMatch.replace(/^\/+/, '');
        sheetPath = cleanTarget.startsWith('xl/') ? cleanTarget : `xl/${cleanTarget}`;
      }
    }
  }

  if (!files.has(sheetPath)) {
    const fallbackSheet = [...files.keys()].find((k) => k.startsWith('xl/worksheets/sheet'));
    if (!fallbackSheet) {
      throw new Error('Nenhuma aba de planilha encontrada dentro do arquivo .xlsx.');
    }
    sheetPath = fallbackSheet;
  }

  const sheetXml = files.get(sheetPath);
  const rowMatches = sheetXml.match(/<row\b[^>]*>[\s\S]*?<\/row>/g) || [];
  const matrix = [];

  for (let r = 0; r < rowMatches.length && matrix.length < MAX_SHEET_ROWS; r++) {
    const rowXml = rowMatches[r];
    const rowValues = [];
    const cellMatches = rowXml.match(/<c\b[^>]*?(?:\/>|>[\s\S]*?<\/c>)/g) || [];
    let fallbackCol = 0;

    for (const cellXml of cellMatches) {
      const refMatch = cellXml.match(/\br="([A-Z]+)\d+"/);
      const colIndex = refMatch ? columnLettersToIndex(refMatch[1]) : fallbackCol;
      fallbackCol = colIndex + 1;

      const typeMatch = cellXml.match(/\bt="([^"]+)"/);
      const cellType = typeMatch ? typeMatch[1] : 'n';

      let val = '';
      if (cellType === 'inlineStr') {
        const tMatches = [...cellXml.matchAll(/<t(?:\s+[^>]*)?>([\s\S]*?)<\/t>/g)];
        val = decodeXmlEntities(tMatches.map((m) => m[1]).join(''));
      } else {
        const vMatch = cellXml.match(/<v(?:\s+[^>]*)?>([\s\S]*?)<\/v>/);
        if (vMatch) {
          const rawVal = decodeXmlEntities(vMatch[1]);
          if (cellType === 's') {
            val = sharedStrings[Number.parseInt(rawVal, 10)] ?? '';
          } else if (cellType === 'b') {
            val = rawVal === '1' ? 'SIM' : 'NÃO';
          } else {
            val = rawVal;
          }
        }
      }

      while (rowValues.length <= colIndex) rowValues.push('');
      rowValues[colIndex] = String(val).trim();
    }

    if (rowValues.some((cell) => cell !== '')) {
      matrix.push(rowValues);
    }
  }

  return matrix;
}

function relXmlMatch(xml, rxA, rxB) {
  const m1 = xml.match(rxA);
  if (m1) return m1[1];
  const m2 = xml.match(rxB);
  return m2 ? m2[1] : '';
}

function buildStylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="3">
    <numFmt numFmtId="164" formatCode="&quot;R$&quot; #,##0.00"/>
    <numFmt numFmtId="165" formatCode="0.0%"/>
    <numFmt numFmtId="166" formatCode="#,##0.0"/>
  </numFmts>
  <fonts count="7">
    <font><sz val="10"/><color rgb="FF101014"/><name val="Calibri"/></font>
    <font><b/><sz val="13"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
    <font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
    <font><b/><sz val="10"/><color rgb="FF101014"/><name val="Calibri"/></font>
    <font><b/><sz val="10"/><color rgb="FF991B1B"/><name val="Calibri"/></font>
    <font><b/><sz val="10"/><color rgb="FF065F46"/><name val="Calibri"/></font>
  </fonts>
  <fills count="7">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF08090B"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFE21B23"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF171A20"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF3F4F6"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFEF2F2"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FFD1D5DB"/></left>
      <right style="thin"><color rgb="FFD1D5DB"/></right>
      <top style="thin"><color rgb="FFD1D5DB"/></top>
      <bottom style="thin"><color rgb="FFD1D5DB"/></bottom>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="12">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="2" fillId="3" borderId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="3" fillId="4" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="4" fillId="5" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
    <xf numFmtId="164" fontId="0" fillId="0" borderId="1" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="top"/></xf>
    <xf numFmtId="164" fontId="5" fillId="6" borderId="1" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="top"/></xf>
    <xf numFmtId="165" fontId="0" fillId="0" borderId="1" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="top"/></xf>
    <xf numFmtId="3" fontId="0" fillId="0" borderId="1" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="top"/></xf>
    <xf numFmtId="166" fontId="0" fillId="0" borderId="1" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="top"/></xf>
    <xf numFmtId="0" fontId="6" fillId="5" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="5" fillId="6" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
  </cellXfs>
</styleSheet>`;
}

function buildWorksheetXml(rowsSpec, minColCount = 4) {
  const maxCols = Math.max(
    minColCount,
    rowsSpec.reduce((max, row) => Math.max(max, row.cells.length), 0)
  );
  const colWidths = new Array(maxCols).fill(14);

  for (const row of rowsSpec) {
    row.cells.forEach((cell, idx) => {
      if (!cell || cell.v === undefined || cell.v === null) return;
      const text = typeof cell.v === 'number'
        ? formatBRL(cell.v)
        : String(cell.v);
      const longestLine = text.split('\n').reduce((m, line) => Math.max(m, line.length), 0);
      const padded = Math.min(72, Math.max(14, Math.ceil(longestLine * 1.12) + 3));
      if (padded > colWidths[idx]) {
        colWidths[idx] = padded;
      }
    });
  }

  const colsXml = colWidths
    .map((width, idx) => `<col min="${idx + 1}" max="${idx + 1}" width="${width}" customWidth="1"/>`)
    .join('');

  const rowsXml = rowsSpec
    .map((row, rowIndex) => {
      const rNum = rowIndex + 1;
      const maxLines = row.cells.reduce((acc, cell) => {
        if (!cell || typeof cell.v !== 'string') return acc;
        const estimatedLines = cell.v.split('\n').reduce((lines, segment) => {
          const width = colWidths[0] || 40;
          return lines + Math.max(1, Math.ceil(segment.length / Math.max(24, width)));
        }, 0);
        return Math.max(acc, estimatedLines);
      }, 1);
      const customHeight = row.ht || (maxLines > 1 ? Math.min(260, 14 + maxLines * 14) : 20);

      const cellsXml = row.cells
        .map((cell, colIndex) => {
          if (!cell || cell.v === undefined || cell.v === null || cell.v === '') return '';
          const ref = `${indexToColumnLetters(colIndex)}${rNum}`;
          const styleIdx = Number.isInteger(cell.s) ? cell.s : 0;
          if (typeof cell.v === 'number' && Number.isFinite(cell.v)) {
            return `<c r="${ref}" s="${styleIdx}"><v>${cell.v}</v></c>`;
          }
          return `<c r="${ref}" t="inlineStr" s="${styleIdx}"><is><t xml:space="preserve">${escapeXml(cell.v)}</t></is></c>`;
        })
        .filter(Boolean)
        .join('');

      return `<row r="${rNum}" ht="${customHeight}" customHeight="1">${cellsXml}</row>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetViews><sheetView workbookViewId="0"/></sheetViews>
  <sheetFormatPr defaultRowHeight="20"/>
  <cols>${colsXml}</cols>
  <sheetData>${rowsXml}</sheetData>
</worksheet>`;
}

function buildWorkbookFromSheets(sheets) {
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-package.extended-properties+xml"/>
  ${sheets.map((_, idx) => `<Override PartName="/xl/worksheets/sheet${idx + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('\n  ')}
</Types>`;

  const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/package/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;

  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    ${sheets.map((s, idx) => `<sheet name="${escapeXml(s.name)}" sheetId="${idx + 1}" r:id="rId${idx + 1}"/>`).join('\n    ')}
  </sheets>
</workbook>`;

  const workbookRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${sheets.map((_, idx) => `<Relationship Id="rId${idx + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${idx + 1}.xml"/>`).join('\n  ')}
  <Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  const nowIso = new Date().toISOString();
  const coreXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>Auditoria de Lucro e Automação com IA — ${escapeXml(BRAND_CONFIG.brandName)}</dc:title>
  <dc:creator>${escapeXml(BRAND_CONFIG.founder)} (${escapeXml(BRAND_CONFIG.siteName)})</dc:creator>
  <dcterms:created xsi:type="dcterms:W3CDTF">${nowIso}</dcterms:created>
</cp:coreProperties>`;

  const appXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">
  <Application>${escapeXml(BRAND_CONFIG.siteName)}</Application>
</Properties>`;

  const entries = [
    { name: '[Content_Types].xml', data: contentTypes },
    { name: '_rels/.rels', data: rootRels },
    { name: 'docProps/core.xml', data: coreXml },
    { name: 'docProps/app.xml', data: appXml },
    { name: 'xl/workbook.xml', data: workbookXml },
    { name: 'xl/_rels/workbook.xml.rels', data: workbookRels },
    { name: 'xl/styles.xml', data: buildStylesXml() },
    ...sheets.map((s, idx) => ({
      name: `xl/worksheets/sheet${idx + 1}.xml`,
      data: buildWorksheetXml(s.rows, s.minCols || 4)
    }))
  ];

  return buildZipArchive(entries);
}

/**
 * Gera um arquivo .xlsx executivo completo com 3 abas:
 * 1) Diagnostico_Caixa
 * 2) Ferramentas_e_Scripts
 * 3) Plano_Implementacao_30D
 * @param {object} report
 * @returns {Promise<Uint8Array>}
 */
export async function buildExecutiveWorkbookXlsx(report) {
  const audit = report?.audit || {};
  const analysis = report?.analysis || {};
  const lead = report?.lead || {};
  const summary = audit.summary || {};
  const details = audit.details || {};
  const moduleId = audit.moduleId || 'whatsapp';
  const moduleNames = {
    whatsapp: 'Módulo A — Recuperação de Orçamentos no WhatsApp',
    pricing: 'Módulo B — Auditoria de Margem, Taxas e Precificação',
    automation: 'Módulo C — Automação e Produtividade da Equipe'
  };

  const companyName = String(lead.company || report?.company || 'Empresa Auditada').trim();
  const visitorName = String(lead.name || 'Visitante').trim();
  const visitorWhatsapp = String(lead.whatsapp || 'Não informado').trim();
  const generatedAt = new Date().toLocaleDateString('pt-BR');

  // --- ABA 1: Diagnostico_Caixa ---
  const sheet1Rows = [
    { ht: 28, cells: [{ v: `${BRAND_CONFIG.brandName} — Auditoria Executiva de Lucro & Automação com IA`, s: 1 }, { v: '', s: 1 }, { v: '', s: 1 }, { v: '', s: 1 }, { v: '', s: 1 }] },
    { cells: [{ v: 'Empresa / Negócio', s: 4 }, { v: companyName, s: 0 }, { v: 'Responsável', s: 4 }, { v: `${visitorName} (${visitorWhatsapp})`, s: 0 }] },
    { cells: [{ v: 'Nicho Auditado', s: 4 }, { v: audit.nicheLabel || 'PME', s: 0 }, { v: 'Módulo & Data', s: 4 }, { v: `${moduleNames[moduleId] || moduleId} · ${generatedAt}`, s: 0 }] },
    { cells: [] },
    { ht: 24, cells: [{ v: '1. INDICADORES FINANCEIROS AUDITADOS (DETERMINÍSTICOS)', s: 2 }, { v: '', s: 2 }, { v: '', s: 2 }, { v: '', s: 2 }] },
    { cells: [{ v: 'Indicador', s: 3 }, { v: 'Valor Auditado', s: 3 }, { v: 'Unidade / Horizonte', s: 3 }, { v: 'Leitura Executiva', s: 3 }] },
    { cells: [{ v: 'Vazamento / Oportunidade Mensal Identificada', s: 4 }, { v: Number(summary.monthlyLeakageBRL || 0), s: 6 }, { v: 'R$ / mês', s: 0 }, { v: 'Valor mensal em receita perdida, subprecificação ou retrabalho.', s: 0 }] },
    { cells: [{ v: 'Potencial de Caixa em 30 Dias (Meta Realista)', s: 4 }, { v: Number(summary.cashPotential30dBRL || 0), s: 6 }, { v: 'R$ em 30 dias', s: 0 }, { v: 'Recuperação viável já no primeiro mês de execução disciplinada.', s: 0 }] },
    { cells: [{ v: 'Faixa Conservadora em 30 Dias', s: 4 }, { v: Number(summary.cashConservative30dBRL || 0), s: 5 }, { v: 'R$ / mês', s: 0 }, { v: 'Cenário de implantação inicial com equipe atual.', s: 0 }] },
    { cells: [{ v: 'Faixa Agressiva / Teto em 30 Dias', s: 4 }, { v: Number(summary.cashAggressive30dBRL || 0), s: 5 }, { v: 'R$ / mês', s: 0 }, { v: 'Cenário com automação integrada + cadência comercial ativa.', s: 0 }] },
    { cells: [{ v: 'Projeção Acumulada em 12 Meses', s: 4 }, { v: Number(summary.projection12mBRL || 0), s: 6 }, { v: 'R$ / ano', s: 0 }, { v: 'Impacto acumulado em 1 ano mantendo a correção aplicada.', s: 0 }] },
    { cells: [{ v: 'Horas Operacionais Recuperadas / Mês', s: 4 }, { v: Number(summary.hoursRecoveredMonthly || 0), s: 9 }, { v: 'horas / mês', s: 0 }, { v: 'Capacidade liberada para atendimento estratégico e vendas.', s: 0 }] },
    { cells: [] },
    { ht: 24, cells: [{ v: '2. PROJEÇÃO DE CAIXA ACUMULADA (30 A 365 DIAS)', s: 2 }, { v: '', s: 2 }, { v: '', s: 2 }, { v: '', s: 2 }] },
    { cells: [{ v: 'Horizonte', s: 3 }, { v: 'Cenário Conservador (R$)', s: 3 }, { v: 'Cenário Realista / Meta (R$)', s: 3 }, { v: 'Cenário Otimizado (R$)', s: 3 }] }
  ];

  for (const [label, mult] of [['30 dias (1 mês)', 1], ['90 dias (3 meses)', 3], ['180 dias (6 meses)', 6], ['365 dias (12 meses)', 12]]) {
    sheet1Rows.push({
      cells: [
        { v: label, s: 4 },
        { v: Math.round((summary.cashConservative30dBRL || 0) * mult * 100) / 100, s: 5 },
        { v: Math.round((summary.cashPotential30dBRL || 0) * mult * 100) / 100, s: 6 },
        { v: Math.round((summary.cashAggressive30dBRL || 0) * mult * 100) / 100, s: 5 }
      ]
    });
  }

  sheet1Rows.push(
    { cells: [] },
    { ht: 24, cells: [{ v: '3. DADOS INFORMADOS & DETALHAMENTO DO MÓDULO', s: 2 }, { v: '', s: 2 }, { v: '', s: 2 }, { v: '', s: 2 }] }
  );

  if (moduleId === 'whatsapp') {
    sheet1Rows.push(
      { cells: [{ v: 'Orçamentos / Leads por Mês', s: 4 }, { v: Number(details.leadsPerMonth || 0), s: 8 }, { v: 'Taxa de Conversão Atual', s: 4 }, { v: Number(details.currentConversionPct || 0) / 100, s: 7 }] },
      { cells: [{ v: 'Ticket Médio (R$)', s: 4 }, { v: Number(details.averageTicket || 0), s: 5 }, { v: 'Margem Bruta (%)', s: 4 }, { v: Number(details.grossMarginPct || 0) / 100, s: 7 }] },
      { cells: [{ v: 'Leads Perdidos por Mês', s: 4 }, { v: Number(details.lostLeadsMonthly || 0), s: 9 }, { v: 'ROI Anualizado Estimado (%)', s: 4 }, { v: Number(details.annualRoiPct || 0) / 100, s: 7 }] }
    );
  } else if (moduleId === 'pricing') {
    sheet1Rows.push(
      { cells: [{ v: 'Taxas Maquininha/App (%)', s: 4 }, { v: Number(details.cardFeePct || 0) / 100, s: 7 }, { v: 'Impostos (%)', s: 4 }, { v: Number(details.taxRatePct || 0) / 100, s: 7 }] },
      { cells: [{ v: 'Custos Ocultos (%)', s: 4 }, { v: Number(details.hiddenCostsPct || 0) / 100, s: 7 }, { v: 'Meta Margem Líquida (%)', s: 4 }, { v: Number(details.targetNetMarginPct || 0) / 100, s: 7 }] },
      { cells: [{ v: 'Custo Fixo Mensal (R$)', s: 4 }, { v: Number(details.fixedMonthlyOverhead || 0), s: 5 }, { v: 'Resultado Operacional Atual (R$)', s: 4 }, { v: Number(details.netOperatingResultBRL || 0), s: 6 }] },
      { cells: [] },
      { cells: [{ v: 'Item / Produto / Serviço', s: 3 }, { v: 'Custo Unit. (R$)', s: 3 }, { v: 'Preço Atual (R$)', s: 3 }, { v: 'Markup (%)', s: 3 }, { v: 'Margem Real (%)', s: 3 }, { v: 'Preço Ideal (R$)', s: 3 }, { v: 'Gap Mensal (R$)', s: 3 }, { v: 'Diagnóstico', s: 3 }] }
    );
    const statusMap = {
      prejuizo_invisivel: 'PREJUÍZO INVISÍVEL',
      margem_corroida: 'MARGEM CORROÍDA',
      saudavel: 'SAUDÁVEL'
    };
    for (const item of details.items || []) {
      const styleDiag = item.status === 'saudavel' ? 10 : 11;
      sheet1Rows.push({
        cells: [
          { v: item.name, s: 4 },
          { v: Number(item.unitCost || 0), s: 5 },
          { v: Number(item.currentPrice || 0), s: 5 },
          { v: Number(item.markupPct || 0) / 100, s: 7 },
          { v: Number(item.realMarginPct || 0) / 100, s: 7 },
          { v: Number(item.idealPrice || 0), s: 6 },
          { v: Number(item.monthlyMarginGapBRL || 0), s: 5 },
          { v: statusMap[item.status] || item.status, s: styleDiag }
        ]
      });
    }
  } else {
    sheet1Rows.push(
      { cells: [{ v: 'Tamanho da Equipe (pessoas)', s: 4 }, { v: Number(details.teamSize || 0), s: 8 }, { v: 'Salário Médio (R$)', s: 4 }, { v: Number(details.avgMonthlySalary || 0), s: 5 }] },
      { cells: [{ v: 'Custo Hora-Homem Real (R$)', s: 4 }, { v: Number(details.realHourlyCost || 0), s: 5 }, { v: 'Horas Desperdiçadas/Mês', s: 4 }, { v: Number(details.monthlyWastedHoursTotal || 0), s: 9 }] },
      { cells: [{ v: 'Economia Rápida c/ Treinamento IA (35%)', s: 4 }, { v: Number(details.trainingMonthlySavingsBRL || 0), s: 5 }, { v: 'Economia Estrutural c/ Automação (72%)', s: 4 }, { v: Number(details.automationMonthlySavingsBRL || 0), s: 6 }] }
    );
  }

  sheet1Rows.push(
    { cells: [] },
    { ht: 24, cells: [{ v: '4. DIAGNÓSTICO CIRÚRGICO DA CAUSA RAIZ', s: 2 }, { v: '', s: 2 }, { v: '', s: 2 }, { v: '', s: 2 }] },
    { cells: [{ v: 'Manchete Executiva', s: 4 }, { v: analysis.executiveHeadline || '', s: 0 }] },
    { cells: [{ v: 'Análise Específica do Negócio', s: 4 }, { v: analysis.rootCauseDiagnosis || '', s: 0 }] }
  );

  // --- ABA 2: Ferramentas_e_Scripts ---
  const sheet2Rows = [
    { ht: 28, cells: [{ v: `Ferramentas, Scripts & Prompts Personalizados — ${companyName}`, s: 1 }, { v: '', s: 1 }, { v: '', s: 1 }, { v: '', s: 1 }] },
    { cells: [{ v: 'Nicho', s: 4 }, { v: audit.nicheLabel || 'PME', s: 0 }, { v: 'Preparado por', s: 4 }, { v: `${BRAND_CONFIG.brandName} (${BRAND_CONFIG.siteUrl})`, s: 0 }] },
    { cells: [] },
    { ht: 24, cells: [{ v: 'ENTREGÁVEIS PRONTOS PARA COPIAR E APLICAR', s: 2 }, { v: '', s: 2 }, { v: '', s: 2 }, { v: '', s: 2 }] },
    { cells: [{ v: '#', s: 3 }, { v: 'Ferramenta / Entregável', s: 3 }, { v: 'Texto / Script / Prompt Completo', s: 3 }, { v: 'Como Usar na Prática', s: 3 }] }
  ];

  (analysis.deliverables || []).forEach((item, idx) => {
    sheet2Rows.push({
      cells: [
        { v: `0${idx + 1} · ${item.badge || ''}`, s: 4 },
        { v: item.title || '', s: 4 },
        { v: item.content || '', s: 0 },
        { v: item.usageTip || '', s: 0 }
      ]
    });
  });

  if (moduleId === 'pricing' && Array.isArray(details.items) && details.items.length > 0) {
    sheet2Rows.push(
      { cells: [] },
      { ht: 24, cells: [{ v: 'TABELA SUGERIDA DE REAJUSTE E COMUNICAÇÃO COMERCIAL', s: 2 }, { v: '', s: 2 }, { v: '', s: 2 }, { v: '', s: 2 }] },
      { cells: [{ v: 'Item', s: 3 }, { v: 'Preço Atual (R$)', s: 3 }, { v: 'Preço Ideal Sugerido (R$)', s: 3 }, { v: 'Diferença Unitária (R$)', s: 3 }] }
    );
    for (const item of details.items) {
      sheet2Rows.push({
        cells: [
          { v: item.name, s: 4 },
          { v: Number(item.currentPrice || 0), s: 5 },
          { v: Number(item.idealPrice || 0), s: 6 },
          { v: Math.round((item.idealPrice - item.currentPrice) * 100) / 100, s: 5 }
        ]
      });
    }
  }

  // --- ABA 3: Plano_Implementacao_30D ---
  const sheet3Rows = [
    { ht: 28, cells: [{ v: `Plano de Implementação em 30 Dias — ${companyName}`, s: 1 }, { v: '', s: 1 }, { v: '', s: 1 }, { v: '', s: 1 }] },
    { cells: [{ v: 'Base Numérica', s: 4 }, { v: `Potencial de 30 dias: ${formatBRL(summary.cashPotential30dBRL || 0)} | Projeção 12 meses: ${formatBRL(summary.projection12mBRL || 0)}`, s: 0 }] },
    { cells: [] },
    { ht: 24, cells: [{ v: '1. AÇÕES IMEDIATAS DE 48 HORAS', s: 2 }, { v: '', s: 2 }, { v: '', s: 2 }, { v: '', s: 2 }] },
    { cells: [{ v: 'Janela', s: 3 }, { v: 'Passo Prioritário', s: 3 }, { v: 'Execução Prática', s: 3 }, { v: 'Impacto Esperado', s: 3 }] }
  ];

  for (const step of analysis.plan48h || []) {
    sheet3Rows.push({
      cells: [
        { v: step.window || '', s: 4 },
        { v: step.title || '', s: 4 },
        { v: step.action || '', s: 0 },
        { v: step.expectedImpact || '', s: 10 }
      ]
    });
  }

  const split = analysis.implementationSplit || { teamWithAiTraining: [], customEngineeringStudio: [] };
  const rows4Weeks = [
    ['Semana 1 — Fundação & Quick Wins', split.teamWithAiTraining?.[0] || 'Treinamento prático inicial da equipe com os scripts da aba 2.', split.customEngineeringStudio?.[0] || 'Mapeamento de integrações, fluxos e arquitetura do sistema/agente.'],
    ['Semana 2 — Padronização & Fluxo', split.teamWithAiTraining?.[1] || 'Padronização de atendimento e prompts diários no WhatsApp.', split.customEngineeringStudio?.[1] || 'Construção de landing page / painel de métricas e webhook de captura.'],
    ['Semana 3 — Automação & Follow-up', split.teamWithAiTraining?.[2] || 'Rotina semanal assistida por IA para propostas e revisão de margem.', split.customEngineeringStudio?.[2] || 'Ativação de agente de triagem e cadência automática de follow-up 24h/48h.'],
    ['Semana 4 — Escala & Mensuração', split.teamWithAiTraining?.[3] || 'Auditoria mensal de conversão e ajuste fino dos prompts internos.', split.customEngineeringStudio?.[3] || 'Dashboard executivo em produção com alertas de vazamento e ROI.']
  ];

  sheet3Rows.push(
    { cells: [] },
    { ht: 24, cells: [{ v: '2. CRONOGRAMA DE 4 SEMANAS: TREINAMENTO DA EQUIPE VS SISTEMA SOB MEDIDA', s: 2 }, { v: '', s: 2 }, { v: '', s: 2 }, { v: '', s: 2 }] },
    { cells: [{ v: 'Semana', s: 3 }, { v: 'Trilha 1: Treinamento Prático da Equipe em IA', s: 3 }, { v: 'Trilha 2: Sistema / Automação Sob Medida (André Studio)', s: 3 }, { v: 'Objetivo da Semana', s: 3 }] }
  );

  rows4Weeks.forEach(([week, t1, t2], idx) => {
    sheet3Rows.push({
      cells: [
        { v: week, s: 4 },
        { v: t1, s: 0 },
        { v: t2, s: 0 },
        { v: idx === 0 ? 'Estancar perdas imediatas' : idx === 1 ? 'Organizar processo' : idx === 2 ? 'Escalar sem aumentar equipe' : 'Consolidar lucro líquido', s: 10 }
      ]
    });
  });

  sheet3Rows.push(
    { cells: [] },
    { ht: 24, cells: [{ v: '3. CANAIS DIRETOS PARA IMPLEMENTAR COM A ANDRÉ STUDIO', s: 2 }, { v: '', s: 2 }, { v: '', s: 2 }, { v: '', s: 2 }] },
    { cells: [{ v: 'Responsável', s: 4 }, { v: `${BRAND_CONFIG.founder} — ${BRAND_CONFIG.brandName} (${BRAND_CONFIG.location})`, s: 0 }] },
    { cells: [{ v: 'WhatsApp Direto', s: 4 }, { v: `${BRAND_CONFIG.whatsappFormatted} — ${BRAND_CONFIG.whatsappUrl}`, s: 10 }] },
    { cells: [{ v: 'E-mail Oficial', s: 4 }, { v: BRAND_CONFIG.email, s: 0 }] },
    { cells: [{ v: 'Site e Soluções', s: 4 }, { v: `${BRAND_CONFIG.siteUrl} | Capacitação: ${BRAND_CONFIG.siteUrl}${BRAND_CONFIG.links.kits} | Engenharia: ${BRAND_CONFIG.siteUrl}${BRAND_CONFIG.links.services}`, s: 0 }] },
    { cells: [{ v: 'Resumo Compartilhável', s: 4 }, { v: `Horas poupadas/mês: ${formatInt(summary.hoursRecoveredMonthly || 0)}h · Variação conservadora: ${formatBRL(summary.cashConservative30dBRL || 0)} · Meta 30d: ${formatBRL(summary.cashPotential30dBRL || 0)} (${formatPct(details.currentConversionPct || details.weightedCurrentMarginPct || 0)} base)`, s: 0 }] }
  );

  return buildWorkbookFromSheets([
    { name: 'Diagnostico_Caixa', rows: sheet1Rows, minCols: 4 },
    { name: 'Ferramentas_e_Scripts', rows: sheet2Rows, minCols: 4 },
    { name: 'Plano_Implementacao_30D', rows: sheet3Rows, minCols: 4 }
  ]);
}

/**
 * Gera um arquivo .xlsx modelo simples de catálogo de produtos/serviços para download e teste.
 */
export async function buildSampleCatalogXlsx(items = [], nicheLabel = 'Modelo') {
  const safeItems = Array.isArray(items) && items.length > 0
    ? items
    : [
        { name: 'Item Modelo 1', unitCost: 50, currentPrice: 110, monthlyQty: 30 },
        { name: 'Item Modelo 2', unitCost: 90, currentPrice: 120, monthlyQty: 20 }
      ];

  const rows = [
    { cells: [{ v: 'Item', s: 3 }, { v: 'Custo Unitario (R$)', s: 3 }, { v: 'Preco Atual (R$)', s: 3 }, { v: 'Qtd Mensal', s: 3 }] },
    ...safeItems.map((item) => ({
      cells: [
        { v: String(item.name || ''), s: 0 },
        { v: Number(parsePtBrNumber(item.unitCost, 0, { mode: 'currency' })), s: 5 },
        { v: Number(parsePtBrNumber(item.currentPrice, 0, { mode: 'currency' })), s: 5 },
        { v: Math.round(Number(parsePtBrNumber(item.monthlyQty, 0, { mode: 'integer' }))), s: 8 }
      ]
    }))
  ];

  const cleanSheetName = `Catalogo_${String(nicheLabel || 'PME').replace(/[^\w]/g, '').slice(0, 18) || 'PME'}`;
  return buildWorkbookFromSheets([{ name: cleanSheetName, rows, minCols: 4 }]);
}

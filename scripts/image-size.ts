// Largura e altura de uma imagem pelos primeiros bytes do arquivo (PNG, JPEG, WebP e SVG), sem dependência.
// O build usa isto para dar a cada arte a sua proporção antes de ela carregar (docs/visual.md, "Vagas de ilustração").

export type ImageSize = readonly [width: number, height: number];

function png(b: Uint8Array, v: DataView): ImageSize | null {
  if (b.length < 24 || v.getUint32(0) !== 0x89504e47) return null;
  return [v.getUint32(16), v.getUint32(20)];
}

/** Orientação do EXIF (tag 0x0112) no segmento APP1 que começa em `at`; 5 a 8 deitam a foto (o navegador gira). */
function exifOrientation(b: Uint8Array, v: DataView, at: number, len: number): number {
  const tiff = at + 10;
  if (len < 16 || String.fromCharCode(b[at + 4]!, b[at + 5]!, b[at + 6]!, b[at + 7]!) !== 'Exif') return 1;
  const le = b[tiff] === 0x49;
  const ifd = tiff + v.getUint32(tiff + 4, le);
  if (ifd + 2 > at + 2 + len) return 1;
  const count = v.getUint16(ifd, le);
  for (let n = 0; n < count; n++) {
    const entry = ifd + 2 + n * 12;
    if (entry + 12 > b.length) break;
    if (v.getUint16(entry, le) === 0x0112) return v.getUint16(entry + 8, le);
  }
  return 1;
}

function jpeg(b: Uint8Array, v: DataView): ImageSize | null {
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) return null;
  let i = 2;
  let turned = false;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) { i++; continue; }
    const marker = b[i + 1]!;
    // SOF0..SOF15, menos DHT (C4), JPG (C8) e DAC (CC): trazem altura e largura.
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      const w = v.getUint16(i + 7);
      const h = v.getUint16(i + 5);
      return turned ? [h, w] : [w, h];
    }
    if (marker === 0xe1) turned = exifOrientation(b, v, i, v.getUint16(i + 2)) >= 5;
    if (marker === 0xff || (marker >= 0xd0 && marker <= 0xd9)) { i += marker === 0xff ? 1 : 2; continue; }
    i += 2 + v.getUint16(i + 2);
  }
  return null;
}

function webp(b: Uint8Array, v: DataView): ImageSize | null {
  const tag = (o: number) => String.fromCharCode(b[o]!, b[o + 1]!, b[o + 2]!, b[o + 3]!);
  if (b.length < 30 || tag(0) !== 'RIFF' || tag(8) !== 'WEBP') return null;
  const kind = tag(12);
  if (kind === 'VP8X') return [1 + (b[24]! | (b[25]! << 8) | (b[26]! << 16)), 1 + (b[27]! | (b[28]! << 8) | (b[29]! << 16))];
  if (kind === 'VP8 ') return [v.getUint16(26, true) & 0x3fff, v.getUint16(28, true) & 0x3fff];
  if (kind === 'VP8L') {
    const n = v.getUint32(21, true);
    return [(n & 0x3fff) + 1, ((n >> 14) & 0x3fff) + 1];
  }
  return null;
}

function svg(b: Uint8Array): ImageSize | null {
  const text = new TextDecoder().decode(b.subarray(0, 2048));
  if (!/<svg[\s>]/i.test(text)) return null;
  const box = /viewBox\s*=\s*["']\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(text);
  if (box) return [Number(box[1]), Number(box[2])];
  const w = /<svg[^>]*\swidth\s*=\s*["']([\d.]+)/i.exec(text);
  const h = /<svg[^>]*\sheight\s*=\s*["']([\d.]+)/i.exec(text);
  return w && h ? [Number(w[1]), Number(h[1])] : null;
}

/** Tamanho da imagem, ou `null` se o formato não for reconhecido (o protótipo então mede ao carregar). */
export function imageSize(bytes: Uint8Array): ImageSize | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const size = png(bytes, view) ?? jpeg(bytes, view) ?? webp(bytes, view) ?? svg(bytes);
  return size && size[0] > 0 && size[1] > 0 ? size : null;
}

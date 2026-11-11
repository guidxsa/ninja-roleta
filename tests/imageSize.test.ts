import { describe, expect, it } from 'vitest';
import { imageSize } from '../scripts/image-size';

const bytes = (...parts: (number[] | string)[]): Uint8Array =>
  Uint8Array.from(parts.flatMap((p) => (typeof p === 'string' ? [...p].map((c) => c.charCodeAt(0)) : p)));
const u32be = (n: number) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
const u16be = (n: number) => [(n >>> 8) & 255, n & 255];
const u16le = (n: number) => [n & 255, (n >>> 8) & 255];
const u24le = (n: number) => [n & 255, (n >>> 8) & 255, (n >>> 16) & 255];
const pad = (n: number) => new Array<number>(n).fill(0);

describe('imageSize (proporção das artes no build)', () => {
  it('lê PNG', () => {
    const png = bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], u32be(13), 'IHDR', u32be(640), u32be(360), pad(5));
    expect(imageSize(png)).toEqual([640, 360]);
  });

  it('lê JPEG pulando os segmentos antes do SOF', () => {
    const app0 = [0xff, 0xe0, ...u16be(6), 1, 2, 3, 4];
    const sof = [0xff, 0xc2, ...u16be(11), 8, ...u16be(900), ...u16be(1600), 3, 0, 0];
    expect(imageSize(bytes([0xff, 0xd8], app0, sof, pad(8)))).toEqual([1600, 900]);
  });

  it('troca largura e altura do JPEG deitado pelo EXIF (o navegador gira a foto)', () => {
    const tiff = [...'MM'].map((c) => c.charCodeAt(0)).concat([0, 0x2a], u32be(8), u16be(1), u16be(0x0112), u16be(3), u32be(1), u16be(6), [0, 0], u32be(0));
    const exif = [0xff, 0xe1, ...u16be(2 + 6 + tiff.length), ...[...'Exif'].map((c) => c.charCodeAt(0)), 0, 0, ...tiff];
    const sof = [0xff, 0xc0, ...u16be(11), 8, ...u16be(1180), ...u16be(598), 3, 0, 0];
    expect(imageSize(bytes([0xff, 0xd8], exif, sof, pad(8)))).toEqual([1180, 598]);
  });

  it('lê WebP estendido, com perda e sem perda', () => {
    const riff = (kind: string, body: number[]) => bytes('RIFF', pad(4), 'WEBP', kind, pad(4), body, pad(8));
    expect(imageSize(riff('VP8X', [0, 0, 0, 0, ...u24le(1199), ...u24le(799)]))).toEqual([1200, 800]);
    expect(imageSize(riff('VP8 ', [0, 0, 0, 0x9d, 0x01, 0x2a, ...u16le(512), ...u16le(768)]))).toEqual([512, 768]);
    const packed = (300 - 1) | ((200 - 1) << 14);
    expect(imageSize(riff('VP8L', [0x2f, packed & 255, (packed >>> 8) & 255, (packed >>> 16) & 255, (packed >>> 24) & 255]))).toEqual([300, 200]);
  });

  it('lê SVG pelo viewBox ou por width e height', () => {
    expect(imageSize(bytes('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"></svg>'))).toEqual([400, 300]);
    expect(imageSize(bytes('<svg width="120" height="80"></svg>'))).toEqual([120, 80]);
  });

  it('devolve null para formato desconhecido', () => {
    expect(imageSize(bytes('GIF89a', pad(20)))).toBeNull();
    expect(imageSize(new Uint8Array(0))).toBeNull();
  });
});

import { CHR_ROM_PAGE_SIZE, PRG_ROM_PAGE_SIZE, Rom } from "../cartridge.ts";

Deno.test("rom_test", () => {
	const test_rom = new Uint8Array([
		0x4E,
		0x45,
		0x53,
		0x1A,
		0x02,
		0x01,
		0x31,
		0x00,
		0x00,
		0x00,
		0x00,
		0x00,
		0x00,
		0x00,
		0x00,
		0x00,
		...(new Array(2 * PRG_ROM_PAGE_SIZE).fill(1)),
		...(new Array(CHR_ROM_PAGE_SIZE).fill(2)),
	]);
	const _rom = new Rom(test_rom);
});

export const NES_TAG = new Uint8Array([0x4e, 0x45, 0x53, 0x1a]);
export const PRG_ROM_PAGE_SIZE = 16384;
export const CHR_ROM_PAGE_SIZE = 8192;

export function hasNESTag(raw: Uint8Array): boolean {
	if (raw.length < NES_TAG.length) return false;
	for (let i = 0; i < NES_TAG.length; i++) {
		if (raw[i] != NES_TAG[i]) return false;
	}
	return true;
}

export enum Mirroring {
	VERTICAL,
	HORIZONTAL,
	FOUR_SCREEN,
}

export class Rom {
	public prg_rom: Uint8Array;
	public chr_rom: Uint8Array;
	public mapper: number;
	public screen_mirroring: Mirroring;
	constructor(raw: Uint8Array) {
		if (!hasNESTag(raw)) {
			throw new Error("File is not in iNES file format.");
		}
		const mapper = (raw[7] & 0b1111_0000) | (raw[6] >> 4);
		const ines_ver = (raw[7] >> 2) & 0b11;
		if (ines_ver != 0) throw new Error("NES2.0 format is not supported.");

		const four_screen = (raw[6] & 0b1000) != 0;
		const vertical_mirroring = (raw[6] & 0b1) != 0;
		const screen_mirroring = (() => {
			if (four_screen) return Mirroring.FOUR_SCREEN;
			else if (vertical_mirroring) return Mirroring.VERTICAL;
			else return Mirroring.HORIZONTAL;
		})();

		const prg_rom_size = raw[4] * PRG_ROM_PAGE_SIZE;
		const chr_rom_size = raw[5] * CHR_ROM_PAGE_SIZE;

		const skip_trainer = (raw[6] & 0b100) != 0;

		const prg_rom_start = 16 + (skip_trainer ? 512 : 0);
		const chr_rom_start = prg_rom_start + prg_rom_size;

		this.prg_rom = raw.slice(
			prg_rom_start,
			prg_rom_start + prg_rom_size - 1,
		);
		this.chr_rom = raw.slice(
			chr_rom_start,
			chr_rom_start + chr_rom_size - 1,
		);
		this.mapper = mapper;
		this.screen_mirroring = screen_mirroring;
	}
}

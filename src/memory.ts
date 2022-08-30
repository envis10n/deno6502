import { u16, u8 } from "./lib/numerics.ts";

export interface IMemory {
	read(address: number): number;
	write(address: number, value: number): void;
	read_u16(address: number): number;
	write_u16(address: number, value: number): void;
}

export const RAM = 0x0000;
export const RAM_MIRRORS_END = 0x1fff;
export const PPU_REGISTERS = 0x2000;
export const PPU_REGISTERS_MIRRORS_END = 0x3fff;

function addressInRange(
	addr: number,
	max: number,
	min = 0x0000,
): boolean {
	return (addr <= max || addr >= min);
}

export interface IMemoryMap {
	start: number;
	end: number;
	access: IMemory;
}

export class Bus implements IMemory {
	private memory_map: IMemoryMap[] = [];
	public get_mapped_memory(addr: number): IMemoryMap | undefined {
		return this.memory_map.find((mem) => {
			return addressInRange(addr, mem.end, mem.start);
		});
	}
	public attach(start: number, end: number, mem: IMemory) {
		if (
			this.get_mapped_memory(start) != undefined ||
			this.get_mapped_memory(end) != undefined
		) {
			throw new Error(
				`Memory region 0x${start.toString(16)}..0x${
					end.toString(16)
				} conflicts.`,
			);
		}
		const obj: IMemoryMap = { start, end, access: mem };
		this.memory_map.push(obj);
	}
	private read_from(addr: number): number {
		const mem = this.get_mapped_memory(addr);
		if (mem == undefined) {
			throw new Error(`Address 0x${addr.toString(16)} is not mapped.`);
		}
		return mem.access.read(addr);
	}
	private write_to(addr: number, value: number): void {
		const mem = this.get_mapped_memory(addr);
		if (mem == undefined) {
			throw new Error(`Address 0x${addr.toString(16)} is not mapped.`);
		}
		return mem.access.write(addr, value);
	}
	public read(address: number): number {
		if (addressInRange(address, RAM_MIRRORS_END, RAM)) {
			// RAM Access
			const mirrored = address & 0b00000111_11111111;
			return this.read_from(mirrored);
		} else if (
			addressInRange(address, PPU_REGISTERS_MIRRORS_END, PPU_REGISTERS)
		) {
			// PPU Access
			const mirrored = address & 0b00100000_00000111;
			throw new Error("PPU NYI");
		} else {
			console.log(`Ignoring memory access at 0x${address.toString(16)}`);
		}
		return 0;
	}
	public write(addr: number, value: number): void {
		if (addressInRange(addr, RAM_MIRRORS_END, RAM)) {
			// RAM Access
			const mirrored = addr & 0b11111111111;
			this.write_to(mirrored, value);
		} else if (
			addressInRange(addr, PPU_REGISTERS_MIRRORS_END, PPU_REGISTERS)
		) {
			// PPU Access
			const mirrored = addr & 0b00100000_00000111;
			throw new Error("PPU NYI");
		} else {
			console.log(`Ignoring memory write at 0x${addr.toString(16)}`);
		}
	}
	public read_u16(addr: number): number {
		const lo = this.read(u16(addr));
		const hi = this.read(u16(addr + 1));
		return ((hi << 8) | u16(lo));
	}
	public write_u16(addr: number, value: number): void {
		const hi = u8(value >> 8);
		const lo = u8(value & 0xff);
		this.write(u16(addr), lo);
		this.write(u16(addr + 1), hi);
	}
}

export class RAMChip implements IMemory {
	private memory: Uint8Array;
	constructor(size: number) {
		this.memory = new Uint8Array(size);
	}
	public read(address: number): number {
		return this.memory[u16(address)];
	}
	public write(address: number, value: number): void {
		this.memory[u16(address)] = value;
	}
	public read_u16(address: number): number {
		const lo = this.read(u16(address));
		const hi = this.read(u16(address + 1));
		return ((hi << 8) | u16(lo));
	}
	public write_u16(address: number, value: number): void {
		const hi = u8(value >> 8);
		const lo = u8(value & 0xff);
		this.write(u16(address), lo);
		this.write(u16(address + 1), hi);
	}
}

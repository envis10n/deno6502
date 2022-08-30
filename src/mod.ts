import { Bitflags, bitset, i8, i8_neg, u16, u8 } from "./lib/numerics.ts";
import { Bus, IMemory } from "./memory.ts";
export { RAMChip } from "./memory.ts";
import { OPCODES_MAP } from "./opcodes.ts";

export enum EAddressingMode {
	Immediate,
	ZeroPage,
	ZeroPage_X,
	ZeroPage_Y,
	Absolute,
	Absolute_X,
	Absolute_Y,
	Indirect_X,
	Indirect_Y,
	NoneAddressing,
}

export enum EStatusFlag {
	CARRY,
	ZERO,
	INT,
	DEC,
	BRK,
	BRK2,
	OVR,
	NEG,
}

export const STACK = 0x0100;
export const STACK_RESET = 0xfd;

export type StatusFlag = Bitflags<EStatusFlag>;
export const StatusFlags = Bitflags.factory<EStatusFlag>();
export class CPU implements IMemory {
	public status: StatusFlag = StatusFlags();
	public PC = 0; // u16
	public register_a = 0;
	public register_x = 0;
	public register_y = 0;
	public stack_pointer = STACK_RESET;
	public bus: Bus = new Bus();
	public update_status_flags(value: number) {
		if (value == 0) {
			this.status.set(EStatusFlag.ZERO);
		} else {
			this.status.unset(EStatusFlag.ZERO);
		}
		if (bitset(value, 7)) {
			this.status.set(EStatusFlag.NEG);
		} else {
			this.status.unset(EStatusFlag.NEG);
		}
	}
	public read(address: number): number {
		return this.bus.read(address);
	}
	public write(address: number, value: number) {
		return this.bus.write(address, value);
	}
	public read_u16(address: number): number {
		return this.bus.read_u16(address);
	}
	public write_u16(address: number, value: number) {
		return this.bus.write_u16(address, value);
	}
	public get_absolute_address(mode: EAddressingMode, addr: number): number {
		switch (mode) {
			case EAddressingMode.ZeroPage: {
				return this.read(addr);
			}
			case EAddressingMode.ZeroPage_X: {
				const pos = this.read(addr);
				return u8.wrapping_add(pos, this.register_x);
			}
			case EAddressingMode.ZeroPage_Y: {
				const pos = this.read(addr);
				return u8.wrapping_add(pos, this.register_y);
			}
			case EAddressingMode.Absolute: {
				return this.read_u16(addr);
			}
			case EAddressingMode.Absolute_X: {
				const base = this.read_u16(addr);
				return u16.wrapping_add(base, this.register_x);
			}
			case EAddressingMode.Absolute_Y: {
				const base = this.read_u16(addr);
				return u16.wrapping_add(base, this.register_y);
			}
			case EAddressingMode.Indirect_X: {
				const base = this.read(addr);
				const ptr = u8.wrapping_add(base, this.register_x);
				const lo = this.read(ptr);
				const hi = this.read(u8.wrapping_add(ptr, 1));
				return ((hi << 8) | lo);
			}
			case EAddressingMode.Indirect_Y: {
				const base = this.read(addr);
				const lo = this.read(base);
				const hi = this.read(u8.wrapping_add(base, 1));
				const deref_base = ((hi << 8) | lo);
				return u16.wrapping_add(deref_base, this.register_y);
			}
			default:
				throw new Error(`Addressing mode not supported: ${mode}`);
		}
	}
	public get_operand_address(mode: EAddressingMode): number {
		switch (mode) {
			case EAddressingMode.Immediate: {
				return this.PC;
			}
			default: {
				return this.get_absolute_address(mode, this.PC);
			}
		}
	}
	public ldy(mode: EAddressingMode) {
		const addr = this.get_operand_address(mode);
		const data = this.read(addr);
		this.register_y = data;
		this.update_status_flags(this.register_y);
	}
	public ldx(mode: EAddressingMode) {
		const addr = this.get_operand_address(mode);
		const data = this.read(addr);
		this.register_x = data;
		this.update_status_flags(this.register_x);
	}
	public lda(mode: EAddressingMode) {
		const addr = this.get_operand_address(mode);
		const value = this.read(addr);
		this.set_register_a(value);
	}
	public sta(mode: EAddressingMode) {
		const addr = this.get_operand_address(mode);
		this.write(addr, this.register_a);
	}
	public set_register_a(value: number) {
		this.register_a = value;
		this.update_status_flags(this.register_a);
	}
	public _and(mode: EAddressingMode) {
		const addr = this.get_operand_address(mode);
		const data = this.read(addr);
		this.set_register_a(data & this.register_a);
	}
	public _eor(mode: EAddressingMode) {
		const addr = this.get_operand_address(mode);
		const data = this.read(addr);
		this.set_register_a(data ^ this.register_a);
	}
	public _ora(mode: EAddressingMode) {
		const addr = this.get_operand_address(mode);
		const data = this.read(addr);
		this.set_register_a(data | this.register_a);
	}
	public tax() {
		this.register_x = this.register_a;
		this.update_status_flags(this.register_x);
	}
	public inx() {
		this.register_x = u8.wrapping_add(this.register_x, 1);
		this.update_status_flags(this.register_x);
	}
	public iny() {
		this.register_y = u8.wrapping_add(this.register_y, 1);
	}
	public add_to_register_a(data: number) {
		const sum = u16(
			this.register_a + data +
				(this.status.has(EStatusFlag.CARRY) ? 1 : 0),
		);
		const carry = sum > 0xff;
		if (carry) {
			this.status.set(EStatusFlag.CARRY);
		} else {
			this.status.unset(EStatusFlag.CARRY);
		}
		const result = u8(sum);
		if (((data ^ result) & (result ^ this.register_a) & 0x80) != 0) {
			this.status.set(EStatusFlag.OVR);
		} else {
			this.status.unset(EStatusFlag.OVR);
		}
		this.set_register_a(result);
	}
	public sbc(mode: EAddressingMode) {
		const addr = this.get_operand_address(mode);
		const data = this.read(addr);
		this.add_to_register_a(u8(i8.wrapping_sub(i8_neg(data), 1)));
	}
	public adc(mode: EAddressingMode) {
		const addr = this.get_operand_address(mode);
		const val = this.read(addr);
		this.add_to_register_a(val);
	}
	public stack_pop(): number {
		this.stack_pointer = u8.wrapping_add(this.stack_pointer, 1);
		return this.read(STACK + this.stack_pointer);
	}
	public stack_push(data: number) {
		this.write(STACK + this.stack_pointer, data);
		this.stack_pointer = u8.wrapping_sub(this.stack_pointer, 1);
	}
	public stack_push_u16(data: number) {
		const hi = data >> 8;
		const lo = data & 0xff;
		this.stack_push(hi);
		this.stack_push(lo);
	}
	public stack_pop_u16(): number {
		const lo = this.stack_pop();
		const hi = this.stack_pop();
		return (hi << 8) | lo;
	}
	public asl_accumulator() {
		let data = this.register_a;
		if ((data >> 7) == 1) {
			this.status.set(EStatusFlag.CARRY);
		} else {
			this.status.unset(EStatusFlag.CARRY);
		}
		data = data << 1;
		this.set_register_a(data);
	}
	public asl(mode: EAddressingMode): number {
		const addr = this.get_operand_address(mode);
		let data = this.read(addr);
		if ((data >> 7) == 1) {
			this.status.set(EStatusFlag.CARRY);
		} else {
			this.status.unset(EStatusFlag.CARRY);
		}
		data = data << 1;
		this.write(addr, data);
		this.update_status_flags(data);
		return data;
	}
	public lsr_accumulator() {
		let data = this.register_a;
		if ((data & 1) == 1) {
			this.status.set(EStatusFlag.CARRY);
		} else {
			this.status.unset(EStatusFlag.CARRY);
		}
		data = data >> 1;
		this.set_register_a(data);
	}
	public lsr(mode: EAddressingMode): number {
		const addr = this.get_operand_address(mode);
		let data = this.read(addr);
		if ((data & 1) == 1) {
			this.status.set(EStatusFlag.CARRY);
		} else {
			this.status.unset(EStatusFlag.CARRY);
		}
		data = data >> 1;
		this.write(addr, data);
		this.update_status_flags(data);
		return data;
	}
	public rol(mode: EAddressingMode): number {
		const addr = this.get_operand_address(mode);
		let data = this.read(addr);
		const old_carry = this.status.has(EStatusFlag.CARRY);
		if ((data >> 7) == 1) {
			this.status.set(EStatusFlag.CARRY);
		} else {
			this.status.unset(EStatusFlag.CARRY);
		}
		data = data << 1;
		if (old_carry) {
			data = data | 1;
		}
		this.write(addr, data);
		this.update_status_flags(data);
		return data;
	}
	public rol_accumulator() {
		let data = this.register_a;
		const old_carry = this.status.has(EStatusFlag.CARRY);

		if ((data >> 7) == 1) {
			this.status.set(EStatusFlag.CARRY);
		} else {
			this.status.unset(EStatusFlag.CARRY);
		}
		data = data << 1;
		if (old_carry) {
			data = data | 1;
		}
		this.set_register_a(data);
	}
	public ror(mode: EAddressingMode): number {
		const addr = this.get_operand_address(mode);
		let data = this.read(addr);
		const old_carry = this.status.has(EStatusFlag.CARRY);

		if ((data & 1) == 1) {
			this.status.set(EStatusFlag.CARRY);
		} else {
			this.status.unset(EStatusFlag.CARRY);
		}
		data = data >> 1;
		if (old_carry) {
			data = data | 0b1000000;
		}
		this.write(addr, data);
		this.update_status_flags(data);
		return data;
	}
	public ror_accumulator() {
		let data = this.register_a;
		const old_carry = this.status.has(EStatusFlag.CARRY);

		if ((data & 1) == 1) {
			this.status.set(EStatusFlag.CARRY);
		} else {
			this.status.unset(EStatusFlag.CARRY);
		}
		data = data >> 1;
		if (old_carry) {
			data = data | 0b1000000;
		}
		this.set_register_a(data);
	}
	public inc(mode: EAddressingMode): number {
		const addr = this.get_operand_address(mode);
		let data = this.read(addr);
		data = u8.wrapping_add(data, 1);
		this.write(addr, data);
		this.update_status_flags(data);
		return data;
	}
	public dey() {
		this.register_y = u8.wrapping_sub(this.register_y, 1);
		this.update_status_flags(this.register_y);
	}
	public dex() {
		this.register_x = u8.wrapping_sub(this.register_x, 1);
		this.update_status_flags(this.register_x);
	}
	public dec(mode: EAddressingMode): number {
		const addr = this.get_operand_address(mode);
		let data = this.read(addr);
		data = u8.wrapping_sub(data, 1);
		this.write(addr, data);
		this.update_status_flags(data);
		return data;
	}
	public pla() {
		const data = this.stack_pop();
		this.set_register_a(data);
	}
	public plp() {
		this.status.bits = this.stack_pop();
		this.status.unset(EStatusFlag.BRK);
		this.status.set(EStatusFlag.BRK2);
	}
	public php() {
		const flags = this.status.clone();
		flags.set(EStatusFlag.BRK);
		flags.set(EStatusFlag.BRK2);
		this.stack_push(flags.bits);
	}
	public bit(mode: EAddressingMode) {
		const addr = this.get_operand_address(mode);
		const data = this.read(addr);
		const _and = this.register_a & data;
		if (_and == 0) {
			this.status.set(EStatusFlag.ZERO);
		} else {
			this.status.unset(EStatusFlag.ZERO);
		}
		if ((data & 0b1000000) > 0) {
			this.status.set(EStatusFlag.NEG);
		}
		if ((data & 0b01000000) > 0) {
			this.status.set(EStatusFlag.OVR);
		}
	}
	public compare(mode: EAddressingMode, compare_with: number) {
		const addr = this.get_operand_address(mode);
		const data = this.read(addr);
		if (data <= compare_with) {
			this.status.set(EStatusFlag.CARRY);
		} else {
			this.status.unset(EStatusFlag.CARRY);
		}
		this.update_status_flags(u8.wrapping_sub(compare_with, data));
	}
	public branch(condition: boolean) {
		if (condition) {
			const jump = i8(this.read(this.PC));
			const jump_addr = u16.wrapping_add(
				u16.wrapping_add(this.PC, 1),
				u16(jump),
			);
			this.PC = jump_addr;
		}
	}
	public load(program: Uint8Array) {
		for (let i = 0; i < program.length; i++) {
			this.write(0x8000 + i, program[i]);
		}
		this.write_u16(0xfffc, 0x8000);
	}
	public reset() {
		this.register_a = 0;
		this.register_x = 0;
		this.register_y = 0;
		this.stack_pointer = STACK_RESET;
		this.status = StatusFlags(EStatusFlag.BRK | EStatusFlag.INT);
		this.PC = this.read_u16(0xfffc);
	}
	public interpret(program: Uint8Array): void;
	public interpret(program: Uint8Array, callback: (cpu: CPU) => void): void;
	public interpret(program: Uint8Array, callback?: (cpu: CPU) => void) {
		this.load(program);
		this.reset();
		let should_run = true;
		while (should_run) {
			const opscode = this.read(this.PC);
			const op = OPCODES_MAP.get(opscode);
			if (op == undefined) {
				throw new Error(`Unhandled opcode: 0x${opscode}`);
			}
			console.log(`0x${this.PC.toString(16)}\t${op.mnemonic}`);
			this.PC += 1;
			const pc_state = this.PC;
			switch (opscode) {
				case 0xa9:
				case 0xa5:
				case 0xb5:
				case 0xad:
				case 0xbd:
				case 0xb9:
				case 0xa1:
				case 0xb1: {
					this.lda(op.mode);
					break;
				}
				case 0xaa: {
					this.tax();
					break;
				}
				case 0xe8: {
					this.inx();
					break;
				}
				case 0xd8: {
					// CLD
					this.status.unset(EStatusFlag.DEC);
					break;
				}
				case 0x58: {
					// CLI
					this.status.unset(EStatusFlag.INT);
					break;
				}
				case 0xb8: {
					// CLV
					this.status.unset(EStatusFlag.OVR);
					break;
				}
				case 0x18: {
					// CLC
					this.status.unset(EStatusFlag.CARRY);
					break;
				}
				case 0x38: {
					// SEC
					this.status.set(EStatusFlag.CARRY);
					break;
				}
				case 0x78: {
					// SEI
					this.status.set(EStatusFlag.INT);
					break;
				}
				case 0xf8: {
					// SED
					this.status.set(EStatusFlag.DEC);
					break;
				}
				case 0x48: {
					// PHA
					this.stack_push(this.register_a);
					break;
				}
				case 0x68: {
					// PLA
					this.pla();
					break;
				}
				case 0x08: {
					// PHP
					this.php();
					break;
				}
				case 0x28: {
					// PLP
					this.plp();
					break;
				}
				case 0x69:
				case 0x65:
				case 0x75:
				case 0x6d:
				case 0x7d:
				case 0x79:
				case 0x61:
				case 0x71: {
					// ADC
					this.adc(op.mode);
					break;
				}
				case 0xe9:
				case 0xe5:
				case 0xf5:
				case 0xed:
				case 0xfd:
				case 0xf9:
				case 0xe1:
				case 0xf1: {
					// SBC
					this.sbc(op.mode);
					break;
				}
				case 0x29:
				case 0x25:
				case 0x35:
				case 0x2d:
				case 0x3d:
				case 0x39:
				case 0x21:
				case 0x31: {
					// AND
					this._and(op.mode);
					break;
				}
				case 0x49:
				case 0x45:
				case 0x55:
				case 0x4d:
				case 0x5d:
				case 0x59:
				case 0x41:
				case 0x51: {
					// EOR
					this._eor(op.mode);
					break;
				}
				case 0x09:
				case 0x05:
				case 0x15:
				case 0x0d:
				case 0x1d:
				case 0x19:
				case 0x01:
				case 0x11: {
					// ORA
					this._ora(op.mode);
					break;
				}
				case 0x4a: {
					// LSR
					this.lsr_accumulator();
					break;
				}
				case 0x46:
				case 0x56:
				case 0x4e:
				case 0x5e: {
					// LSR
					this.lsr(op.mode);
					break;
				}
				case 0x0a: {
					// ASL
					this.asl_accumulator();
					break;
				}
				case 0x06:
				case 0x16:
				case 0x0e:
				case 0x1e: {
					// ASL
					this.asl(op.mode);
					break;
				}
				case 0x2a: {
					// ROL
					this.rol_accumulator();
					break;
				}
				case 0x26:
				case 0x36:
				case 0x2e:
				case 0x3e: {
					// ROL
					this.rol(op.mode);
					break;
				}
				case 0x6a: {
					// ROR
					this.ror_accumulator();
					break;
				}
				case 0x66:
				case 0x76:
				case 0x6e:
				case 0x7e: {
					// ROR
					this.ror(op.mode);
					break;
				}
				case 0xe6:
				case 0xf6:
				case 0xee:
				case 0xfe: {
					// INC
					this.inc(op.mode);
					break;
				}
				case 0xc8: {
					// INY
					this.iny();
					break;
				}
				case 0xc6:
				case 0xd6:
				case 0xce:
				case 0xde: {
					// DEC
					this.dec(op.mode);
					break;
				}
				case 0xca: {
					// DEX
					this.dex();
					break;
				}
				case 0x88: {
					// DEY
					this.dey();
					break;
				}
				case 0xc9:
				case 0xc5:
				case 0xd5:
				case 0xcd:
				case 0xdd:
				case 0xd9:
				case 0xc1:
				case 0xd1: {
					// CMP
					this.compare(op.mode, this.register_a);
					break;
				}
				case 0xc0:
				case 0xc4:
				case 0xcc: {
					// CPY
					this.compare(op.mode, this.register_y);
					break;
				}
				case 0xe0:
				case 0xe4:
				case 0xec: {
					// CPX
					this.compare(op.mode, this.register_x);
					break;
				}
				case 0x4c: {
					// JMP Absolute
					const mem_address = this.read_u16(this.PC);
					this.PC = mem_address;
					break;
				}
				case 0x6c: {
					// JMP Indirect
					const mem_address = this.read_u16(this.PC);
					const indirect_ref = (() => {
						if ((mem_address & 0x00ff) == 0x00ff) {
							const lo = this.read(mem_address);
							const hi = this.read(mem_address & 0xff00);
							return (hi << 8) | lo;
						} else {
							return this.read_u16(mem_address);
						}
					})();
					this.PC = indirect_ref;
					break;
				}
				case 0x20: {
					// JSR
					this.stack_push_u16(this.PC + 2 - 1);
					const target_address = this.read_u16(this.PC);
					this.PC = target_address;
					break;
				}
				case 0x60: {
					// RTS
					this.PC = this.stack_pop_u16() + 1;
					break;
				}
				case 0x40: {
					// RTI
					this.status.bits = this.stack_pop();
					this.status.unset(EStatusFlag.BRK);
					this.status.set(EStatusFlag.BRK2);
					this.PC = this.stack_pop_u16();
					break;
				}
				case 0xd0: {
					// BNE
					this.branch(!this.status.has(EStatusFlag.ZERO));
					break;
				}
				case 0x70: {
					// BVS
					this.branch(this.status.has(EStatusFlag.OVR));
					break;
				}
				case 0x50: {
					// BVC
					this.branch(!this.status.has(EStatusFlag.OVR));
					break;
				}
				case 0x10: {
					// BPL
					this.branch(!this.status.has(EStatusFlag.NEG));
					break;
				}
				case 0x30: {
					// BMI
					this.branch(this.status.has(EStatusFlag.NEG));
					break;
				}
				case 0xf0: {
					// BEQ
					this.branch(this.status.has(EStatusFlag.ZERO));
					break;
				}
				case 0xb0: {
					// BCS
					this.branch(this.status.has(EStatusFlag.CARRY));
					break;
				}
				case 0x90: {
					// BCC
					this.branch(!this.status.has(EStatusFlag.CARRY));
					break;
				}
				case 0x24:
				case 0x2c: {
					// BIT
					this.bit(op.mode);
					break;
				}
				case 0x85:
				case 0x95:
				case 0x8d:
				case 0x9d:
				case 0x99:
				case 0x81:
				case 0x91: {
					// STA
					this.sta(op.mode);
					break;
				}
				case 0x86:
				case 0x96:
				case 0x8e: {
					// STX
					const addr = this.get_operand_address(op.mode);
					this.write(addr, this.register_x);
					break;
				}
				case 0x84:
				case 0x94:
				case 0x8c: {
					// STY
					const addr = this.get_operand_address(op.mode);
					this.write(addr, this.register_y);
					break;
				}
				case 0xa2:
				case 0xa6:
				case 0xb6:
				case 0xae:
				case 0xbe: {
					// LDX
					this.ldx(op.mode);
					break;
				}
				case 0xa0:
				case 0xa4:
				case 0xb4:
				case 0xac:
				case 0xbc: {
					// LDY
					this.ldy(op.mode);
					break;
				}
				case 0xea: {
					// NOP
					break;
				}
				case 0xa8: {
					// TAY
					this.register_y = this.register_a;
					this.update_status_flags(this.register_y);
					break;
				}
				case 0xba: {
					// TSX
					this.register_x = this.stack_pointer;
					this.update_status_flags(this.register_x);
					break;
				}
				case 0x8a: {
					// TXA
					this.register_a = this.register_x;
					this.update_status_flags(this.register_a);
					break;
				}
				case 0x9a: {
					// TXS
					this.stack_pointer = this.register_x;
					break;
				}
				case 0x98: {
					// TYA
					this.register_a = this.register_y;
					this.update_status_flags(this.register_a);
					break;
				}
				case 0x00: {
					should_run = false;
					break;
				}
				default: {
					throw new Error(
						`Unhandled opcode: 0x${opscode.toString(16)}`,
					);
				}
			}
			if (pc_state == this.PC) {
				this.PC += op.length - 1;
			}
			if (callback != undefined) {
				callback(this);
			}
		}
	}
}

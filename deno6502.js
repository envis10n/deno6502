// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

function wrapping_clamp(max, min, val) {
    const mod = max + 1 - min;
    if (val > max) return val - mod;
    else if (val < min) return val + mod;
    else return val;
}
var NumericError;
(function(NumericError1) {
    NumericError1[NumericError1["OVERFLOW"] = 0] = "OVERFLOW";
})(NumericError || (NumericError = {}));
function bitset(value, bit) {
    return (value & 1 << bit) != 0;
}
function buildNumeric(max, min, bits) {
    const constr = wrapping_clamp.bind(null, max, min);
    constr.BITS = bits;
    constr.MAX = max;
    constr.MIN = min;
    constr.add = (a, b)=>{
        const r = a + b;
        if (r > constr.MAX || r < constr.MIN) throw NumericError.OVERFLOW;
        return r;
    };
    constr.sub = (a, b)=>{
        const r = a - b;
        if (r > constr.MAX || r < constr.MIN) throw NumericError.OVERFLOW;
        return r;
    };
    constr.mul = (a, b)=>{
        const r = a * b;
        if (r > constr.MAX || r < constr.MIN) throw NumericError.OVERFLOW;
        return r;
    };
    constr.div = (a, b)=>{
        const r = Math.floor(a / b);
        if (r > constr.MAX || r < constr.MIN) throw NumericError.OVERFLOW;
        return r;
    };
    constr.wrapping_add = (a, b)=>{
        return constr(a + b);
    };
    constr.wrapping_sub = (a, b)=>{
        return constr(a - b);
    };
    return constr;
}
const u8 = buildNumeric(255, 0, 8);
const u16 = buildNumeric(65535, 0, 16);
const i8 = buildNumeric(127, -128, 8);
buildNumeric(32767, -32768, 16);
function i8_neg(value) {
    if (value == i8.MIN) return i8.MIN;
    return -value;
}
class Bitflags {
    _value;
    get bits() {
        return this._value;
    }
    set bits(val) {
        this._value = val;
    }
    static factory() {
        return (value)=>{
            return new Bitflags(value);
        };
    }
    constructor(value){
        this._value = value == undefined ? 0 : value.valueOf();
    }
    set(flags) {
        this._value |= flags.valueOf();
        return this;
    }
    unset(flags) {
        this._value &= ~flags.valueOf();
        return this;
    }
    toggle(flags) {
        this._value ^= flags.valueOf();
        return this;
    }
    has(flags) {
        return (this._value & flags.valueOf()) != 0;
    }
    clone() {
        const n = new Bitflags();
        n.bits = this.bits;
        return n;
    }
}
function addressInRange(addr, max, min = 0x0000) {
    return addr <= max || addr >= min;
}
class Bus {
    memory_map = [];
    get_mapped_memory(addr) {
        return this.memory_map.find((mem)=>{
            return addressInRange(addr, mem.end, mem.start);
        });
    }
    attach(start, end, mem) {
        if (this.get_mapped_memory(start) != undefined || this.get_mapped_memory(end) != undefined) {
            throw new Error(`Memory region 0x${start.toString(16)}..0x${end.toString(16)} conflicts.`);
        }
        const obj = {
            start,
            end,
            access: mem
        };
        this.memory_map.push(obj);
    }
    read_from(addr) {
        const mem = this.get_mapped_memory(addr);
        if (mem == undefined) {
            throw new Error(`Address 0x${addr.toString(16)} is not mapped.`);
        }
        return mem.access.read(addr);
    }
    write_to(addr, value) {
        const mem = this.get_mapped_memory(addr);
        if (mem == undefined) {
            throw new Error(`Address 0x${addr.toString(16)} is not mapped.`);
        }
        return mem.access.write(addr, value);
    }
    read(address) {
        if (addressInRange(address, 0x1fff, 0x0000)) {
            const mirrored = address & 0b00000111_11111111;
            return this.read_from(mirrored);
        } else if (addressInRange(address, 0x3fff, 0x2000)) {
            throw new Error("PPU NYI");
        } else {
            console.log(`Ignoring memory access at 0x${address.toString(16)}`);
        }
        return 0;
    }
    write(addr, value) {
        if (addressInRange(addr, 0x1fff, 0x0000)) {
            const mirrored = addr & 0b11111111111;
            this.write_to(mirrored, value);
        } else if (addressInRange(addr, 0x3fff, 0x2000)) {
            throw new Error("PPU NYI");
        } else {
            console.log(`Ignoring memory write at 0x${addr.toString(16)}`);
        }
    }
    read_u16(addr) {
        const lo = this.read(u16(addr));
        const hi = this.read(u16(addr + 1));
        return hi << 8 | u16(lo);
    }
    write_u16(addr, value) {
        const hi = u8(value >> 8);
        const lo = u8(value & 0xff);
        this.write(u16(addr), lo);
        this.write(u16(addr + 1), hi);
    }
}
class RAMChip {
    memory;
    constructor(size){
        this.memory = new Uint8Array(size);
    }
    read(address) {
        return this.memory[u16(address)];
    }
    write(address, value) {
        this.memory[u16(address)] = value;
    }
    read_u16(address) {
        const lo = this.read(u16(address));
        const hi = this.read(u16(address + 1));
        return hi << 8 | u16(lo);
    }
    write_u16(address, value) {
        const hi = u8(value >> 8);
        const lo = u8(value & 0xff);
        this.write(u16(address), lo);
        this.write(u16(address + 1), hi);
    }
}
var EAddressingMode;
(function(EAddressingMode2) {
    EAddressingMode2[EAddressingMode2["Immediate"] = 0] = "Immediate";
    EAddressingMode2[EAddressingMode2["ZeroPage"] = 1] = "ZeroPage";
    EAddressingMode2[EAddressingMode2["ZeroPage_X"] = 2] = "ZeroPage_X";
    EAddressingMode2[EAddressingMode2["ZeroPage_Y"] = 3] = "ZeroPage_Y";
    EAddressingMode2[EAddressingMode2["Absolute"] = 4] = "Absolute";
    EAddressingMode2[EAddressingMode2["Absolute_X"] = 5] = "Absolute_X";
    EAddressingMode2[EAddressingMode2["Absolute_Y"] = 6] = "Absolute_Y";
    EAddressingMode2[EAddressingMode2["Indirect_X"] = 7] = "Indirect_X";
    EAddressingMode2[EAddressingMode2["Indirect_Y"] = 8] = "Indirect_Y";
    EAddressingMode2[EAddressingMode2["NoneAddressing"] = 9] = "NoneAddressing";
})(EAddressingMode || (EAddressingMode = {}));
function newOp(code, mnemonic, length, cycles, mode) {
    return {
        code,
        mnemonic,
        length,
        cycles,
        mode
    };
}
const CPU_OP_CODES = [
    newOp(0x00, "BRK", 1, 7, EAddressingMode.NoneAddressing),
    newOp(0xea, "NOP", 1, 2, EAddressingMode.NoneAddressing),
    newOp(0x69, "ADC", 2, 2, EAddressingMode.Immediate),
    newOp(0x65, "ADC", 2, 3, EAddressingMode.ZeroPage),
    newOp(0x75, "ADC", 2, 4, EAddressingMode.ZeroPage_X),
    newOp(0x6d, "ADC", 3, 4, EAddressingMode.Absolute),
    newOp(0x7d, "ADC", 3, 4, EAddressingMode.Absolute_X),
    newOp(0x79, "ADC", 3, 4, EAddressingMode.Absolute_Y),
    newOp(0x61, "ADC", 2, 6, EAddressingMode.Indirect_X),
    newOp(0x71, "ADC", 2, 5, EAddressingMode.Indirect_Y),
    newOp(0xe9, "SBC", 2, 2, EAddressingMode.Immediate),
    newOp(0xe5, "SBC", 2, 3, EAddressingMode.ZeroPage),
    newOp(0xf5, "SBC", 2, 4, EAddressingMode.ZeroPage_X),
    newOp(0xed, "SBC", 3, 4, EAddressingMode.Absolute),
    newOp(0xfd, "SBC", 3, 4, EAddressingMode.Absolute_X),
    newOp(0xf9, "SBC", 3, 4, EAddressingMode.Absolute_Y),
    newOp(0xe1, "SBC", 2, 6, EAddressingMode.Indirect_X),
    newOp(0xf1, "SBC", 2, 5, EAddressingMode.Indirect_Y),
    newOp(0x29, "AND", 2, 2, EAddressingMode.Immediate),
    newOp(0x25, "AND", 2, 3, EAddressingMode.ZeroPage),
    newOp(0x35, "AND", 2, 4, EAddressingMode.ZeroPage_X),
    newOp(0x2d, "AND", 3, 4, EAddressingMode.Absolute),
    newOp(0x3d, "AND", 3, 4, EAddressingMode.Absolute_X),
    newOp(0x39, "AND", 3, 4, EAddressingMode.Absolute_Y),
    newOp(0x21, "AND", 2, 6, EAddressingMode.Indirect_X),
    newOp(0x31, "AND", 2, 5, EAddressingMode.Indirect_Y),
    newOp(0x49, "EOR", 2, 2, EAddressingMode.Immediate),
    newOp(0x45, "EOR", 2, 3, EAddressingMode.ZeroPage),
    newOp(0x55, "EOR", 2, 4, EAddressingMode.ZeroPage_X),
    newOp(0x4d, "EOR", 3, 4, EAddressingMode.Absolute),
    newOp(0x5d, "EOR", 3, 4, EAddressingMode.Absolute_X),
    newOp(0x59, "EOR", 3, 4, EAddressingMode.Absolute_Y),
    newOp(0x41, "EOR", 2, 6, EAddressingMode.Indirect_X),
    newOp(0x51, "EOR", 2, 5, EAddressingMode.Indirect_Y),
    newOp(0x09, "ORA", 2, 2, EAddressingMode.Immediate),
    newOp(0x05, "ORA", 2, 3, EAddressingMode.ZeroPage),
    newOp(0x15, "ORA", 2, 4, EAddressingMode.ZeroPage_X),
    newOp(0x0d, "ORA", 3, 4, EAddressingMode.Absolute),
    newOp(0x1d, "ORA", 3, 4, EAddressingMode.Absolute_X),
    newOp(0x19, "ORA", 3, 4, EAddressingMode.Absolute_Y),
    newOp(0x01, "ORA", 2, 6, EAddressingMode.Indirect_X),
    newOp(0x11, "ORA", 2, 5, EAddressingMode.Indirect_Y),
    newOp(0x0a, "ASL", 1, 2, EAddressingMode.NoneAddressing),
    newOp(0x06, "ASL", 2, 5, EAddressingMode.ZeroPage),
    newOp(0x16, "ASL", 2, 6, EAddressingMode.ZeroPage_X),
    newOp(0x0e, "ASL", 3, 6, EAddressingMode.Absolute),
    newOp(0x1e, "ASL", 3, 7, EAddressingMode.Absolute_X),
    newOp(0x4a, "LSR", 1, 2, EAddressingMode.NoneAddressing),
    newOp(0x46, "LSR", 2, 5, EAddressingMode.ZeroPage),
    newOp(0x56, "LSR", 2, 6, EAddressingMode.ZeroPage_X),
    newOp(0x4e, "LSR", 3, 6, EAddressingMode.Absolute),
    newOp(0x5e, "LSR", 3, 7, EAddressingMode.Absolute_X),
    newOp(0x2a, "ROL", 1, 2, EAddressingMode.NoneAddressing),
    newOp(0x26, "ROL", 2, 5, EAddressingMode.ZeroPage),
    newOp(0x36, "ROL", 2, 6, EAddressingMode.ZeroPage_X),
    newOp(0x2e, "ROL", 3, 6, EAddressingMode.Absolute),
    newOp(0x3e, "ROL", 3, 7, EAddressingMode.Absolute_X),
    newOp(0x6a, "ROR", 1, 2, EAddressingMode.NoneAddressing),
    newOp(0x66, "ROR", 2, 5, EAddressingMode.ZeroPage),
    newOp(0x76, "ROR", 2, 6, EAddressingMode.ZeroPage_X),
    newOp(0x6e, "ROR", 3, 6, EAddressingMode.Absolute),
    newOp(0x7e, "ROR", 3, 7, EAddressingMode.Absolute_X),
    newOp(0xe6, "INC", 2, 5, EAddressingMode.ZeroPage),
    newOp(0xf6, "INC", 2, 6, EAddressingMode.ZeroPage_X),
    newOp(0xee, "INC", 3, 6, EAddressingMode.Absolute),
    newOp(0xfe, "INC", 3, 7, EAddressingMode.Absolute_X),
    newOp(0xe8, "INX", 1, 2, EAddressingMode.NoneAddressing),
    newOp(0xc8, "INY", 1, 2, EAddressingMode.NoneAddressing),
    newOp(0xc6, "DEC", 2, 5, EAddressingMode.ZeroPage),
    newOp(0xd6, "DEC", 2, 6, EAddressingMode.ZeroPage_X),
    newOp(0xce, "DEC", 3, 6, EAddressingMode.Absolute),
    newOp(0xde, "DEC", 3, 7, EAddressingMode.Absolute_X),
    newOp(0xca, "DEX", 1, 2, EAddressingMode.NoneAddressing),
    newOp(0x88, "DEY", 1, 2, EAddressingMode.NoneAddressing),
    newOp(0xc9, "CMP", 2, 2, EAddressingMode.Immediate),
    newOp(0xc5, "CMP", 2, 3, EAddressingMode.ZeroPage),
    newOp(0xd5, "CMP", 2, 4, EAddressingMode.ZeroPage_X),
    newOp(0xcd, "CMP", 3, 4, EAddressingMode.Absolute),
    newOp(0xdd, "CMP", 3, 4, EAddressingMode.Absolute_X),
    newOp(0xd9, "CMP", 3, 4, EAddressingMode.Absolute_Y),
    newOp(0xc1, "CMP", 2, 6, EAddressingMode.Indirect_X),
    newOp(0xd1, "CMP", 2, 5, EAddressingMode.Indirect_Y),
    newOp(0xc0, "CPY", 2, 2, EAddressingMode.Immediate),
    newOp(0xc4, "CPY", 2, 3, EAddressingMode.ZeroPage),
    newOp(0xcc, "CPY", 3, 4, EAddressingMode.Absolute),
    newOp(0xe0, "CPX", 2, 2, EAddressingMode.Immediate),
    newOp(0xe4, "CPX", 2, 3, EAddressingMode.ZeroPage),
    newOp(0xec, "CPX", 3, 4, EAddressingMode.Absolute),
    newOp(0x4c, "JMP", 3, 3, EAddressingMode.NoneAddressing),
    newOp(0x6c, "JMP", 3, 5, EAddressingMode.NoneAddressing),
    newOp(0x20, "JSR", 3, 6, EAddressingMode.NoneAddressing),
    newOp(0x60, "RTS", 1, 6, EAddressingMode.NoneAddressing),
    newOp(0x40, "RTI", 1, 6, EAddressingMode.NoneAddressing),
    newOp(0xd0, "BNE", 2, 2, EAddressingMode.NoneAddressing),
    newOp(0x70, "BVS", 2, 2, EAddressingMode.NoneAddressing),
    newOp(0x50, "BVC", 2, 2, EAddressingMode.NoneAddressing),
    newOp(0x30, "BMI", 2, 2, EAddressingMode.NoneAddressing),
    newOp(0xf0, "BEQ", 2, 2, EAddressingMode.NoneAddressing),
    newOp(0xb0, "BCS", 2, 2, EAddressingMode.NoneAddressing),
    newOp(0x90, "BCC", 2, 2, EAddressingMode.NoneAddressing),
    newOp(0x10, "BPL", 2, 2, EAddressingMode.NoneAddressing),
    newOp(0x24, "BIT", 2, 3, EAddressingMode.ZeroPage),
    newOp(0x2c, "BIT", 3, 4, EAddressingMode.Absolute),
    newOp(0xa9, "LDA", 2, 2, EAddressingMode.Immediate),
    newOp(0xa5, "LDA", 2, 3, EAddressingMode.ZeroPage),
    newOp(0xb5, "LDA", 2, 4, EAddressingMode.ZeroPage_X),
    newOp(0xad, "LDA", 3, 4, EAddressingMode.Absolute),
    newOp(0xbd, "LDA", 3, 4, EAddressingMode.Absolute_X),
    newOp(0xb9, "LDA", 3, 4, EAddressingMode.Absolute_Y),
    newOp(0xa1, "LDA", 2, 6, EAddressingMode.Indirect_X),
    newOp(0xb1, "LDA", 2, 5, EAddressingMode.Indirect_Y),
    newOp(0xa2, "LDX", 2, 2, EAddressingMode.Immediate),
    newOp(0xa6, "LDX", 2, 3, EAddressingMode.ZeroPage),
    newOp(0xb6, "LDX", 2, 4, EAddressingMode.ZeroPage_Y),
    newOp(0xae, "LDX", 3, 4, EAddressingMode.Absolute),
    newOp(0xbe, "LDX", 3, 4, EAddressingMode.Absolute_Y),
    newOp(0xa0, "LDY", 2, 2, EAddressingMode.Immediate),
    newOp(0xa4, "LDY", 2, 3, EAddressingMode.ZeroPage),
    newOp(0xb4, "LDY", 2, 4, EAddressingMode.ZeroPage_X),
    newOp(0xac, "LDY", 3, 4, EAddressingMode.Absolute),
    newOp(0xbc, "LDY", 3, 4, EAddressingMode.Absolute_X),
    newOp(0x85, "STA", 2, 3, EAddressingMode.ZeroPage),
    newOp(0x95, "STA", 2, 4, EAddressingMode.ZeroPage_X),
    newOp(0x8d, "STA", 3, 4, EAddressingMode.Absolute),
    newOp(0x9d, "STA", 3, 5, EAddressingMode.Absolute_X),
    newOp(0x99, "STA", 3, 5, EAddressingMode.Absolute_Y),
    newOp(0x81, "STA", 2, 6, EAddressingMode.Indirect_X),
    newOp(0x91, "STA", 2, 6, EAddressingMode.Indirect_Y),
    newOp(0x86, "STX", 2, 3, EAddressingMode.ZeroPage),
    newOp(0x96, "STX", 2, 4, EAddressingMode.ZeroPage_Y),
    newOp(0x8e, "STX", 3, 4, EAddressingMode.Absolute),
    newOp(0x84, "STY", 2, 3, EAddressingMode.ZeroPage),
    newOp(0x94, "STY", 2, 4, EAddressingMode.ZeroPage_X),
    newOp(0x8c, "STY", 3, 4, EAddressingMode.Absolute),
    newOp(0xD8, "CLD", 1, 2, EAddressingMode.NoneAddressing),
    newOp(0x58, "CLI", 1, 2, EAddressingMode.NoneAddressing),
    newOp(0xb8, "CLV", 1, 2, EAddressingMode.NoneAddressing),
    newOp(0x18, "CLC", 1, 2, EAddressingMode.NoneAddressing),
    newOp(0x38, "SEC", 1, 2, EAddressingMode.NoneAddressing),
    newOp(0x78, "SEI", 1, 2, EAddressingMode.NoneAddressing),
    newOp(0xf8, "SED", 1, 2, EAddressingMode.NoneAddressing),
    newOp(0xaa, "TAX", 1, 2, EAddressingMode.NoneAddressing),
    newOp(0xa8, "TAY", 1, 2, EAddressingMode.NoneAddressing),
    newOp(0xba, "TSX", 1, 2, EAddressingMode.NoneAddressing),
    newOp(0x8a, "TXA", 1, 2, EAddressingMode.NoneAddressing),
    newOp(0x9a, "TXS", 1, 2, EAddressingMode.NoneAddressing),
    newOp(0x98, "TYA", 1, 2, EAddressingMode.NoneAddressing),
    newOp(0x48, "PHA", 1, 3, EAddressingMode.NoneAddressing),
    newOp(0x68, "PLA", 1, 4, EAddressingMode.NoneAddressing),
    newOp(0x08, "PHP", 1, 3, EAddressingMode.NoneAddressing),
    newOp(0x28, "PLP", 1, 4, EAddressingMode.NoneAddressing),
    newOp(0xc7, "*DCP", 2, 5, EAddressingMode.ZeroPage),
    newOp(0xd7, "*DCP", 2, 6, EAddressingMode.ZeroPage_X),
    newOp(0xCF, "*DCP", 3, 6, EAddressingMode.Absolute),
    newOp(0xdF, "*DCP", 3, 7, EAddressingMode.Absolute_X),
    newOp(0xdb, "*DCP", 3, 7, EAddressingMode.Absolute_Y),
    newOp(0xd3, "*DCP", 2, 8, EAddressingMode.Indirect_Y),
    newOp(0xc3, "*DCP", 2, 8, EAddressingMode.Indirect_X),
    newOp(0x27, "*RLA", 2, 5, EAddressingMode.ZeroPage),
    newOp(0x37, "*RLA", 2, 6, EAddressingMode.ZeroPage_X),
    newOp(0x2F, "*RLA", 3, 6, EAddressingMode.Absolute),
    newOp(0x3F, "*RLA", 3, 7, EAddressingMode.Absolute_X),
    newOp(0x3b, "*RLA", 3, 7, EAddressingMode.Absolute_Y),
    newOp(0x33, "*RLA", 2, 8, EAddressingMode.Indirect_Y),
    newOp(0x23, "*RLA", 2, 8, EAddressingMode.Indirect_X),
    newOp(0x07, "*SLO", 2, 5, EAddressingMode.ZeroPage),
    newOp(0x17, "*SLO", 2, 6, EAddressingMode.ZeroPage_X),
    newOp(0x0F, "*SLO", 3, 6, EAddressingMode.Absolute),
    newOp(0x1f, "*SLO", 3, 7, EAddressingMode.Absolute_X),
    newOp(0x1b, "*SLO", 3, 7, EAddressingMode.Absolute_Y),
    newOp(0x03, "*SLO", 2, 8, EAddressingMode.Indirect_X),
    newOp(0x13, "*SLO", 2, 8, EAddressingMode.Indirect_Y),
    newOp(0x47, "*SRE", 2, 5, EAddressingMode.ZeroPage),
    newOp(0x57, "*SRE", 2, 6, EAddressingMode.ZeroPage_X),
    newOp(0x4F, "*SRE", 3, 6, EAddressingMode.Absolute),
    newOp(0x5f, "*SRE", 3, 7, EAddressingMode.Absolute_X),
    newOp(0x5b, "*SRE", 3, 7, EAddressingMode.Absolute_Y),
    newOp(0x43, "*SRE", 2, 8, EAddressingMode.Indirect_X),
    newOp(0x53, "*SRE", 2, 8, EAddressingMode.Indirect_Y),
    newOp(0x80, "*NOP", 2, 2, EAddressingMode.Immediate),
    newOp(0x82, "*NOP", 2, 2, EAddressingMode.Immediate),
    newOp(0x89, "*NOP", 2, 2, EAddressingMode.Immediate),
    newOp(0xc2, "*NOP", 2, 2, EAddressingMode.Immediate),
    newOp(0xe2, "*NOP", 2, 2, EAddressingMode.Immediate),
    newOp(0xCB, "*AXS", 2, 2, EAddressingMode.Immediate),
    newOp(0x6B, "*ARR", 2, 2, EAddressingMode.Immediate),
    newOp(0xeb, "*SBC", 2, 2, EAddressingMode.Immediate),
    newOp(0x0b, "*ANC", 2, 2, EAddressingMode.Immediate),
    newOp(0x2b, "*ANC", 2, 2, EAddressingMode.Immediate),
    newOp(0x4b, "*ALR", 2, 2, EAddressingMode.Immediate),
    newOp(0x04, "*NOP", 2, 3, EAddressingMode.ZeroPage),
    newOp(0x44, "*NOP", 2, 3, EAddressingMode.ZeroPage),
    newOp(0x64, "*NOP", 2, 3, EAddressingMode.ZeroPage),
    newOp(0x14, "*NOP", 2, 4, EAddressingMode.ZeroPage_X),
    newOp(0x34, "*NOP", 2, 4, EAddressingMode.ZeroPage_X),
    newOp(0x54, "*NOP", 2, 4, EAddressingMode.ZeroPage_X),
    newOp(0x74, "*NOP", 2, 4, EAddressingMode.ZeroPage_X),
    newOp(0xd4, "*NOP", 2, 4, EAddressingMode.ZeroPage_X),
    newOp(0xf4, "*NOP", 2, 4, EAddressingMode.ZeroPage_X),
    newOp(0x0c, "*NOP", 3, 4, EAddressingMode.Absolute),
    newOp(0x1c, "*NOP", 3, 4, EAddressingMode.Absolute_X),
    newOp(0x3c, "*NOP", 3, 4, EAddressingMode.Absolute_X),
    newOp(0x5c, "*NOP", 3, 4, EAddressingMode.Absolute_X),
    newOp(0x7c, "*NOP", 3, 4, EAddressingMode.Absolute_X),
    newOp(0xdc, "*NOP", 3, 4, EAddressingMode.Absolute_X),
    newOp(0xfc, "*NOP", 3, 4, EAddressingMode.Absolute_X),
    newOp(0x67, "*RRA", 2, 5, EAddressingMode.ZeroPage),
    newOp(0x77, "*RRA", 2, 6, EAddressingMode.ZeroPage_X),
    newOp(0x6f, "*RRA", 3, 6, EAddressingMode.Absolute),
    newOp(0x7f, "*RRA", 3, 7, EAddressingMode.Absolute_X),
    newOp(0x7b, "*RRA", 3, 7, EAddressingMode.Absolute_Y),
    newOp(0x63, "*RRA", 2, 8, EAddressingMode.Indirect_X),
    newOp(0x73, "*RRA", 2, 8, EAddressingMode.Indirect_Y),
    newOp(0xe7, "*ISB", 2, 5, EAddressingMode.ZeroPage),
    newOp(0xf7, "*ISB", 2, 6, EAddressingMode.ZeroPage_X),
    newOp(0xef, "*ISB", 3, 6, EAddressingMode.Absolute),
    newOp(0xff, "*ISB", 3, 7, EAddressingMode.Absolute_X),
    newOp(0xfb, "*ISB", 3, 7, EAddressingMode.Absolute_Y),
    newOp(0xe3, "*ISB", 2, 8, EAddressingMode.Indirect_X),
    newOp(0xf3, "*ISB", 2, 8, EAddressingMode.Indirect_Y),
    newOp(0x02, "*NOP", 1, 2, EAddressingMode.NoneAddressing),
    newOp(0x12, "*NOP", 1, 2, EAddressingMode.NoneAddressing),
    newOp(0x22, "*NOP", 1, 2, EAddressingMode.NoneAddressing),
    newOp(0x32, "*NOP", 1, 2, EAddressingMode.NoneAddressing),
    newOp(0x42, "*NOP", 1, 2, EAddressingMode.NoneAddressing),
    newOp(0x52, "*NOP", 1, 2, EAddressingMode.NoneAddressing),
    newOp(0x62, "*NOP", 1, 2, EAddressingMode.NoneAddressing),
    newOp(0x72, "*NOP", 1, 2, EAddressingMode.NoneAddressing),
    newOp(0x92, "*NOP", 1, 2, EAddressingMode.NoneAddressing),
    newOp(0xb2, "*NOP", 1, 2, EAddressingMode.NoneAddressing),
    newOp(0xd2, "*NOP", 1, 2, EAddressingMode.NoneAddressing),
    newOp(0xf2, "*NOP", 1, 2, EAddressingMode.NoneAddressing),
    newOp(0x1a, "*NOP", 1, 2, EAddressingMode.NoneAddressing),
    newOp(0x3a, "*NOP", 1, 2, EAddressingMode.NoneAddressing),
    newOp(0x5a, "*NOP", 1, 2, EAddressingMode.NoneAddressing),
    newOp(0x7a, "*NOP", 1, 2, EAddressingMode.NoneAddressing),
    newOp(0xda, "*NOP", 1, 2, EAddressingMode.NoneAddressing),
    newOp(0xfa, "*NOP", 1, 2, EAddressingMode.NoneAddressing),
    newOp(0xab, "*LXA", 2, 3, EAddressingMode.Immediate),
    newOp(0x8b, "*XAA", 2, 3, EAddressingMode.Immediate),
    newOp(0xbb, "*LAS", 3, 2, EAddressingMode.Absolute_Y),
    newOp(0x9b, "*TAS", 3, 2, EAddressingMode.Absolute_Y),
    newOp(0x93, "*AHX", 2, 8, EAddressingMode.Indirect_Y),
    newOp(0x9f, "*AHX", 3, 4, EAddressingMode.Absolute_Y),
    newOp(0x9e, "*SHX", 3, 4, EAddressingMode.Absolute_Y),
    newOp(0x9c, "*SHY", 3, 4, EAddressingMode.Absolute_X),
    newOp(0xa7, "*LAX", 2, 3, EAddressingMode.ZeroPage),
    newOp(0xb7, "*LAX", 2, 4, EAddressingMode.ZeroPage_Y),
    newOp(0xaf, "*LAX", 3, 4, EAddressingMode.Absolute),
    newOp(0xbf, "*LAX", 3, 4, EAddressingMode.Absolute_Y),
    newOp(0xa3, "*LAX", 2, 6, EAddressingMode.Indirect_X),
    newOp(0xb3, "*LAX", 2, 5, EAddressingMode.Indirect_Y),
    newOp(0x87, "*SAX", 2, 3, EAddressingMode.ZeroPage),
    newOp(0x97, "*SAX", 2, 4, EAddressingMode.ZeroPage_Y),
    newOp(0x8f, "*SAX", 3, 4, EAddressingMode.Absolute),
    newOp(0x83, "*SAX", 2, 6, EAddressingMode.Indirect_X), 
];
const _OPCODES_MAP = new Map();
for (const cpuop of CPU_OP_CODES){
    _OPCODES_MAP.set(cpuop.code, cpuop);
}
const OPCODES_MAP = _OPCODES_MAP;
export { RAMChip as RAMChip };
var EAddressingMode1;
(function(EAddressingMode3) {
    EAddressingMode3[EAddressingMode3["Immediate"] = 0] = "Immediate";
    EAddressingMode3[EAddressingMode3["ZeroPage"] = 1] = "ZeroPage";
    EAddressingMode3[EAddressingMode3["ZeroPage_X"] = 2] = "ZeroPage_X";
    EAddressingMode3[EAddressingMode3["ZeroPage_Y"] = 3] = "ZeroPage_Y";
    EAddressingMode3[EAddressingMode3["Absolute"] = 4] = "Absolute";
    EAddressingMode3[EAddressingMode3["Absolute_X"] = 5] = "Absolute_X";
    EAddressingMode3[EAddressingMode3["Absolute_Y"] = 6] = "Absolute_Y";
    EAddressingMode3[EAddressingMode3["Indirect_X"] = 7] = "Indirect_X";
    EAddressingMode3[EAddressingMode3["Indirect_Y"] = 8] = "Indirect_Y";
    EAddressingMode3[EAddressingMode3["NoneAddressing"] = 9] = "NoneAddressing";
})(EAddressingMode1 || (EAddressingMode1 = {}));
var EStatusFlag;
(function(EStatusFlag1) {
    EStatusFlag1[EStatusFlag1["CARRY"] = 0] = "CARRY";
    EStatusFlag1[EStatusFlag1["ZERO"] = 1] = "ZERO";
    EStatusFlag1[EStatusFlag1["INT"] = 2] = "INT";
    EStatusFlag1[EStatusFlag1["DEC"] = 3] = "DEC";
    EStatusFlag1[EStatusFlag1["BRK"] = 4] = "BRK";
    EStatusFlag1[EStatusFlag1["BRK2"] = 5] = "BRK2";
    EStatusFlag1[EStatusFlag1["OVR"] = 6] = "OVR";
    EStatusFlag1[EStatusFlag1["NEG"] = 7] = "NEG";
})(EStatusFlag || (EStatusFlag = {}));
const STACK = 0x0100;
const STACK_RESET = 0xfd;
const StatusFlags = Bitflags.factory();
class CPU {
    status = StatusFlags();
    PC = 0;
    register_a = 0;
    register_x = 0;
    register_y = 0;
    stack_pointer = 0xfd;
    bus = new Bus();
    update_status_flags(value) {
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
    read(address) {
        return this.bus.read(address);
    }
    write(address, value) {
        return this.bus.write(address, value);
    }
    read_u16(address) {
        return this.bus.read_u16(address);
    }
    write_u16(address, value) {
        return this.bus.write_u16(address, value);
    }
    get_absolute_address(mode, addr) {
        switch(mode){
            case EAddressingMode1.ZeroPage:
                {
                    return this.read(addr);
                }
            case EAddressingMode1.ZeroPage_X:
                {
                    const pos = this.read(addr);
                    return u8.wrapping_add(pos, this.register_x);
                }
            case EAddressingMode1.ZeroPage_Y:
                {
                    const pos = this.read(addr);
                    return u8.wrapping_add(pos, this.register_y);
                }
            case EAddressingMode1.Absolute:
                {
                    return this.read_u16(addr);
                }
            case EAddressingMode1.Absolute_X:
                {
                    const base = this.read_u16(addr);
                    return u16.wrapping_add(base, this.register_x);
                }
            case EAddressingMode1.Absolute_Y:
                {
                    const base = this.read_u16(addr);
                    return u16.wrapping_add(base, this.register_y);
                }
            case EAddressingMode1.Indirect_X:
                {
                    const base = this.read(addr);
                    const ptr = u8.wrapping_add(base, this.register_x);
                    const lo = this.read(ptr);
                    const hi = this.read(u8.wrapping_add(ptr, 1));
                    return hi << 8 | lo;
                }
            case EAddressingMode1.Indirect_Y:
                {
                    const base = this.read(addr);
                    const lo = this.read(base);
                    const hi = this.read(u8.wrapping_add(base, 1));
                    const deref_base = hi << 8 | lo;
                    return u16.wrapping_add(deref_base, this.register_y);
                }
            default:
                throw new Error(`Addressing mode not supported: ${mode}`);
        }
    }
    get_operand_address(mode) {
        switch(mode){
            case EAddressingMode1.Immediate:
                {
                    return this.PC;
                }
            default:
                {
                    return this.get_absolute_address(mode, this.PC);
                }
        }
    }
    ldy(mode) {
        const addr = this.get_operand_address(mode);
        const data = this.read(addr);
        this.register_y = data;
        this.update_status_flags(this.register_y);
    }
    ldx(mode) {
        const addr = this.get_operand_address(mode);
        const data = this.read(addr);
        this.register_x = data;
        this.update_status_flags(this.register_x);
    }
    lda(mode) {
        const addr = this.get_operand_address(mode);
        const value = this.read(addr);
        this.set_register_a(value);
    }
    sta(mode) {
        const addr = this.get_operand_address(mode);
        this.write(addr, this.register_a);
    }
    set_register_a(value) {
        this.register_a = value;
        this.update_status_flags(this.register_a);
    }
    _and(mode) {
        const addr = this.get_operand_address(mode);
        const data = this.read(addr);
        this.set_register_a(data & this.register_a);
    }
    _eor(mode) {
        const addr = this.get_operand_address(mode);
        const data = this.read(addr);
        this.set_register_a(data ^ this.register_a);
    }
    _ora(mode) {
        const addr = this.get_operand_address(mode);
        const data = this.read(addr);
        this.set_register_a(data | this.register_a);
    }
    tax() {
        this.register_x = this.register_a;
        this.update_status_flags(this.register_x);
    }
    inx() {
        this.register_x = u8.wrapping_add(this.register_x, 1);
        this.update_status_flags(this.register_x);
    }
    iny() {
        this.register_y = u8.wrapping_add(this.register_y, 1);
    }
    add_to_register_a(data) {
        const sum = u16(this.register_a + data + (this.status.has(EStatusFlag.CARRY) ? 1 : 0));
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
    sbc(mode) {
        const addr = this.get_operand_address(mode);
        const data = this.read(addr);
        this.add_to_register_a(u8(i8.wrapping_sub(i8_neg(data), 1)));
    }
    adc(mode) {
        const addr = this.get_operand_address(mode);
        const val = this.read(addr);
        this.add_to_register_a(val);
    }
    stack_pop() {
        this.stack_pointer = u8.wrapping_add(this.stack_pointer, 1);
        return this.read(0x0100 + this.stack_pointer);
    }
    stack_push(data) {
        this.write(0x0100 + this.stack_pointer, data);
        this.stack_pointer = u8.wrapping_sub(this.stack_pointer, 1);
    }
    stack_push_u16(data) {
        const hi = data >> 8;
        const lo = data & 0xff;
        this.stack_push(hi);
        this.stack_push(lo);
    }
    stack_pop_u16() {
        const lo = this.stack_pop();
        const hi = this.stack_pop();
        return hi << 8 | lo;
    }
    asl_accumulator() {
        let data = this.register_a;
        if (data >> 7 == 1) {
            this.status.set(EStatusFlag.CARRY);
        } else {
            this.status.unset(EStatusFlag.CARRY);
        }
        data = data << 1;
        this.set_register_a(data);
    }
    asl(mode) {
        const addr = this.get_operand_address(mode);
        let data = this.read(addr);
        if (data >> 7 == 1) {
            this.status.set(EStatusFlag.CARRY);
        } else {
            this.status.unset(EStatusFlag.CARRY);
        }
        data = data << 1;
        this.write(addr, data);
        this.update_status_flags(data);
        return data;
    }
    lsr_accumulator() {
        let data = this.register_a;
        if ((data & 1) == 1) {
            this.status.set(EStatusFlag.CARRY);
        } else {
            this.status.unset(EStatusFlag.CARRY);
        }
        data = data >> 1;
        this.set_register_a(data);
    }
    lsr(mode) {
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
    rol(mode) {
        const addr = this.get_operand_address(mode);
        let data = this.read(addr);
        const old_carry = this.status.has(EStatusFlag.CARRY);
        if (data >> 7 == 1) {
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
    rol_accumulator() {
        let data = this.register_a;
        const old_carry = this.status.has(EStatusFlag.CARRY);
        if (data >> 7 == 1) {
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
    ror(mode) {
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
    ror_accumulator() {
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
    inc(mode) {
        const addr = this.get_operand_address(mode);
        let data = this.read(addr);
        data = u8.wrapping_add(data, 1);
        this.write(addr, data);
        this.update_status_flags(data);
        return data;
    }
    dey() {
        this.register_y = u8.wrapping_sub(this.register_y, 1);
        this.update_status_flags(this.register_y);
    }
    dex() {
        this.register_x = u8.wrapping_sub(this.register_x, 1);
        this.update_status_flags(this.register_x);
    }
    dec(mode) {
        const addr = this.get_operand_address(mode);
        let data = this.read(addr);
        data = u8.wrapping_sub(data, 1);
        this.write(addr, data);
        this.update_status_flags(data);
        return data;
    }
    pla() {
        const data = this.stack_pop();
        this.set_register_a(data);
    }
    plp() {
        this.status.bits = this.stack_pop();
        this.status.unset(EStatusFlag.BRK);
        this.status.set(EStatusFlag.BRK2);
    }
    php() {
        const flags = this.status.clone();
        flags.set(EStatusFlag.BRK);
        flags.set(EStatusFlag.BRK2);
        this.stack_push(flags.bits);
    }
    bit(mode) {
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
    compare(mode, compare_with) {
        const addr = this.get_operand_address(mode);
        const data = this.read(addr);
        if (data <= compare_with) {
            this.status.set(EStatusFlag.CARRY);
        } else {
            this.status.unset(EStatusFlag.CARRY);
        }
        this.update_status_flags(u8.wrapping_sub(compare_with, data));
    }
    branch(condition) {
        if (condition) {
            const jump = i8(this.read(this.PC));
            const jump_addr = u16.wrapping_add(u16.wrapping_add(this.PC, 1), u16(jump));
            this.PC = jump_addr;
        }
    }
    load(program) {
        for(let i = 0; i < program.length; i++){
            this.write(0x8000 + i, program[i]);
        }
        this.write_u16(0xfffc, 0x8000);
    }
    reset() {
        this.register_a = 0;
        this.register_x = 0;
        this.register_y = 0;
        this.stack_pointer = STACK_RESET;
        this.status = StatusFlags(EStatusFlag.BRK | EStatusFlag.INT);
        this.PC = this.read_u16(0xfffc);
    }
    interpret(program, callback) {
        this.load(program);
        this.reset();
        let should_run = true;
        while(should_run){
            const opscode = this.read(this.PC);
            const op = OPCODES_MAP.get(opscode);
            if (op == undefined) {
                throw new Error(`Unhandled opcode: 0x${opscode}`);
            }
            console.log(`0x${this.PC.toString(16)}\t${op.mnemonic}`);
            this.PC += 1;
            const pc_state = this.PC;
            switch(opscode){
                case 0xa9:
                case 0xa5:
                case 0xb5:
                case 0xad:
                case 0xbd:
                case 0xb9:
                case 0xa1:
                case 0xb1:
                    {
                        this.lda(op.mode);
                        break;
                    }
                case 0xaa:
                    {
                        this.tax();
                        break;
                    }
                case 0xe8:
                    {
                        this.inx();
                        break;
                    }
                case 0xd8:
                    {
                        this.status.unset(EStatusFlag.DEC);
                        break;
                    }
                case 0x58:
                    {
                        this.status.unset(EStatusFlag.INT);
                        break;
                    }
                case 0xb8:
                    {
                        this.status.unset(EStatusFlag.OVR);
                        break;
                    }
                case 0x18:
                    {
                        this.status.unset(EStatusFlag.CARRY);
                        break;
                    }
                case 0x38:
                    {
                        this.status.set(EStatusFlag.CARRY);
                        break;
                    }
                case 0x78:
                    {
                        this.status.set(EStatusFlag.INT);
                        break;
                    }
                case 0xf8:
                    {
                        this.status.set(EStatusFlag.DEC);
                        break;
                    }
                case 0x48:
                    {
                        this.stack_push(this.register_a);
                        break;
                    }
                case 0x68:
                    {
                        this.pla();
                        break;
                    }
                case 0x08:
                    {
                        this.php();
                        break;
                    }
                case 0x28:
                    {
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
                case 0x71:
                    {
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
                case 0xf1:
                    {
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
                case 0x31:
                    {
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
                case 0x51:
                    {
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
                case 0x11:
                    {
                        this._ora(op.mode);
                        break;
                    }
                case 0x4a:
                    {
                        this.lsr_accumulator();
                        break;
                    }
                case 0x46:
                case 0x56:
                case 0x4e:
                case 0x5e:
                    {
                        this.lsr(op.mode);
                        break;
                    }
                case 0x0a:
                    {
                        this.asl_accumulator();
                        break;
                    }
                case 0x06:
                case 0x16:
                case 0x0e:
                case 0x1e:
                    {
                        this.asl(op.mode);
                        break;
                    }
                case 0x2a:
                    {
                        this.rol_accumulator();
                        break;
                    }
                case 0x26:
                case 0x36:
                case 0x2e:
                case 0x3e:
                    {
                        this.rol(op.mode);
                        break;
                    }
                case 0x6a:
                    {
                        this.ror_accumulator();
                        break;
                    }
                case 0x66:
                case 0x76:
                case 0x6e:
                case 0x7e:
                    {
                        this.ror(op.mode);
                        break;
                    }
                case 0xe6:
                case 0xf6:
                case 0xee:
                case 0xfe:
                    {
                        this.inc(op.mode);
                        break;
                    }
                case 0xc8:
                    {
                        this.iny();
                        break;
                    }
                case 0xc6:
                case 0xd6:
                case 0xce:
                case 0xde:
                    {
                        this.dec(op.mode);
                        break;
                    }
                case 0xca:
                    {
                        this.dex();
                        break;
                    }
                case 0x88:
                    {
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
                case 0xd1:
                    {
                        this.compare(op.mode, this.register_a);
                        break;
                    }
                case 0xc0:
                case 0xc4:
                case 0xcc:
                    {
                        this.compare(op.mode, this.register_y);
                        break;
                    }
                case 0xe0:
                case 0xe4:
                case 0xec:
                    {
                        this.compare(op.mode, this.register_x);
                        break;
                    }
                case 0x4c:
                    {
                        const mem_address = this.read_u16(this.PC);
                        this.PC = mem_address;
                        break;
                    }
                case 0x6c:
                    {
                        const mem_address = this.read_u16(this.PC);
                        const indirect_ref = (()=>{
                            if ((mem_address & 0x00ff) == 0x00ff) {
                                const lo = this.read(mem_address);
                                const hi = this.read(mem_address & 0xff00);
                                return hi << 8 | lo;
                            } else {
                                return this.read_u16(mem_address);
                            }
                        })();
                        this.PC = indirect_ref;
                        break;
                    }
                case 0x20:
                    {
                        this.stack_push_u16(this.PC + 2 - 1);
                        const target_address = this.read_u16(this.PC);
                        this.PC = target_address;
                        break;
                    }
                case 0x60:
                    {
                        this.PC = this.stack_pop_u16() + 1;
                        break;
                    }
                case 0x40:
                    {
                        this.status.bits = this.stack_pop();
                        this.status.unset(EStatusFlag.BRK);
                        this.status.set(EStatusFlag.BRK2);
                        this.PC = this.stack_pop_u16();
                        break;
                    }
                case 0xd0:
                    {
                        this.branch(!this.status.has(EStatusFlag.ZERO));
                        break;
                    }
                case 0x70:
                    {
                        this.branch(this.status.has(EStatusFlag.OVR));
                        break;
                    }
                case 0x50:
                    {
                        this.branch(!this.status.has(EStatusFlag.OVR));
                        break;
                    }
                case 0x10:
                    {
                        this.branch(!this.status.has(EStatusFlag.NEG));
                        break;
                    }
                case 0x30:
                    {
                        this.branch(this.status.has(EStatusFlag.NEG));
                        break;
                    }
                case 0xf0:
                    {
                        this.branch(this.status.has(EStatusFlag.ZERO));
                        break;
                    }
                case 0xb0:
                    {
                        this.branch(this.status.has(EStatusFlag.CARRY));
                        break;
                    }
                case 0x90:
                    {
                        this.branch(!this.status.has(EStatusFlag.CARRY));
                        break;
                    }
                case 0x24:
                case 0x2c:
                    {
                        this.bit(op.mode);
                        break;
                    }
                case 0x85:
                case 0x95:
                case 0x8d:
                case 0x9d:
                case 0x99:
                case 0x81:
                case 0x91:
                    {
                        this.sta(op.mode);
                        break;
                    }
                case 0x86:
                case 0x96:
                case 0x8e:
                    {
                        const addr = this.get_operand_address(op.mode);
                        this.write(addr, this.register_x);
                        break;
                    }
                case 0x84:
                case 0x94:
                case 0x8c:
                    {
                        const addr = this.get_operand_address(op.mode);
                        this.write(addr, this.register_y);
                        break;
                    }
                case 0xa2:
                case 0xa6:
                case 0xb6:
                case 0xae:
                case 0xbe:
                    {
                        this.ldx(op.mode);
                        break;
                    }
                case 0xa0:
                case 0xa4:
                case 0xb4:
                case 0xac:
                case 0xbc:
                    {
                        this.ldy(op.mode);
                        break;
                    }
                case 0xea:
                    {
                        break;
                    }
                case 0xa8:
                    {
                        this.register_y = this.register_a;
                        this.update_status_flags(this.register_y);
                        break;
                    }
                case 0xba:
                    {
                        this.register_x = this.stack_pointer;
                        this.update_status_flags(this.register_x);
                        break;
                    }
                case 0x8a:
                    {
                        this.register_a = this.register_x;
                        this.update_status_flags(this.register_a);
                        break;
                    }
                case 0x9a:
                    {
                        this.stack_pointer = this.register_x;
                        break;
                    }
                case 0x98:
                    {
                        this.register_a = this.register_y;
                        this.update_status_flags(this.register_a);
                        break;
                    }
                case 0x00:
                    {
                        should_run = false;
                        break;
                    }
                default:
                    {
                        throw new Error(`Unhandled opcode: 0x${opscode.toString(16)}`);
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
export { EAddressingMode1 as EAddressingMode };
export { EStatusFlag as EStatusFlag };
export { STACK as STACK };
export { STACK_RESET as STACK_RESET };
export { StatusFlags as StatusFlags };
export { CPU as CPU };

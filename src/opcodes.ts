enum EAddressingMode {
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

export interface OpCode {
	code: number;
	mnemonic: string;
	length: number;
	cycles: number;
	mode: EAddressingMode;
}

function newOp(
	code: number,
	mnemonic: string,
	length: number,
	cycles: number,
	mode: EAddressingMode,
): OpCode {
	return {
		code,
		mnemonic,
		length,
		cycles,
		mode,
	};
}

const CPU_OP_CODES: OpCode[] = [
	newOp(0x00, "BRK", 1, 7, EAddressingMode.NoneAddressing),
	newOp(0xea, "NOP", 1, 2, EAddressingMode.NoneAddressing),

	/* Arithmetic */
	newOp(0x69, "ADC", 2, 2, EAddressingMode.Immediate),
	newOp(0x65, "ADC", 2, 3, EAddressingMode.ZeroPage),
	newOp(0x75, "ADC", 2, 4, EAddressingMode.ZeroPage_X),
	newOp(0x6d, "ADC", 3, 4, EAddressingMode.Absolute),
	newOp(0x7d, "ADC", 3, 4, /*+1 if page crossed*/ EAddressingMode.Absolute_X),
	newOp(0x79, "ADC", 3, 4, /*+1 if page crossed*/ EAddressingMode.Absolute_Y),
	newOp(0x61, "ADC", 2, 6, EAddressingMode.Indirect_X),
	newOp(0x71, "ADC", 2, 5, /*+1 if page crossed*/ EAddressingMode.Indirect_Y),

	newOp(0xe9, "SBC", 2, 2, EAddressingMode.Immediate),
	newOp(0xe5, "SBC", 2, 3, EAddressingMode.ZeroPage),
	newOp(0xf5, "SBC", 2, 4, EAddressingMode.ZeroPage_X),
	newOp(0xed, "SBC", 3, 4, EAddressingMode.Absolute),
	newOp(0xfd, "SBC", 3, 4, /*+1 if page crossed*/ EAddressingMode.Absolute_X),
	newOp(0xf9, "SBC", 3, 4, /*+1 if page crossed*/ EAddressingMode.Absolute_Y),
	newOp(0xe1, "SBC", 2, 6, EAddressingMode.Indirect_X),
	newOp(0xf1, "SBC", 2, 5, /*+1 if page crossed*/ EAddressingMode.Indirect_Y),

	newOp(0x29, "AND", 2, 2, EAddressingMode.Immediate),
	newOp(0x25, "AND", 2, 3, EAddressingMode.ZeroPage),
	newOp(0x35, "AND", 2, 4, EAddressingMode.ZeroPage_X),
	newOp(0x2d, "AND", 3, 4, EAddressingMode.Absolute),
	newOp(0x3d, "AND", 3, 4, /*+1 if page crossed*/ EAddressingMode.Absolute_X),
	newOp(0x39, "AND", 3, 4, /*+1 if page crossed*/ EAddressingMode.Absolute_Y),
	newOp(0x21, "AND", 2, 6, EAddressingMode.Indirect_X),
	newOp(0x31, "AND", 2, 5, /*+1 if page crossed*/ EAddressingMode.Indirect_Y),

	newOp(0x49, "EOR", 2, 2, EAddressingMode.Immediate),
	newOp(0x45, "EOR", 2, 3, EAddressingMode.ZeroPage),
	newOp(0x55, "EOR", 2, 4, EAddressingMode.ZeroPage_X),
	newOp(0x4d, "EOR", 3, 4, EAddressingMode.Absolute),
	newOp(0x5d, "EOR", 3, 4, /*+1 if page crossed*/ EAddressingMode.Absolute_X),
	newOp(0x59, "EOR", 3, 4, /*+1 if page crossed*/ EAddressingMode.Absolute_Y),
	newOp(0x41, "EOR", 2, 6, EAddressingMode.Indirect_X),
	newOp(0x51, "EOR", 2, 5, /*+1 if page crossed*/ EAddressingMode.Indirect_Y),

	newOp(0x09, "ORA", 2, 2, EAddressingMode.Immediate),
	newOp(0x05, "ORA", 2, 3, EAddressingMode.ZeroPage),
	newOp(0x15, "ORA", 2, 4, EAddressingMode.ZeroPage_X),
	newOp(0x0d, "ORA", 3, 4, EAddressingMode.Absolute),
	newOp(0x1d, "ORA", 3, 4, /*+1 if page crossed*/ EAddressingMode.Absolute_X),
	newOp(0x19, "ORA", 3, 4, /*+1 if page crossed*/ EAddressingMode.Absolute_Y),
	newOp(0x01, "ORA", 2, 6, EAddressingMode.Indirect_X),
	newOp(0x11, "ORA", 2, 5, /*+1 if page crossed*/ EAddressingMode.Indirect_Y),

	/* Shifts */
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
	newOp(0xdd, "CMP", 3, 4, /*+1 if page crossed*/ EAddressingMode.Absolute_X),
	newOp(0xd9, "CMP", 3, 4, /*+1 if page crossed*/ EAddressingMode.Absolute_Y),
	newOp(0xc1, "CMP", 2, 6, EAddressingMode.Indirect_X),
	newOp(0xd1, "CMP", 2, 5, /*+1 if page crossed*/ EAddressingMode.Indirect_Y),

	newOp(0xc0, "CPY", 2, 2, EAddressingMode.Immediate),
	newOp(0xc4, "CPY", 2, 3, EAddressingMode.ZeroPage),
	newOp(0xcc, "CPY", 3, 4, EAddressingMode.Absolute),

	newOp(0xe0, "CPX", 2, 2, EAddressingMode.Immediate),
	newOp(0xe4, "CPX", 2, 3, EAddressingMode.ZeroPage),
	newOp(0xec, "CPX", 3, 4, EAddressingMode.Absolute),

	/* Branching */

	newOp(0x4c, "JMP", 3, 3, EAddressingMode.NoneAddressing), //AddressingMode that acts as Immidiate
	newOp(0x6c, "JMP", 3, 5, EAddressingMode.NoneAddressing), //AddressingMode:Indirect with 6502 bug

	newOp(0x20, "JSR", 3, 6, EAddressingMode.NoneAddressing),
	newOp(0x60, "RTS", 1, 6, EAddressingMode.NoneAddressing),

	newOp(0x40, "RTI", 1, 6, EAddressingMode.NoneAddressing),

	newOp(
		0xd0,
		"BNE",
		2,
		2, /*(+1 if branch succeeds +2 if to a new page)*/
		EAddressingMode.NoneAddressing,
	),
	newOp(
		0x70,
		"BVS",
		2,
		2, /*(+1 if branch succeeds +2 if to a new page)*/
		EAddressingMode.NoneAddressing,
	),
	newOp(
		0x50,
		"BVC",
		2,
		2, /*(+1 if branch succeeds +2 if to a new page)*/
		EAddressingMode.NoneAddressing,
	),
	newOp(
		0x30,
		"BMI",
		2,
		2, /*(+1 if branch succeeds +2 if to a new page)*/
		EAddressingMode.NoneAddressing,
	),
	newOp(
		0xf0,
		"BEQ",
		2,
		2, /*(+1 if branch succeeds +2 if to a new page)*/
		EAddressingMode.NoneAddressing,
	),
	newOp(
		0xb0,
		"BCS",
		2,
		2, /*(+1 if branch succeeds +2 if to a new page)*/
		EAddressingMode.NoneAddressing,
	),
	newOp(
		0x90,
		"BCC",
		2,
		2, /*(+1 if branch succeeds +2 if to a new page)*/
		EAddressingMode.NoneAddressing,
	),
	newOp(
		0x10,
		"BPL",
		2,
		2, /*(+1 if branch succeeds +2 if to a new page)*/
		EAddressingMode.NoneAddressing,
	),

	newOp(0x24, "BIT", 2, 3, EAddressingMode.ZeroPage),
	newOp(0x2c, "BIT", 3, 4, EAddressingMode.Absolute),

	/* Stores, Loads */
	newOp(0xa9, "LDA", 2, 2, EAddressingMode.Immediate),
	newOp(0xa5, "LDA", 2, 3, EAddressingMode.ZeroPage),
	newOp(0xb5, "LDA", 2, 4, EAddressingMode.ZeroPage_X),
	newOp(0xad, "LDA", 3, 4, EAddressingMode.Absolute),
	newOp(0xbd, "LDA", 3, 4, /*+1 if page crossed*/ EAddressingMode.Absolute_X),
	newOp(0xb9, "LDA", 3, 4, /*+1 if page crossed*/ EAddressingMode.Absolute_Y),
	newOp(0xa1, "LDA", 2, 6, EAddressingMode.Indirect_X),
	newOp(0xb1, "LDA", 2, 5, /*+1 if page crossed*/ EAddressingMode.Indirect_Y),

	newOp(0xa2, "LDX", 2, 2, EAddressingMode.Immediate),
	newOp(0xa6, "LDX", 2, 3, EAddressingMode.ZeroPage),
	newOp(0xb6, "LDX", 2, 4, EAddressingMode.ZeroPage_Y),
	newOp(0xae, "LDX", 3, 4, EAddressingMode.Absolute),
	newOp(0xbe, "LDX", 3, 4, /*+1 if page crossed*/ EAddressingMode.Absolute_Y),

	newOp(0xa0, "LDY", 2, 2, EAddressingMode.Immediate),
	newOp(0xa4, "LDY", 2, 3, EAddressingMode.ZeroPage),
	newOp(0xb4, "LDY", 2, 4, EAddressingMode.ZeroPage_X),
	newOp(0xac, "LDY", 3, 4, EAddressingMode.Absolute),
	newOp(0xbc, "LDY", 3, 4, /*+1 if page crossed*/ EAddressingMode.Absolute_X),

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

	/* Flags clear */

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

	/* Stack */
	newOp(0x48, "PHA", 1, 3, EAddressingMode.NoneAddressing),
	newOp(0x68, "PLA", 1, 4, EAddressingMode.NoneAddressing),
	newOp(0x08, "PHP", 1, 3, EAddressingMode.NoneAddressing),
	newOp(0x28, "PLP", 1, 4, EAddressingMode.NoneAddressing),

	/* unofficial */

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
	// newOp(0xCB, "IGN", 3,4 /* or 5*/, EAddressingMode.Absolute_X),

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
	newOp(0x1c, "*NOP", 3, 4, /*or 5*/ EAddressingMode.Absolute_X),
	newOp(0x3c, "*NOP", 3, 4, /*or 5*/ EAddressingMode.Absolute_X),
	newOp(0x5c, "*NOP", 3, 4, /*or 5*/ EAddressingMode.Absolute_X),
	newOp(0x7c, "*NOP", 3, 4, /*or 5*/ EAddressingMode.Absolute_X),
	newOp(0xdc, "*NOP", 3, 4, /* or 5*/ EAddressingMode.Absolute_X),
	newOp(0xfc, "*NOP", 3, 4, /* or 5*/ EAddressingMode.Absolute_X),

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
	// newOp(0xea, "NOP", 1,2, EAddressingMode.NoneAddressing),
	newOp(0xfa, "*NOP", 1, 2, EAddressingMode.NoneAddressing),

	newOp(0xab, "*LXA", 2, 3, EAddressingMode.Immediate), //todo: highly unstable and not used
	//http://visual6502.org/wiki/index.php?title=6502_Opcode_8B_%28XAA,_ANE%29
	newOp(0x8b, "*XAA", 2, 3, EAddressingMode.Immediate), //todo: highly unstable and not used
	newOp(0xbb, "*LAS", 3, 2, EAddressingMode.Absolute_Y), //todo: highly unstable and not used
	newOp(0x9b, "*TAS", 3, 2, EAddressingMode.Absolute_Y), //todo: highly unstable and not used
	newOp(0x93, "*AHX", 2, /* guess */ 8, EAddressingMode.Indirect_Y), //todo: highly unstable and not used
	newOp(0x9f, "*AHX", 3, /* guess */ 4, /* or 5*/ EAddressingMode.Absolute_Y), //todo: highly unstable and not used
	newOp(0x9e, "*SHX", 3, /* guess */ 4, /* or 5*/ EAddressingMode.Absolute_Y), //todo: highly unstable and not used
	newOp(0x9c, "*SHY", 3, /* guess */ 4, /* or 5*/ EAddressingMode.Absolute_X), //todo: highly unstable and not used

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

const _OPCODES_MAP: Map<number, OpCode> = new Map();
for (const cpuop of CPU_OP_CODES) {
	_OPCODES_MAP.set(cpuop.code, cpuop);
}

export const OPCODES_MAP = _OPCODES_MAP;

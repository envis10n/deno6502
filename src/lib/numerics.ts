function wrapping_clamp(max: number, min: number, val: number): number {
	const mod: number = (max + 1) - min;
	if (val > max) return val - mod;
	else if (val < min) return val + mod;
	else return val;
}

export function fmt_hex(inp: number, digits = 2): string {
	let res = inp.toString(16);
	if (res.length < digits) {
		res = "0".repeat(digits - res.length) + res;
	}
	return res;
}

export function fmt(inp: string, ...args: number[]): string {
	const reg = /{:(\d\d)([xXb])}/;
	let arg_ct = 0;
	let res = inp;
	let reg_res2 = reg.exec(res);
	while (reg_res2 != null) {
		const digits = Number(reg_res2[1]);
		if (args[arg_ct] == undefined) {
			throw `MISSING ARGS: ${inp} (${args.join(",")})`;
		}
		let ntmp = args[arg_ct].toString(
			reg_res2[2].toLowerCase() == "b" ? 2 : 16,
		);
		if (ntmp.length < digits) {
			ntmp = "0".repeat(digits - ntmp.length) + ntmp;
		}
		arg_ct += 1;
		res = res.replace(
			reg_res2[0],
			reg_res2[2] == "X" ? ntmp.toUpperCase() : ntmp,
		);
		reg_res2 = reg.exec(res);
	}
	return res;
}

export interface INumeric {
	MIN: number;
	MAX: number;
	BITS: number;
	add(a: number, b: number): number;
	sub(a: number, b: number): number;
	mul(a: number, b: number): number;
	div(a: number, b: number): number;
	wrapping_add(a: number, b: number): number;
	wrapping_sub(a: number, b: number): number;
}

export type NumericConstructor = (v: number) => number;

export type Numeric = NumericConstructor & INumeric;

export enum NumericError {
	OVERFLOW,
}

export function bitset(value: number, bit: number): boolean {
	return (value & 1 << bit) != 0;
}

function buildNumeric(max: number, min: number, bits: number): Numeric {
	const constr = wrapping_clamp.bind(null, max, min) as Numeric;
	constr.BITS = bits;
	constr.MAX = max;
	constr.MIN = min;
	constr.add = (a, b) => {
		const r = a + b;
		if (r > constr.MAX || r < constr.MIN) throw NumericError.OVERFLOW;
		return r;
	};
	constr.sub = (a, b) => {
		const r = a - b;
		if (r > constr.MAX || r < constr.MIN) throw NumericError.OVERFLOW;
		return r;
	};
	constr.mul = (a, b) => {
		const r = a * b;
		if (r > constr.MAX || r < constr.MIN) throw NumericError.OVERFLOW;
		return r;
	};
	constr.div = (a, b) => {
		const r = Math.floor(a / b);
		if (r > constr.MAX || r < constr.MIN) throw NumericError.OVERFLOW;
		return r;
	};
	constr.wrapping_add = (a, b) => {
		return constr(a + b);
	};
	constr.wrapping_sub = (a, b) => {
		return constr(a - b);
	};
	return constr;
}

export const u8 = buildNumeric(255, 0, 8);
export const u16 = buildNumeric(65535, 0, 16);
export const i8 = buildNumeric(127, -128, 8);
export const i16 = buildNumeric(32767, -32768, 16);

export function i8_neg(value: number): number {
	if (value == i8.MIN) return i8.MIN;
	return -value;
}

export function i16_neg(value: number): number {
	if (value == i16.MIN) return i16.MIN;
	return -value;
}

export class Bitflags<T extends number> {
	private _value: number;
	public get bits(): number {
		return this._value;
	}
	public set bits(val: number) {
		this._value = val;
	}
	public static factory<T extends number>(): (value?: T) => Bitflags<T> {
		return (value?: T) => {
			return new Bitflags(value);
		};
	}
	constructor(value?: T) {
		this._value = value == undefined ? 0 : value.valueOf();
	}
	public set(flags: T): this {
		this._value |= flags.valueOf();
		return this;
	}
	public unset(flags: T): this {
		this._value &= ~flags.valueOf();
		return this;
	}
	public toggle(flags: T): this {
		this._value ^= flags.valueOf();
		return this;
	}
	public has(flags: T): boolean {
		return (this._value & flags.valueOf()) != 0;
	}
	public clone(): Bitflags<T> {
		const n = new Bitflags();
		n.bits = this.bits;
		return n;
	}
}

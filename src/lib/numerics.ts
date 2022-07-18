function wrapping_clamp(max: number, min: number, val: number): number {
	const mod: number = (max + 1) - min;
	if (val > max) return val - mod;
	else if (val < min) return val + mod;
	else return val;
}

export interface INumeric {
	MIN: number;
	MAX: number;
	BITS: number;
}

export type NumericConstructor = (v: number) => number;

export type Numeric = NumericConstructor & INumeric;

function buildNumeric(max: number, min: number, bits: number): Numeric {
	const constr = wrapping_clamp.bind(null, max, min) as Numeric;
	constr.BITS = bits;
	constr.MAX = max;
	constr.MIN = min;
	return constr;
}

export const u8 = buildNumeric(255, 0, 8);
export const u16 = buildNumeric(65535, 0, 16);
export const i8 = buildNumeric(127, -128, 8);
export const i16 = buildNumeric(32767, -32768, 16);

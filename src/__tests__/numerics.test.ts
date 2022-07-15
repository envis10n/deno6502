import { i16, i8, u16, u8 } from "../lib/numerics.ts";
import { assertEquals } from "https://deno.land/std@0.148.0/testing/asserts.ts";

Deno.test("numeric_u8", () => {
	const a = u8.new(232);
	const b = u8.new(u8.MAX + 1);
	const c = u8.new(u8.MIN - 1);

	assertEquals(a, 232);
	assertEquals(b, u8.MIN);
	assertEquals(c, u8.MAX);
});

Deno.test("numeric_u16", () => {
	const a = u16.new(2320);
	const b = u16.new(u16.MAX + 1);
	const c = u16.new(u16.MIN - 1);

	assertEquals(a, 2320);
	assertEquals(b, u16.MIN);
	assertEquals(c, u16.MAX);
});

Deno.test("numeric_i8", () => {
	const a = i8.new(-5);
	const b = i8.new(i8.MAX + 1);
	const c = i8.new(i8.MIN - 1);

	assertEquals(a, -5);
	assertEquals(b, i8.MIN);
	assertEquals(c, i8.MAX);
});

Deno.test("numeric_i16", () => {
	const a = i16.new(-500);
	const b = i16.new(i16.MAX + 1);
	const c = i16.new(i16.MIN - 1);

	assertEquals(a, -500);
	assertEquals(b, i16.MIN);
	assertEquals(c, i16.MAX);
});

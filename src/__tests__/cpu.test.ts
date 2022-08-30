import { CPU, EStatusFlag } from "../mod.ts";
import { RAMChip } from "../memory.ts";
import {
	assert,
	assertEquals,
} from "https://deno.land/std@0.148.0/testing/asserts.ts";

Deno.test("cpu_test", () => {
	const cpu = new CPU();

	cpu.bus.attach(0x0000, 0xffff, new RAMChip(0xffff));

	cpu.interpret(new Uint8Array([0xa9, 0xff, 0x85, 0x25, 0xaa, 0xe8, 0x00]));

	cpu.stack_push(0xff);

	cpu.stack_push_u16(0xfffc);

	assertEquals(cpu.stack_pop(), 0xfc);
	assertEquals(cpu.stack_pop(), 0xff);
	assertEquals(cpu.stack_pop(), 0xff);

	assertEquals(cpu.register_a, 0xff);
	assertEquals(cpu.register_x, 0x00);
});

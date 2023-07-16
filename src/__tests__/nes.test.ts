import { CPU } from "../mod.ts";
import { Rom } from "../cartridge.ts";
import { RAM_MIRRORS_END, RAMChip } from "../memory.ts";
import {
	assert,
	assertEquals,
} from "https://deno.land/std@0.148.0/testing/asserts.ts";
import { fmt } from "../lib/numerics.ts";

Deno.test("NESTest", () => {
	const cpu = new CPU();
	const ram = new RAMChip(RAM_MIRRORS_END);
	const cart = new Rom(Deno.readFileSync("nestest.nes"));
	console.log(cart.prg_rom.length);
	cpu.bus.attach(0x0000, RAM_MIRRORS_END, ram);
	cpu.bus.attach(0x4020, 0xffff, cart);
	cpu.reset();
	cpu.PC = 0xc000;
	while (cpu.step()) {
		//
	}
	Deno.writeTextFileSync("nestest.log", cpu.traceLog.join("\n"));
	assertEquals(cpu.read(0x0002), 0x00);
	assertEquals(cpu.read(0x0003), 0x00);
});

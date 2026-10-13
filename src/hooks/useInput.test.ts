import { describe, expect, it } from "vitest";
import { useInput } from "./useInput";

describe("useInput", () => {
  it("memiliki nilai awal dan memperbarui nilai dari event input", () => {
    const [value, onChange] = useInput("awal");

    expect(value.value).toBe("awal");

    onChange({ target: { value: "baru" } } as unknown as Event);

    expect(value.value).toBe("baru");
  });

  it("reset mengembalikan nilai awal", () => {
    const [value, onChange, reset] = useInput("awal");

    onChange({ target: { value: "baru" } } as unknown as Event);
    reset();

    expect(value.value).toBe("awal");
  });
});

import { createQRCodeDataUrl } from "./qrCode";
import { TextEncoder } from "util";

global.TextEncoder = TextEncoder;

describe("createQRCodeDataUrl", () => {
  test("gera um PNG local para um valor de QR Code", async () => {
    const dataUrl = await createQRCodeDataUrl("carteirinha-123");
    const png = Buffer.from(dataUrl.split(",")[1], "base64");

    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
    expect(png.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  });

  test("não gera imagem para uma entrada vazia", async () => {
    await expect(createQRCodeDataUrl("  ")).resolves.toBe("");
  });

  test("rejeita valor excessivamente grande", async () => {
    await expect(createQRCodeDataUrl("x".repeat(257))).rejects.toThrow(
      "excede 256 caracteres",
    );
  });
});

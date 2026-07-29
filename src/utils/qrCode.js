import QRCode from "qrcode";

const MAX_QR_VALUE_LENGTH = 256;

export function createQRCodeDataUrl(value) {
  const normalizedValue = value == null ? "" : String(value).trim();
  if (!normalizedValue) {
    return Promise.resolve("");
  }
  if (normalizedValue.length > MAX_QR_VALUE_LENGTH) {
    return Promise.reject(new RangeError("Valor do QR Code excede 256 caracteres"));
  }

  return QRCode.toDataURL(normalizedValue, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 300,
  });
}

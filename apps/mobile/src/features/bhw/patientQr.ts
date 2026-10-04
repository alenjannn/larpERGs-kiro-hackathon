// Patient QR reference. Pure, on-device, works offline.
// The code carries ONLY "tuloy:patient:<patient id>": never a name, phone,
// address, measurement or any other health data.

import createQr from 'qrcode-generator';

export const PATIENT_QR_PREFIX = 'tuloy:patient:';

/** The only string ever encoded in a patient QR code. */
export function patientQrReference(patientId: string): string {
  return `${PATIENT_QR_PREFIX}${patientId.trim()}`;
}

/**
 * Builds the QR module matrix (true = dark) for a reference string.
 * Automatic version, error correction level M.
 */
export function buildQrMatrix(text: string): boolean[][] {
  const qr = createQr(0, 'M');
  qr.addData(text, 'Byte');
  qr.make();
  const count = qr.getModuleCount();
  const matrix: boolean[][] = [];
  for (let row = 0; row < count; row += 1) {
    const cells: boolean[] = [];
    for (let col = 0; col < count; col += 1) cells.push(qr.isDark(row, col));
    matrix.push(cells);
  }
  return matrix;
}

import QRCode from 'qrcode'
export async function generateQRSvg(url: string): Promise<string> {
  return QRCode.toString(url, {
    type: 'svg', margin: 2,
    color: { dark: '#00ff99', light: '#0a0a0a' },
    errorCorrectionLevel: 'M',
  })
}

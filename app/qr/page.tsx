// app/qr-scanner/page.js
import PdfQrScannerNode from '@/components/PdfQrScannerNode';

export const metadata = {
  title: 'PDF QR Scanner',
  description: 'Scan QR codes from uploaded PDF files',
};

export default function QrScannerPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="container mx-auto px-4">
        <PdfQrScannerNode />
      </div>
    </div>
  );
}
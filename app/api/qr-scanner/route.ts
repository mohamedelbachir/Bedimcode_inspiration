// app/api/qr-scanner/route.ts

import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import os from 'os';
import { PDF_QR_JS } from 'pdf-qr';

type DecodeResult = {
  success: boolean;
  codes: string[];
  message?: string;
};

function decodePageAsync(fileUrl: string, page: number, configs: any): Promise<string[]> {
  return new Promise((resolve, reject) => {
    PDF_QR_JS.decodeSinglePage(
      fileUrl,
      page,
      configs,
      (r: DecodeResult) => {
        if (r.success) {
          resolve(r.codes);
        } else {
          reject(new Error(r.message || 'Failed to extract QR code'));
        }
      }
    );
  });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const pdfFile = formData.get('pdf') as File | null;
    const pageValue = formData.get('page');
    const pageNumber = parseInt(typeof pageValue === 'string' ? pageValue : '1', 10);

    if (!pdfFile) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (pdfFile.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Uploaded file is not a PDF' }, { status: 400 });
    }

    const tempDir = os.tmpdir();
    const uniqueFilename = `pdf-${Date.now()}.pdf`;
    const filePath = join(tempDir, uniqueFilename);

    const fileBuffer = Buffer.from(await pdfFile.arrayBuffer());
    await writeFile(filePath, fileBuffer);

    const fileUrl = new URL(`file:///${filePath.replace(/\\/g, '/')}`).href;

    const configs = {
      scale: {
        once: true,
        value: 1,
        start: 0.2,
        step: 0.2,
        stop: 2,
      },
      resultOpts: {
        singleCodeInPage: true,
        multiCodesInPage: false,
        maxCodesInPage: 1,
      },
      improve: true,
      jsQR: {},
    };

    const result = await decodePageAsync(fileUrl, pageNumber, configs);

    return NextResponse.json({
      success: true,
      codes: result,
      page: pageNumber,
    });

  } catch (error: any) {
    console.error('Error processing PDF:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
    }, { status: 500 });
  }
}

import pdf from 'pdf-parse/lib/pdf-parse'
import { NextRequest, NextResponse } from 'next/server'; // To handle the request and response
import { promises as fs } from 'fs'; // To save the file temporarily
import { v4 as uuidv4 } from 'uuid'; // To generate a unique filename
import PDFParser from 'pdf2json'; // To parse the pdf
import { tmpdir } from 'os';
import { join } from 'path';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('pdf') as File;

  if (!file || file.type !== 'application/pdf') {
     return NextResponse.json({ success: false, error: 'Invalid PDF file' }, { status: 400 });
  }

  const uploadedFiles = formData.get('pdf') as File;
  let fileName = '';
  let parsedText = '';

  if (uploadedFiles) {
    const uploadedFile = uploadedFiles;
    console.log('Uploaded file:', uploadedFile);
    
    // Check if uploadedFile is of type File
    if (uploadedFile instanceof File) {
      // Generate a unique filename
      fileName = uuidv4();

      // Convert the uploaded file into a temporary file
      //const tempFilePath = `/tmp/${fileName}.pdf`;
      const tempFilePath = join(tmpdir(), `${fileName}.pdf`);

     
      // Convert ArrayBuffer to Buffer
      const fileBuffer = Buffer.from(await uploadedFile.arrayBuffer());

      // Save the buffer as a file
      await fs.writeFile(tempFilePath, fileBuffer);

      const pdfData = await pdf(tempFilePath)
      console.log(pdfData.text)

      // Parse the pdf using pdf2json. See pdf2json docs for more info.

      // The reason I am bypassing type checks is because
      // the default type definitions for pdf2json in the npm install
      // do not allow for any constructor arguments.
      // You can either modify the type definitions or bypass the type checks.
      // I chose to bypass the type checks.
      const pdfParser = new (PDFParser as any)(null, 1);

      // See pdf2json docs for more info on how the below works.
      pdfParser.on('pdfParser_dataError', (errData: any) =>
        console.log(errData.parserError)
      );

      pdfParser.on('pdfParser_dataReady', () => {
        console.log((pdfParser as any).getRawTextContent());
        parsedText = (pdfParser as any).getRawTextContent();
      });

      pdfParser.loadPDF(tempFilePath);
    } else {
      console.log('Uploaded file is not in the expected format.');
    }
  } else {
    console.log('No files found.');
  }

  const response = new NextResponse(parsedText);
  response.headers.set('FileName', fileName);
  return response;
}

function extractDiplomaData(text: string) {
  // Use the same logic from your frontend extractor
  const fallback = {
    certificateType: {
      french: "CERTIFICAT DE PROFESSEUR DE L'ENSEIGNEMENT SECONDAIRE, 2ème GRADE",
      english: "SECONDARY AND HIGH SCHOOL TEACHER'S CERTIFICATE, 2nd LEVEL",
    },
    institution: {
      name: {
        french: "UNIVERSITÉ DE BERTOUA",
        english: "THE UNIVERSITY OF BERTOUA",
      },
      school: {
        french: "ÉCOLE NORMALE SUPÉRIEURE DE BERTOUA",
        english: "HIGHER TEACHER TRAINING COLLEGE OF BERTOUA",
      },
      ministry: {
        french: "MINISTÈRE DE L'ENSEIGNEMENT SUPÉRIEUR",
        english: "THE MINISTRY OF HIGHER EDUCATION",
      },
    },
  };

  const diplomaInfo: any = {};

  diplomaInfo.diplomaNumber = text.match(/N° (DIP-\d+-[A-Z0-9]+-\d+)/)?.[1] || '';
  diplomaInfo.name = text.match(/Délivré à Mr\.\/Mme\. : (.+)/)?.[1]?.trim() || '';
  diplomaInfo.birthDate = text.match(/Né\(e\) le\s*:\s*(\d{2}\/\d{2}\/\d{4})/)?.[1] || '';
  diplomaInfo.birthPlace = text.match(/\u00e0\s+([A-Z]+)/)?.[1] || '';
  diplomaInfo.gender = text.match(/Sexe\s*\/\s*Gender\s*:\s*(\w)/)?.[1] || '';
  diplomaInfo.registrationNumber = text.match(/N\u00b0 Matricule\s*:\s*([\w-]+)/)?.[1] || '';
  diplomaInfo.specialization = text.match(/Domaine\s*:\s*(.+?)\s{2,}/i)?.[1]?.trim() || '';
  diplomaInfo.series = text.match(/Fili\u00e8re\s*:\s*(.+?)\s{2,}/i)?.[1]?.trim() || '';
  diplomaInfo.grade = text.match(/Mention\s*:\s*(.+?)\s{2,}/i)?.[1]?.trim() || '';
  diplomaInfo.issueDate = text.match(/le\s*:\s*(\d{4}-\d{2}-\d{2})/)?.[1] || '';
  diplomaInfo.sessionDate = text.match(/session de :[\s\S]*?((?:JANVIER|FÉVRIER|MARS|AVRIL|MAI|JUIN|JUILLET|AOÛT|SEPTEMBRE|OCTOBRE|NOVEMBRE|DÉCEMBRE) \d{4})/i)?.[1] || '';

  const certMatch = text.match(/(CERTIFICAT DE[^]*?GRADE)[^]*?(SECONDARY[^]*?LEVEL)/i);
  diplomaInfo.certificateType = certMatch
    ? { french: certMatch[1].trim(), english: certMatch[2].trim() }
    : fallback.certificateType;

  const universityMatch = text.match(/(UNIVERSITÉ DE \w+)[^]*?(THE UNIVERSITY OF \w+)/i);
  const schoolMatch = text.match(/(ÉCOLE NORMALE SUPÉRIEURE DE \w+)[^]*?(HIGHER TEACHER TRAINING COLLEGE OF \w+)/i);
  const ministryMatch = text.match(/(MINISTÈRE DE L'ENSEIGNEMENT SUPÉRIEUR)[^]*?(THE MINISTRY OF HIGHER EDUCATION)/i);

  diplomaInfo.institution = {
    name: {
      french: universityMatch?.[1].trim() || fallback.institution.name.french,
      english: universityMatch?.[2].trim() || fallback.institution.name.english,
    },
    school: {
      french: schoolMatch?.[1].trim() || fallback.institution.school.french,
      english: schoolMatch?.[2].trim() || fallback.institution.school.english,
    },
    ministry: {
      french: ministryMatch?.[1].trim() || fallback.institution.ministry.french,
      english: ministryMatch?.[2].trim() || fallback.institution.ministry.english,
    },
  };

  return diplomaInfo;
}

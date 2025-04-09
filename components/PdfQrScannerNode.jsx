// components/PdfQrScannerNode.jsx
'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

const PdfToText = dynamic(() => import('react-pdftotext'), { ssr: false });
//import pdfToText from 'react-pdftotext';

function extractDiplomaData(text) {
  const diplomaInfo = {};
  
  // Extract diploma number
  const diplomaMatch = text.match(/N° (DIP-\d+-[A-Z0-9]+-\d+)/);
  diplomaInfo.diplomaNumber = diplomaMatch ? diplomaMatch[1] : null;
  
  // Extract name - specifically look at the section
  const sections = text.split(/(?=Délivré à Mr\.\/Mme\. :)/);
  if (sections.length > 1) {
    const nameSection = sections[1].split('Issued to Mr./Mrs.')[0];
    const nameMatch = nameSection.match(/Délivré à Mr\.\/Mme\. : (.+)/);
    diplomaInfo.name = nameMatch ? nameMatch[1].trim() : null;
  } else {
    diplomaInfo.name = null;
  }
  
  // Extract birth date
  const birthDateMatch = text.match(/Né\(e\) le : (\d{2}\/\d{2}\/\d{4})/);
  diplomaInfo.birthDate = text.match(/N\u00e9\(e\) le\s*:\s*(\d{2}\/\d{2}\/\d{4})/)?.[1] || '';
  
  // Extract birth place
  const birthPlaceMatch = text.match(/à ([\wÀ-ÿ]+) at/);
  diplomaInfo.birthPlace = text.match(/\u00e0\s+([A-Z]+)/)?.[1] || '';
  
  // Extract gender
  const genderMatch = text.match(/Sexe \/ Gender : ([MF])/);
  diplomaInfo.gender = text.match(/Sexe\s*\/\s*Gender\s*:\s*(\w)/)?.[1]||'';
  
  // Extract registration number
  const regNumberMatch = text.match(/N° Matricule : ([A-Z0-9]+-\d+)/);
  diplomaInfo.registrationNumber = text.match(/N\u00b0 Matricule\s*:\s*(\w+)/)?.[1] || '';
  
  // Extract specialization
  const specializationMatch = text.match(/Domaine : ([A-Za-zÀ-ú]+) Specialization/);
  diplomaInfo.specialization = text.match(/Domaine\s*:\s*(.+?)\s{2,}/i)?.[1]?.trim() || '';
  
  // Extract series
  const seriesMatch = text.match(/Filière : ([A-Za-zÀ-ú]+) Series/);
  diplomaInfo.series = text.match(/Fili\u00e8re\s*:\s*(.+?)\s{2,}/i)?.[1]?.trim() || '';
  
  // Extract grade
  const gradeMatch = text.match(/Mention : ([A-Za-zÀ-ú]+) Grade/);
  diplomaInfo.grade = text.match(/Mention\s*:\s*(.+?)\s{2,}/i)?.[1]?.trim() || '';
  
  // Extract issue date
  const issueDateMatch = text.match(/Fait à Bertoua, le : (\d{4}-\d{2}-\d{2})/);
  diplomaInfo.issueDate = text.match(/le\s*:\s*(\d{4}-\d{2}-\d{2})/)?.[1] || '';
  
  // Extract session date
  const sessionDateMatch = text.match(/session de :[\s\S]*?((?:JANVIER|FÉVRIER|MARS|AVRIL|MAI|JUIN|JUILLET|AOÛT|SEPTEMBRE|OCTOBRE|NOVEMBRE|DÉCEMBRE) \d{4})/i);
  diplomaInfo.sessionDate = sessionDateMatch ? sessionDateMatch[1] : null;
  
  // Extract certificate types more precisely
  // Look for two consecutive certificate types (one in French, one in English)
  const certificateRegex = /(CERTIFICAT DE[^]*?GRADE)[^]*?(SECONDARY[^]*?LEVEL)/i;
  const certMatch = text.match(certificateRegex);
  
  if (certMatch) {
    diplomaInfo.certificateType = {
      french: certMatch[1].trim(),
      english: certMatch[2].trim()
    };
  } else {
    // Fallback method if the main pattern doesn't match
    diplomaInfo.certificateType = {
      french: "CERTIFICAT DE PROFESSEUR DE L'ENSEIGNEMENT SECONDAIRE, 2ème GRADE",
      english: "SECONDARY AND HIGH SCHOOL TEACHER'S CERTIFICATE, 2nd LEVEL"
    };
  }
  
  // Extract institution names more precisely
  
  // University name
  const universityRegex = /(UNIVERSITÉ DE \w+)[^]*?(THE UNIVERSITY OF \w+)/i;
  const universityMatch = text.match(universityRegex);
  
  diplomaInfo.institution = {
    name: {
      french: universityMatch ? universityMatch[1].trim() : "UNIVERSITÉ DE BERTOUA",
      english: universityMatch ? universityMatch[2].trim() : "THE UNIVERSITY OF BERTOUA"
    }
  };
  
  // School name
  const schoolRegex = /(ÉCOLE NORMALE SUPÉRIEURE DE \w+)[^]*?(HIGHER TEACHER TRAINING COLLEGE OF \w+)/i;
  const schoolMatch = text.match(schoolRegex);
  
  diplomaInfo.institution.school = {
    french: schoolMatch ? schoolMatch[1].trim() : "ÉCOLE NORMALE SUPÉRIEURE DE BERTOUA",
    english: schoolMatch ? schoolMatch[2].trim() : "HIGHER TEACHER TRAINING COLLEGE OF BERTOUA"
  };
  
  // Ministry name
  const ministryRegex = /(MINISTÈRE DE L'ENSEIGNEMENT SUPÉRIEUR)[^]*?(THE MINISTRY OF HIGHER EDUCATION)/i;
  const ministryMatch = text.match(ministryRegex);
  
  diplomaInfo.institution.ministry = {
    french: ministryMatch ? ministryMatch[1].trim() : "MINISTÈRE DE L'ENSEIGNEMENT SUPÉRIEUR",
    english: ministryMatch ? ministryMatch[2].trim() : "THE MINISTRY OF HIGHER EDUCATION"
  };
  
  return diplomaInfo;
}
export default function PdfQrScannerNode() {
  const [file, setFile] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [singleCode, setSingleCode] = useState(true);
  const [qrCode, setQrCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
const [diplomaData, setDiplomaData] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
    } else if (selectedFile) {
      setError('Please select a PDF file');
      setFile(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a PDF file first');
      return;
    }

    setLoading(true);
    setError(null);
    setQrCode("");
    
      	PdfToText(file)
        .then((text) => {
            console.log(text)
            const data = extractDiplomaData(text);
            console.log('[Parsed Data]', data);
            setDiplomaData(data);
        })
        .catch(error => console.error("Text extraction failed", error));

    try {
      // Create FormData to send the file
      const formData = new FormData();
      formData.append('pdf', file);
      formData.append('page', pageNumber.toString());
      formData.append('singleCode', singleCode.toString());
      
      // Send the request to our API route
      const response = await fetch('/api/qr-scanner', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to process PDF');
      }
      
      if (result.success) {
        console.log(result)
        setQrCode(result.codes[0]);
        if ((result.codes || []).length === 0) {
          setError('No QR codes found on this page');
        }
      } else {
        throw new Error(result.error || 'Failed to extract QR codes');
      }

      
      
    } catch (err) {
      console.error('Error extracting QR codes:', err);
      setError(`Error extracting QR codes: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">PDF QR Code Scanner (Node.js)</h1>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">
            Upload PDF File
          </label>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 mb-2">
              Page Number
            </label>
            <input
              type="number"
              min="1"
              value={pageNumber}
              onChange={(e) => setPageNumber(Math.max(1, parseInt(e.target.value, 10)))}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2">
              Extraction Mode
            </label>
            <select
              value={singleCode.toString()}
              onChange={(e) => setSingleCode(e.target.value === 'true')}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="true">Single QR Code</option>
              <option value="false">Multiple QR Codes</option>
            </select>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={!file || loading}
          className={`w-full py-2 px-4 rounded ${
            !file || loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {loading ? 'Processing...' : 'Extract QR Codes'}
        </button>
      </form>
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {qrCode.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-3">Results</h2>
          <ul className="space-y-4">
              <li className="p-4 border border-gray-200 rounded bg-gray-50">
                <div className="font-medium">QR Code </div>
                <div className="mt-1">
                  <span className="font-medium">Content:</span> {qrCode}
                </div>
              </li>
          </ul>
        </div>
      )}
      {diplomaData && (
        <div className="bg-gray-100 p-4 rounded-xl shadow">
          <h2 className="text-xl font-bold mb-2">Extracted Diploma Info</h2>
          <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(diplomaData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
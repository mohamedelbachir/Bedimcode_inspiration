// components/PdfQrScannerNode.jsx
'use client';

import { useState } from 'react';

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
     try {
    const formData = new FormData();
    formData.append('pdf', file);

    const response = await fetch('/api/pdftotextscanned', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to extract text from PDF');
    }

    console.log('[Backend Diploma Info]', result.data);
    setDiplomaData(result.data);
  } catch (err) {
    console.error('Error extracting text:', err);
    setError(err.message);
  }
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
      
      {qrCode&&qrCode.length > 0 && (
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
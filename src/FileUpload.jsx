import React, { useState } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";

function FileUpload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
        setSelectedFile(file);
        const fileUrl = URL.createObjectURL(file);
        setPreviewUrl(fileUrl);
        setTransactions([]); // Reset transactions on new file
        setError(null);
      } else {
        alert('Please upload a valid PDF or Image file.');
      }
    }
  };

  const handleApiKeyChange = (event) => {
    setApiKey(event.target.value);
  };

  const fileToGenerativePart = async (file) => {
    const base64EncodedDataPromise = new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(file);
    });
    return {
      inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
  };

  const processFile = async () => {
    if (!apiKey) {
      alert("Please enter your Google Gemini API Key.");
      return;
    }
    if (!selectedFile) {
        alert("Please select a file first.");
        return;
    }

    setLoading(true);
    setError(null);

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const imagePart = await fileToGenerativePart(selectedFile);
      const prompt = `Analyze this image/document. It is a bank statement (likely Amex).
      Extract all transaction details into a JSON array.
      Each object in the array should have 'date', 'description', and 'amount' fields.
      Ensure the amount is a number.
      If the statement has multiple sections, capture the main transactions.
      Return ONLY the raw JSON string, no markdown code blocks.`;

      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();

      // Clean up markdown if present (Gemini sometimes wraps JSON in markdown)
      const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();

      try {
          const data = JSON.parse(jsonString);
          if (Array.isArray(data)) {
            setTransactions(data);
          } else if (data.transactions && Array.isArray(data.transactions)) {
             setTransactions(data.transactions);
          } else {
             throw new Error("Parsed data is not an array or does not contain transactions");
          }
      } catch (parseError) {
          console.error("JSON Parse Error:", parseError, "Raw Text:", text);
          setError("Failed to parse response from Gemini. The AI might not have returned valid JSON.");
      }

    } catch (err) {
      console.error("Gemini API Error:", err);
      setError(`Error processing file: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2>Bank Statement Upload & Process</h2>

      <div style={styles.inputGroup}>
        <label style={styles.label}>
            Gemini API Key:
            <input
                type="password"
                value={apiKey}
                onChange={handleApiKeyChange}
                placeholder="Enter your API Key"
                style={styles.textInput}
            />
        </label>
        <p style={styles.helperText}>
            You can get an API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer">Google AI Studio</a>.
        </p>
      </div>

      <div style={styles.uploadSection}>
        <input
          type="file"
          accept="application/pdf,image/*"
          onChange={handleFileChange}
          style={styles.fileInput}
        />
      </div>

      {selectedFile && (
        <div style={styles.previewSection}>
          <div style={styles.fileInfo}>
            <p><strong>File Name:</strong> {selectedFile.name}</p>
            <p><strong>Size:</strong> {(selectedFile.size / 1024).toFixed(2)} KB</p>
          </div>

          <button onClick={processFile} disabled={loading} style={styles.button}>
            {loading ? 'Processing...' : 'Process with Gemini'}
          </button>

          {error && <div style={styles.error}>{error}</div>}

          {transactions.length > 0 && (
            <div style={styles.resultsSection}>
                <h3>Transactions</h3>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Date</th>
                            <th style={styles.th}>Description</th>
                            <th style={styles.th}>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map((tx, index) => (
                            <tr key={index}>
                                <td style={styles.td}>{tx.date}</td>
                                <td style={styles.td}>{tx.description}</td>
                                <td style={styles.td}>{tx.amount}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          )}

          <div style={styles.previewContainer}>
            {selectedFile.type === 'application/pdf' ? (
                <object
                data={previewUrl}
                type="application/pdf"
                width="100%"
                height="600px"
                >
                <p>Your browser does not support PDFs. <a href={previewUrl}>Download the PDF</a>.</p>
                </object>
            ) : (
                <img src={previewUrl} alt="Preview" style={{maxWidth: '100%', maxHeight: '600px'}} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    textAlign: 'center',
    fontFamily: 'Arial, sans-serif'
  },
  inputGroup: {
      marginBottom: '20px',
      textAlign: 'left'
  },
  label: {
      display: 'block',
      fontWeight: 'bold',
      marginBottom: '5px'
  },
  textInput: {
      width: '100%',
      padding: '8px',
      marginTop: '5px',
      boxSizing: 'border-box'
  },
  helperText: {
      fontSize: '0.85em',
      color: '#666',
      marginTop: '5px'
  },
  uploadSection: {
    marginBottom: '20px',
    padding: '20px',
    border: '2px dashed #ccc',
    borderRadius: '10px'
  },
  fileInput: {
    padding: '10px'
  },
  previewSection: {
    marginTop: '20px',
    textAlign: 'left'
  },
  fileInfo: {
    marginBottom: '15px',
    padding: '10px',
    backgroundColor: '#f9f9f9',
    borderRadius: '5px'
  },
  button: {
      padding: '10px 20px',
      backgroundColor: '#007bff',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      fontSize: '16px',
      marginBottom: '20px'
  },
  error: {
      color: 'red',
      marginBottom: '15px',
      fontWeight: 'bold'
  },
  resultsSection: {
      marginBottom: '20px'
  },
  table: {
      width: '100%',
      borderCollapse: 'collapse',
      marginTop: '10px'
  },
  th: {
      border: '1px solid #ddd',
      padding: '8px',
      backgroundColor: '#f2f2f2',
      textAlign: 'left'
  },
  td: {
      border: '1px solid #ddd',
      padding: '8px'
  },
  previewContainer: {
    border: '1px solid #ddd',
    minHeight: '200px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden'
  }
};

export default FileUpload;

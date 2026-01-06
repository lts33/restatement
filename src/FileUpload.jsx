import React, { useState } from 'react';

function FileUpload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      const fileUrl = URL.createObjectURL(file);
      setPreviewUrl(fileUrl);
    } else {
      alert('Please upload a valid PDF file.');
    }
  };

  return (
    <div style={styles.container}>
      <h2>Bank Statement Upload</h2>

      <div style={styles.uploadSection}>
        <input
          type="file"
          accept="application/pdf"
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

          <div style={styles.pdfContainer}>
            <object
              data={previewUrl}
              type="application/pdf"
              width="100%"
              height="600px"
            >
              <p>Your browser does not support PDFs. <a href={previewUrl}>Download the PDF</a>.</p>
            </object>
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
  pdfContainer: {
    border: '1px solid #ddd',
    height: '600px'
  }
};

export default FileUpload;

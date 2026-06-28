import { useCallback, useRef, useState, useEffect } from 'react';
import { useInference } from '../hooks/useInference';
import useAppStore from '../store/useAppStore';

const ACCEPT = '.tif,.tiff,.png,.jpg,.jpeg';

export default function UploadZone() {
  const { run } = useInference();
  const { images, isProcessing, uploadProgress, error } = useAppStore();
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // Sync with reset button in main control bar
  useEffect(() => {
    if (!images.raw) {
      setSelectedFile(null);
    }
  }, [images.raw]);

  const handleFile = useCallback((file) => {
    if (!file) return;
    setSelectedFile(file);
  }, []);

  const handleProcess = () => {
    if (selectedFile) {
      run(selectedFile);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);
  const onInputChange = (e) => handleFile(e.target.files?.[0]);

  // Display processing state
  if (selectedFile && isProcessing) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '420px', padding: '24px' }}>
        <div
          style={{
            width: '100%', maxWidth: '520px',
            border: '2px solid #1E3050',
            borderRadius: '12px',
            background: 'rgba(13,21,37,0.8)',
            padding: '48px 24px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px',
          }}
        >
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(249,115,22,0.1)', border: '1.5px solid rgba(249,115,22,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="1.5">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#E2E8F0', fontWeight: 600, fontSize: '16px', marginBottom: '6px', wordBreak: 'break-all' }}>
              Processing: {selectedFile.name}
            </p>
            <p style={{ color: '#64748B', fontSize: '13px' }}>
              Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
          
          <div style={{ width: '100%', marginTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748B', marginBottom: '6px' }}>
              <span>UPLOADING / INFERENCE RUNNING</span>
              <span>{uploadProgress}%</span>
            </div>
            <div style={{ height: '4px', background: '#1E3050', borderRadius: '2px' }}>
              <div style={{ height: '100%', borderRadius: '2px', width: `${uploadProgress}%`, background: 'linear-gradient(90deg, #F97316, #06B6D4)', transition: 'width 0.3s ease' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Display file selected state (Before processing starts)
  if (selectedFile && !isProcessing) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '420px', padding: '24px' }}>
        <div
          style={{
            width: '100%', maxWidth: '520px',
            border: '2px solid #1E3050',
            borderRadius: '12px',
            background: 'rgba(13,21,37,0.8)',
            padding: '48px 24px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px',
          }}
        >
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(6,182,212,0.1)', border: '1.5px solid rgba(6,182,212,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#E2E8F0', fontWeight: 600, fontSize: '16px', marginBottom: '6px', wordBreak: 'break-all' }}>
              {selectedFile.name}
            </p>
            <p style={{ color: '#64748B', fontSize: '13px' }}>
              Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', width: '100%', justifyContent: 'center' }}>
            <button 
              onClick={handleCancel}
              style={{ 
                padding: '10px 24px', 
                background: 'transparent', 
                color: '#94A3B8', 
                border: '1px solid #334155', 
                borderRadius: '6px', 
                fontWeight: 600, 
                fontSize: '13px', 
                cursor: 'pointer' 
              }}
            >
              CANCEL
            </button>
            <button 
              onClick={handleProcess}
              style={{ 
                padding: '10px 28px', 
                background: '#F97316', 
                color: '#000', 
                border: 'none', 
                borderRadius: '6px', 
                fontWeight: 700, 
                fontSize: '13px', 
                cursor: 'pointer' 
              }}
            >
              RUN PROCESSING
            </button>
          </div>
        </div>
        {error && <div style={{ width: '100%', maxWidth: '520px', marginTop: '12px', padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', color: '#FCA5A5', fontSize: '12px' }}>⚠ {error}</div>}
      </div>
    );
  }

  // Display empty dropzone (Default)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '420px', padding: '24px' }}>
      <div
        onClick={() => !isProcessing && inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        style={{
          width: '100%', maxWidth: '520px',
          border: `2px dashed ${dragging ? '#F97316' : '#1E3050'}`,
          borderRadius: '12px',
          background: dragging ? 'rgba(249,115,22,0.06)' : 'rgba(13,21,37,0.8)',
          cursor: isProcessing ? 'not-allowed' : 'pointer',
          padding: '48px 24px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
        }}
      >
        <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(249,115,22,0.12)', border: '1.5px solid rgba(249,115,22,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="1.5">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
          </svg>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#E2E8F0', fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>{dragging ? 'Release to deploy frame' : 'Upload IR frame'}</p>
          <p style={{ color: '#64748B', fontSize: '13px' }}>RISAT / Cartosat raw · TIF · PNG · JPEG</p>
        </div>
        <input ref={inputRef} type="file" accept={ACCEPT} style={{ display: 'none' }} onChange={onInputChange} disabled={isProcessing} />
        <button onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }} disabled={isProcessing} style={{ padding: '10px 28px', background: isProcessing ? '#334155' : '#F97316', color: isProcessing ? '#64748B' : '#000', border: 'none', borderRadius: '6px', fontWeight: 700, fontSize: '13px', cursor: isProcessing ? 'not-allowed' : 'pointer' }}>
          {isProcessing ? 'PROCESSING…' : 'SELECT FILE'}
        </button>
      </div>
      {error && <div style={{ width: '100%', maxWidth: '520px', marginTop: '12px', padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', color: '#FCA5A5', fontSize: '12px' }}>⚠ {error}</div>}
    </div>
  );
}

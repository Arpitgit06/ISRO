import { useCallback, useRef, useState } from 'react';
import { useInference } from '../hooks/useInference';
import useAppStore from '../store/useAppStore';

const ACCEPT = '.tif,.tiff,.png,.jpg,.jpeg';

export default function UploadZone() {
  const { run } = useInference();
  const { isProcessing, uploadProgress, error } = useAppStore();
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback((file) => {
    if (!file) return;
    run(file);
  }, [run]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);
  const onInputChange = (e) => handleFile(e.target.files?.[0]);

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
      {isProcessing && (
        <div style={{ width: '100%', maxWidth: '520px', marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748B', marginBottom: '6px' }}>
            <span>UPLOADING / PROCESSING</span>
            <span>{uploadProgress}%</span>
          </div>
          <div style={{ height: '4px', background: '#1E3050', borderRadius: '2px' }}>
            <div style={{ height: '100%', borderRadius: '2px', width: `${uploadProgress}%`, background: 'linear-gradient(90deg, #F97316, #06B6D4)', transition: 'width 0.3s ease' }} />
          </div>
        </div>
      )}
      {error && <div style={{ width: '100%', maxWidth: '520px', marginTop: '12px', padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', color: '#FCA5A5', fontSize: '12px' }}>⚠ {error}</div>}
    </div>
  );
}

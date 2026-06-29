import { useCallback, useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useInference } from '../hooks/useInference';
import useAppStore from '../store/useAppStore';
import PipelineWireframe from './PipelineWireframe';

const ACCEPT = '.tif,.tiff,.png,.jpg,.jpeg';

export default function UploadZone() {
  const { run } = useInference();
  const { images, isProcessing, uploadProgress, error } = useAppStore();
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Sync with reset button in main control bar
  useEffect(() => {
    if (!images.raw) {
      setSelectedFile(null);
    }
  }, [images.raw]);

  // Handle object URL lifecycle for file preview
  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [selectedFile]);

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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '480px', padding: '24px', background: '#000000' }}>
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
          style={{
            width: '100%', maxWidth: '880px',
            border: '1px solid rgba(0, 255, 102, 0.25)',
            borderRadius: '2px',
            background: 'rgba(0, 0, 0, 0.9)',
            boxShadow: '0 0 30px rgba(0, 255, 102, 0.05)',
            padding: '28px',
            display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '32px',
            alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Share Tech Mono', monospace"
          }}
        >
          {/* Left Column: Image scan state & progress */}
          <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            {previewUrl ? (
              <div style={{ position: 'relative', width: '100%', maxWidth: '280px', height: '170px', border: '1px solid rgba(0, 255, 102, 0.4)', borderRadius: '2px', overflow: 'hidden', boxShadow: '0 0 15px rgba(0, 255, 102, 0.1)' }}>
                <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.65 }} />
                {/* Scan laser effect (Cyber green) */}
                <motion.div
                  animate={{ top: ['0%', '100%'] }}
                  transition={{ repeat: Infinity, repeatType: 'reverse', duration: 1.6, ease: 'easeInOut' }}
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: 'linear-gradient(to right, transparent, #00FF66, transparent)',
                    boxShadow: '0 0 8px #00FF66',
                  }}
                />
                {/* Grid overlay */}
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(0, 255, 102, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 102, 0.05) 1px, transparent 1px)', backgroundSize: '15px 15px', pointerEvents: 'none' }} />
              </div>
            ) : (
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(0, 255, 102, 0.06)', border: '1px solid rgba(0, 255, 102, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00FF66" strokeWidth="1.5">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              </div>
            )}

            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#E2E8F0', fontWeight: 600, fontSize: '15px', marginBottom: '4px', wordBreak: 'break-all', fontFamily: "'Orbitron', sans-serif" }}>
                PROCESSING: {selectedFile.name.toUpperCase()}
              </p>
              <p style={{ color: '#64748B', fontSize: '12px' }}>
                SIZE: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>

            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 700, color: '#64748B', marginBottom: '6px', letterSpacing: '0.05em' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00FF66', display: 'inline-block', animation: 'pulse 1.2s infinite' }} />
                  UPLOADING / INFERENCE RUNNING
                </span>
                <span style={{ color: '#00FF66' }}>{uploadProgress}%</span>
              </div>
              <div style={{ height: '4px', background: '#111111', border: '1px solid rgba(0, 255, 102, 0.15)', borderRadius: '2px', overflow: 'hidden' }}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.1 }}
                  style={{ height: '100%', background: 'linear-gradient(90deg, #00FF66, #00E65C)', boxShadow: '0 0 6px rgba(0, 255, 102, 0.4)' }} 
                />
              </div>
            </div>
          </div>

          {/* Right Column: Live Pipeline Node Graph */}
          <div style={{ flex: '1.2 1 340px', borderLeft: '1px solid rgba(0, 255, 102, 0.15)', paddingLeft: '24px', display: 'flex', flexDirection: 'column' }}>
            <PipelineWireframe uploadProgress={uploadProgress} isProcessing={isProcessing} />
          </div>
        </motion.div>
      </div>
    );
  }

  // Display file selected state (Before processing starts)
  if (selectedFile && !isProcessing) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '420px', padding: '24px', background: '#000000' }}>
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
          style={{
            width: '100%', maxWidth: '520px',
            border: '1px solid rgba(0, 255, 102, 0.25)',
            borderRadius: '2px',
            background: 'rgba(0,0,0,0.85)',
            padding: '40px 24px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px',
            boxShadow: '0 0 25px rgba(0, 0, 0, 0.5)',
            fontFamily: "'Share Tech Mono', monospace"
          }}
        >
          {previewUrl ? (
            <div style={{ position: 'relative', width: '240px', height: '150px', border: '1px solid rgba(0, 255, 102, 0.4)', borderRadius: '2px', overflow: 'hidden', boxShadow: '0 0 15px rgba(0, 255, 102, 0.1)' }}>
              <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0, 255, 102, 0.05)', pointerEvents: 'none' }} />
            </div>
          ) : (
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(0, 255, 102, 0.05)', border: '1px solid rgba(0, 255, 102, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00FF66" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
          )}
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#E2E8F0', fontWeight: 600, fontSize: '15px', marginBottom: '4px', wordBreak: 'break-all', fontFamily: "'Orbitron', sans-serif" }}>
              {selectedFile.name.toUpperCase()}
            </p>
            <p style={{ color: '#64748B', fontSize: '12px' }}>
              SIZE: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', width: '100%', justifyContent: 'center' }}>
            <motion.button 
              whileHover={{ scale: 1.04, borderColor: '#00FF66', color: '#FFFFFF' }}
              whileTap={{ scale: 0.96 }}
              onClick={handleCancel}
              style={{ 
                padding: '10px 24px', 
                background: 'transparent', 
                color: '#94A3B8', 
                border: '1px solid rgba(0, 255, 102, 0.3)', 
                borderRadius: '2px', 
                fontWeight: 600, 
                fontSize: '12px', 
                cursor: 'pointer',
                transition: 'border-color 0.2s, color 0.2s',
                fontFamily: "'Share Tech Mono', monospace"
              }}
            >
              CANCEL
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.04, boxShadow: '0 0 15px rgba(0, 255, 102, 0.4)', background: '#00E65C' }}
              whileTap={{ scale: 0.96 }}
              onClick={handleProcess}
              style={{ 
                padding: '10px 28px', 
                background: '#00FF66', 
                color: '#000000', 
                border: 'none', 
                borderRadius: '2px', 
                fontWeight: 700, 
                fontSize: '12px', 
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                fontFamily: "'Share Tech Mono', monospace"
              }}
            >
              RUN PROCESSING
            </motion.button>
          </div>
        </motion.div>
        {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ width: '100%', maxWidth: '520px', marginTop: '12px', padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '2px', color: '#FCA5A5', fontSize: '12px' }}>⚠ {error}</motion.div>}
      </div>
    );
  }

  // Display empty dropzone (Default)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '420px', padding: '24px', background: '#000000' }}>
      <motion.div
        onClick={() => !isProcessing && inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        whileHover={isProcessing ? {} : { scale: 1.02, borderColor: '#00FF66', boxShadow: '0 0 25px rgba(0, 255, 102, 0.12)' }}
        style={{
          width: '100%', maxWidth: '520px',
          border: `2px dashed ${dragging ? '#00FF66' : 'rgba(0, 255, 102, 0.25)'}`,
          borderRadius: '2px',
          background: dragging ? 'rgba(0, 255, 102, 0.05)' : 'rgba(0,0,0,0.85)',
          cursor: isProcessing ? 'not-allowed' : 'pointer',
          padding: '48px 24px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px',
          transition: 'border-color 0.25s, background-color 0.25s, box-shadow 0.25s',
          fontFamily: "'Share Tech Mono', monospace"
        }}
      >
        <motion.div 
          animate={dragging ? { scale: [1, 1.12, 1], rotate: [0, 4, -4, 0] } : {}}
          transition={{ repeat: dragging ? Infinity : 0, duration: 1.2 }}
          style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(0, 255, 102, 0.05)', border: '1px solid rgba(0, 255, 102, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00FF66" strokeWidth="1.5">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
          </svg>
        </motion.div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#E2E8F0', fontWeight: 600, fontSize: '15px', marginBottom: '4px', fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.05em' }}>
            {dragging ? 'RELEASE TO DEPLOY FRAME' : 'UPLOAD IR FRAME'}
          </p>
          <p style={{ color: '#64748B', fontSize: '13px' }}>RISAT / CARTOSAT RAW · TIF · PNG · JPEG</p>
        </div>
        <input ref={inputRef} type="file" accept={ACCEPT} style={{ display: 'none' }} onChange={onInputChange} disabled={isProcessing} />
        <motion.button 
          whileHover={isProcessing ? {} : { scale: 1.05, boxShadow: '0 0 15px rgba(0, 255, 102, 0.4)', background: '#00E65C' }}
          whileTap={isProcessing ? {} : { scale: 0.95 }}
          onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }} 
          disabled={isProcessing} 
          style={{ 
            padding: '10px 28px', 
            background: isProcessing ? '#222222' : '#00FF66', 
            color: isProcessing ? '#475569' : '#000000', 
            border: isProcessing ? '1px solid #333333' : 'none', 
            borderRadius: '2px', 
            fontWeight: 700, 
            fontSize: '13px', 
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s',
            fontFamily: "'Share Tech Mono', monospace"
          }}
        >
          {isProcessing ? 'PROCESSING…' : 'SELECT FILE'}
        </motion.button>
      </motion.div>
      {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ width: '100%', maxWidth: '520px', marginTop: '12px', padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '2px', color: '#FCA5A5', fontSize: '12px' }}>⚠ {error}</motion.div>}
    </div>
  );
}

import { useCallback, useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useInference } from '../hooks/useInference';
import useAppStore from '../store/useAppStore';
import PipelineWireframe from './PipelineWireframe';

const ACCEPT = '.tif,.tiff,.png,.jpg,.jpeg';

export default function UploadZone() {
  const { run, runBatch } = useInference();
  const { images, isProcessing, uploadProgress, error, batchItems, isBatchMode } = useAppStore();
  const inputRef = useRef(null);
  const folderInputRef = useRef(null);
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
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      if (files.length === 1) {
        handleFile(files[0]);
      } else {
        runBatch(files);
      }
    }
  }, [handleFile, runBatch]);

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);
  
  const onInputChange = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (files.length === 1) {
      handleFile(files[0]);
    } else {
      runBatch(files);
    }
  };

  const onFolderInputChange = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    runBatch(files);
  };

  // Display batch processing state
  if (isBatchMode && isProcessing) {
    const completedCount = batchItems.filter(i => i.status === 'success' || i.status === 'error').length;
    const totalCount = batchItems.length;
    const overallPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '480px', padding: '24px', background: 'transparent' }}>
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
          style={{
            width: '100%', maxWidth: '880px',
            border: '1px solid var(--accent-dim)',
            borderRadius: '2px',
            background: 'rgba(0, 0, 0, 0.25)',
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
            boxShadow: '0 0 30px var(--accent-glow)',
            padding: '28px',
            display: 'flex', flexDirection: 'column', gap: '24px',
            fontFamily: "'Share Tech Mono', monospace"
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--accent-dim)', paddingBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#FFFFFF', letterSpacing: '0.1em', fontFamily: "'Orbitron', sans-serif" }}>BATCH PROCESSING SYSTEM</h3>
              <p style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>ISRO MULTI-IMAGE INFRARED PAYLOAD</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--accent-color)' }}>{completedCount} / {totalCount} FRAMES</span>
            </div>
          </div>

          {/* Global Progress Bar */}
          <div style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: '#94A3B8', marginBottom: '6px', letterSpacing: '0.05em' }}>
              <span>OVERALL MISSION PROGRESS</span>
              <span>{overallPct}%</span>
            </div>
            <div style={{ height: '6px', background: '#111111', border: '1px solid var(--accent-dim)', borderRadius: '3px', overflow: 'hidden' }}>
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${overallPct}%` }}
                transition={{ duration: 0.3 }}
                style={{ height: '100%', background: 'linear-gradient(90deg, var(--accent-color), var(--accent-dim))', boxShadow: '0 0 10px var(--accent-color)' }} 
              />
            </div>
          </div>

          {/* Queue List */}
          <div style={{ 
            maxHeight: '260px', 
            overflowY: 'auto', 
            border: '1px solid var(--accent-dim)', 
            background: 'rgba(0,0,0,0.3)', 
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {batchItems.map((item) => (
              <div key={item.id} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                padding: '8px 12px', 
                background: item.status === 'processing' ? 'var(--accent-glow)' : 'rgba(0,0,0,0.2)',
                border: `1px solid ${item.status === 'processing' ? 'var(--accent-color)' : 'transparent'}`,
                borderRadius: '2px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                  {item.status === 'pending' && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#475569' }} />}
                  {item.status === 'processing' && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-color)', animation: 'pulse 1.2s infinite' }} />}
                  {item.status === 'success' && <span style={{ color: '#10B981', fontWeight: 'bold' }}>✓</span>}
                  {item.status === 'error' && <span style={{ color: '#EF4444', fontWeight: 'bold' }}>⚠</span>}
                  <span style={{ fontSize: '13px', color: '#E2E8F0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.filename.toUpperCase()}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>{item.size} MB</span>
                  <span style={{ 
                    fontSize: '11px', 
                    fontWeight: 'bold', 
                    color: item.status === 'success' ? '#10B981' : item.status === 'error' ? '#EF4444' : item.status === 'processing' ? 'var(--accent-color)' : '#64748B' 
                  }}>
                    {item.status.toUpperCase()} {item.status === 'processing' && `(${item.progress}%)`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // Display single image processing state
  if (selectedFile && isProcessing) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '480px', padding: '24px', background: 'transparent' }}>
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
          style={{
            width: '100%', maxWidth: '880px',
            border: '1px solid var(--accent-dim)',
            borderRadius: '2px',
            background: 'rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
            boxShadow: '0 0 30px var(--accent-glow)',
            padding: '28px',
            display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '32px',
            alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Share Tech Mono', monospace"
          }}
        >
          {/* Left Column: Image scan state & progress */}
          <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            {previewUrl ? (
              <div style={{ position: 'relative', width: '100%', maxWidth: '280px', height: '170px', border: '1px solid var(--accent-dim)', borderRadius: '2px', overflow: 'hidden', boxShadow: '0 0 15px var(--accent-glow)' }}>
                <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.65 }} />
                {/* Scan laser effect */}
                <motion.div
                  animate={{ top: ['0%', '100%'] }}
                  transition={{ repeat: Infinity, repeatType: 'reverse', duration: 1.6, ease: 'easeInOut' }}
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: 'linear-gradient(to right, transparent, var(--accent-color), transparent)',
                    boxShadow: '0 0 8px var(--accent-color)',
                  }}
                />
                {/* Grid overlay */}
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(var(--accent-glow) 1px, transparent 1px), linear-gradient(90deg, var(--accent-glow) 1px, transparent 1px)', backgroundSize: '15px 15px', pointerEvents: 'none' }} />
              </div>
            ) : (
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'var(--accent-glow)', border: '1px solid var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" strokeWidth="1.5">
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
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-color)', display: 'inline-block', animation: 'pulse 1.2s infinite' }} />
                  UPLOADING / INFERENCE RUNNING
                </span>
                <span style={{ color: 'var(--accent-color)' }}>{uploadProgress}%</span>
              </div>
              <div style={{ height: '4px', background: '#111111', border: '1px solid var(--accent-dim)', borderRadius: '2px', overflow: 'hidden' }}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.1 }}
                  style={{ height: '100%', background: 'linear-gradient(90deg, var(--accent-color), var(--accent-dim))', boxShadow: '0 0 6px var(--accent-color)' }} 
                />
              </div>
            </div>
          </div>

          {/* Right Column: Live Pipeline Node Graph */}
          <div style={{ flex: '1.2 1 340px', borderLeft: '1px solid var(--accent-dim)', paddingLeft: '24px', display: 'flex', flexDirection: 'column' }}>
            <PipelineWireframe uploadProgress={uploadProgress} isProcessing={isProcessing} />
          </div>
        </motion.div>
      </div>
    );
  }

  // Display file selected state (Before processing starts)
  if (selectedFile && !isProcessing) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '420px', padding: '24px', background: 'transparent' }}>
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
          style={{
            width: '100%', maxWidth: '520px',
            border: '1px solid var(--accent-dim)',
            borderRadius: '2px',
            background: 'rgba(0,0,0,0.2)',
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
            padding: '40px 24px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px',
            boxShadow: '0 0 25px rgba(0, 0, 0, 0.5)',
            fontFamily: "'Share Tech Mono', monospace"
          }}
        >
          {previewUrl ? (
            <div style={{ position: 'relative', width: '240px', height: '150px', border: '1px solid var(--accent-dim)', borderRadius: '2px', overflow: 'hidden', boxShadow: '0 0 15px var(--accent-glow)' }}>
              <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'var(--accent-glow)', pointerEvents: 'none' }} />
            </div>
          ) : (
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'var(--accent-glow)', border: '1px solid var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" strokeWidth="1.5">
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
              whileHover={{ scale: 1.04, borderColor: 'var(--accent-color)', color: '#FFFFFF' }}
              whileTap={{ scale: 0.96 }}
              onClick={handleCancel}
              style={{ 
                padding: '10px 24px', 
                background: 'transparent', 
                color: '#94A3B8', 
                border: '1px solid var(--accent-dim)', 
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
              whileHover={{ scale: 1.04, boxShadow: '0 0 15px rgba(242, 101, 34, 0.45)', background: '#FF7733' }}
              whileTap={{ scale: 0.96 }}
              onClick={handleProcess}
              style={{ 
                padding: '10px 28px', 
                background: '#F26522', // ISRO Saffron
                color: '#FFFFFF', 
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', minHeight: '420px', padding: '24px 24px 48px', background: 'transparent' }}>
      <motion.div
        onClick={() => !isProcessing && inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        whileHover={isProcessing ? {} : { scale: 1.02, borderColor: 'var(--accent-color)', boxShadow: '0 0 25px var(--accent-glow)' }}
        style={{
          width: '100%', maxWidth: '520px',
          border: `2px dashed ${dragging ? 'var(--accent-color)' : 'var(--accent-dim)'}`,
          borderRadius: '2px',
          background: dragging ? 'var(--accent-glow)' : 'rgba(0,0,0,0.2)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
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
          style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'var(--accent-glow)', border: '1px solid var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" strokeWidth="1.5">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
          </svg>
        </motion.div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#E2E8F0', fontWeight: 600, fontSize: '15px', marginBottom: '4px', fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.05em' }}>
            {dragging ? 'RELEASE TO DEPLOY FRAMES' : 'UPLOAD IR FRAME / FOLDER'}
          </p>
          <p style={{ color: '#64748B', fontSize: '13px' }}>RISAT / CARTOSAT RAW · TIF · PNG · JPEG</p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', zIndex: 5 }}>
          {/* Multiple files input */}
          <input ref={inputRef} type="file" accept={ACCEPT} multiple style={{ display: 'none' }} onChange={onInputChange} disabled={isProcessing} />
          <motion.button 
            whileHover={isProcessing ? {} : { scale: 1.05, boxShadow: '0 0 15px rgba(242, 101, 34, 0.45)', background: '#FF7733' }}
            whileTap={isProcessing ? {} : { scale: 0.95 }}
            onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }} 
            disabled={isProcessing} 
            style={{ 
              padding: '10px 20px', 
              background: isProcessing ? '#222222' : '#F26522', // ISRO Saffron
              color: isProcessing ? '#475569' : '#FFFFFF', 
              border: isProcessing ? '1px solid #333333' : 'none', 
              borderRadius: '2px', 
              fontWeight: 700, 
              fontSize: '12px', 
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
              fontFamily: "'Share Tech Mono', monospace"
            }}
          >
            {isProcessing ? 'PROCESSING…' : 'SELECT FILES'}
          </motion.button>

          {/* Folder input */}
          <input ref={folderInputRef} type="file" webkitdirectory="" directory="" style={{ display: 'none' }} onChange={onFolderInputChange} disabled={isProcessing} />
          <motion.button 
            whileHover={isProcessing ? {} : { scale: 1.05, borderColor: 'var(--accent-color)', color: '#FFFFFF', background: 'rgba(255,255,255,0.05)' }}
            whileTap={isProcessing ? {} : { scale: 0.95 }}
            onClick={(e) => { e.stopPropagation(); folderInputRef.current?.click(); }} 
            disabled={isProcessing} 
            style={{ 
              padding: '10px 20px', 
              background: 'transparent',
              color: '#94A3B8', 
              border: '1px solid var(--accent-dim)',
              borderRadius: '2px', 
              fontWeight: 700, 
              fontSize: '12px', 
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              fontFamily: "'Share Tech Mono', monospace"
            }}
          >
            SELECT FOLDER
          </motion.button>
        </div>
      </motion.div>
      {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ width: '100%', maxWidth: '520px', marginTop: '12px', padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '2px', color: '#FCA5A5', fontSize: '12px' }}>⚠ {error}</motion.div>}
    </div>
  );
}



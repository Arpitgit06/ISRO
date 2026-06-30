import { useCallback } from 'react';
import { processImage } from '../services/api';
import useAppStore from '../store/useAppStore';

export function useInference() {
  const {
    setImages,
    setResults,
    setIsProcessing,
    setUploadProgress,
    setError,
    reset,
    // Batch updates
    setIsBatchMode,
    setBatchItems,
    updateBatchItem,
    setActiveBatchId,
  } = useAppStore();

  const run = useCallback(async (file) => {
    reset();
    setIsProcessing(true);
    setError(null);

    try {
      const data = await processImage(file, setUploadProgress);
      if (data.status !== 'success') {
        throw new Error(data.detail || 'Pipeline returned non-success status');
      }

      setImages({
        raw: data.images.raw,
        preprocessed: data.images.preprocessed,
        enhanced: data.images.enhanced,
        colorized: data.images.colorized,
        gradcam: data.images.gradcam,
      });

      setResults({
        detections: data.detections || [],
        classCount: data.class_counts || {},
        metrics: data.metrics || null,
        latency: data.latency_ms || null,
        filename: data.filename || file.name,
      });
    } catch (err) {
      setError(err.message || 'Unknown error');
    } finally {
      setIsProcessing(false);
      setUploadProgress(0);
    }
  }, [reset, setImages, setResults, setIsProcessing, setUploadProgress, setError]);

  const runBatch = useCallback(async (filesList) => {
    reset();
    setIsBatchMode(true);
    setIsProcessing(true);
    setError(null);

    // Filter valid images (extensions check)
    const validFiles = Array.from(filesList).filter((file) => {
      const name = file.name.toLowerCase();
      return name.endsWith('.tif') || name.endsWith('.tiff') || name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg');
    });

    if (validFiles.length === 0) {
      setError('No valid image files (TIF/PNG/JPG) found in the selection.');
      setIsProcessing(false);
      return;
    }

    // Initialize batch items list
    const items = validFiles.map((file, idx) => ({
      id: `batch-${Date.now()}-${idx}`,
      filename: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2),
      status: 'pending',
      progress: 0,
      images: null,
      detections: null,
      classCount: null,
      metrics: null,
      latency: null,
      error: null,
    }));

    setBatchItems(items);

    // Process sequentially to prevent server bottleneck
    let firstSuccessfulId = null;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const fileObj = validFiles[i];

      updateBatchItem(item.id, { status: 'processing', progress: 0 });

      try {
        const data = await processImage(fileObj, (pct) => {
          updateBatchItem(item.id, { progress: pct });
          setUploadProgress(pct); // also updates the global overlay progress
        });

        if (data.status !== 'success') {
          throw new Error(data.detail || 'Pipeline returned non-success status');
        }

        const results = {
          images: {
            raw: data.images.raw,
            preprocessed: data.images.preprocessed,
            enhanced: data.images.enhanced,
            colorized: data.images.colorized,
            gradcam: data.images.gradcam,
          },
          detections: data.detections || [],
          classCount: data.class_counts || {},
          metrics: data.metrics || null,
          latency: data.latency_ms || null,
          filename: data.filename || fileObj.name,
          status: 'success',
          progress: 100,
        };

        updateBatchItem(item.id, results);

        // Select the first successfully completed item automatically
        if (!firstSuccessfulId) {
          firstSuccessfulId = item.id;
          // Apply results to main view state immediately so dashboard shows it
          setImages(results.images);
          setResults({
            detections: results.detections,
            classCount: results.classCount,
            metrics: results.metrics,
            latency: results.latency,
            filename: results.filename,
          });
          setActiveBatchId(item.id);
        }
      } catch (err) {
        console.error(`Batch processing failed for ${item.filename}:`, err);
        updateBatchItem(item.id, {
          status: 'error',
          error: err.message || 'Unknown error',
          progress: 0,
        });
      }
    }

    setIsProcessing(false);
    setUploadProgress(0);
  }, [reset, setIsBatchMode, setIsProcessing, setError, setBatchItems, updateBatchItem, setImages, setResults, setActiveBatchId, setUploadProgress]);

  return { run, runBatch };
}

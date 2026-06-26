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

  return { run };
}

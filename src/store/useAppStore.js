import { create } from 'zustand';

const useAppStore = create((set) => ({
  images: {
    raw: null,
    preprocessed: null,
    enhanced: null,
    colorized: null,
    gradcam: null,
  },
  detections: [],
  classCount: {},
  metrics: null,
  latency: null,
  filename: null,
  isProcessing: false,
  uploadProgress: 0,
  error: null,
  activeView: 'colorized',
  sliderPos: 50,
  overlays: {
    bboxes: true,
    gradcam: false,
    masks: false,
  },
  hoveredClass: null,
  setHoveredClass: (c) => set({ hoveredClass: c }),
  setImages: (imgs) => set({ images: imgs }),
  setResults: ({ detections, classCount, metrics, latency, filename }) =>
    set({ detections, classCount, metrics, latency, filename }),
  setIsProcessing: (v) => set({ isProcessing: v }),
  setUploadProgress: (v) => set({ uploadProgress: v }),
  setError: (e) => set({ error: e }),
  setActiveView: (v) => set({ activeView: v }),
  setSliderPos: (p) => set({ sliderPos: p }),
  toggleOverlay: (key) => set((s) => ({ overlays: { ...s.overlays, [key]: !s.overlays[key] } })),
  reset: () => set({
    images: { raw: null, preprocessed: null, enhanced: null, colorized: null, gradcam: null },
    detections: [],
    classCount: {},
    metrics: null,
    latency: null,
    filename: null,
    error: null,
    activeView: 'colorized',
    uploadProgress: 0,
    hoveredClass: null,
  }),
}));

export default useAppStore;

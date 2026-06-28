const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

/**
 * Fetch backend health / readiness status.
 */
export async function fetchHealth() {
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Health check unavailable:', err.message);
    return { engine_ready: false, device: 'unknown' };
  }
}

/**
 * Upload an IR image and run the full TESSERACTZ pipeline.
 *
 * @param {File}     file        - The image file to process.
 * @param {Function} onProgress  - Callback receiving upload progress (0-100).
 * @returns {Promise<object>}    - The pipeline response JSON.
 */
export async function processImage(file, onProgress) {
  const formData = new FormData();
  formData.append('file', file);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const pct = Math.round((e.loaded / e.total) * 100);
        onProgress(pct);
      }
    });

    xhr.addEventListener('load', () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(data);
        } else {
          reject(new Error(data.detail || `Server error: ${xhr.status}`));
        }
      } catch {
        reject(new Error(`Invalid response from server (status ${xhr.status})`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error — is the backend running on port 8000?'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload aborted'));
    });

    xhr.open('POST', `${API_BASE}/api/process`);
    xhr.send(formData);
  });
}

/**
 * Fetch available device list and current active device.
 */
export async function fetchDevices() {
  try {
    const res = await fetch(`${API_BASE}/api/devices`);
    if (!res.ok) throw new Error(`Fetch devices failed: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Devices fetch unavailable:', err.message);
    return { devices: [], current_device: 'cpu' };
  }
}

/**
 * Change the active execution device in the backend.
 * @param {string} deviceId - 'cpu', 'cuda', 'dml', or 'mps'
 */
export async function changeDevice(deviceId) {
  const res = await fetch(`${API_BASE}/api/device`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ device: deviceId }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || `Device change failed: ${res.status}`);
  }
  return await res.json();
}


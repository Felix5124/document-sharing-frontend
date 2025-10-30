import { pdfjs } from 'react-pdf';

let initialized = false;

try {
  if (!initialized) {
    let workerUrl;
    try {
      workerUrl = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();
    } catch (e) {
      workerUrl = '/pdf.worker.min.js';
    }
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    initialized = true;
  }
} catch (_) {
  // ignore
}

export {}; // side-effect module

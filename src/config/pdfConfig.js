import { pdfjs } from 'react-pdf';

// Sử dụng CDN để tải PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export {}; // side-effect module

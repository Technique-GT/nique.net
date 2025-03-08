import { pdfjs, Document, Page } from 'react-pdf';
import { useState } from 'react';
import Spinner from './Spinner';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface PDFViewerProps {
  isOpen: boolean;
  onClose: () => void;
  pdfFile: string;
  title: string;
}

const PDFViewer = ({ isOpen, onClose, pdfFile, title }: PDFViewerProps) => {
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
  }

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4">
          <h4 className="text-3xl font-bold text-nique-blue">{title}</h4>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-nique-blue"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-auto flex justify-center p-4">
          <Document 
            file={pdfFile} 
            onLoadSuccess={onDocumentLoadSuccess} 
            className="mx-auto"
            loading={<Spinner/>}
          >
            <Page 
              pageNumber={pageNumber} 
              className="shadow-md relative absolute top-0 left-0 z-10 pointer-events-none" 
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>
        </div>

        <div className="p-4 flex justify-between items-center bg-gray-50">
          <button 
            onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
            disabled={pageNumber <= 1}
            className="px-3 py-1 bg-nique-blue text-white rounded-md disabled:opacity-50 hover:bg-nique-blue-hover"
          >
            <h6>Previous</h6>
          </button>
          
          <h6 className="text-sm text-gray-600">
            Page {pageNumber} of {numPages || '--'}
          </h6>
          
          <button 
            onClick={() => setPageNumber(Math.min(numPages || pageNumber, pageNumber + 1))}
            disabled={pageNumber >= (numPages || 1)}
            className="px-3 py-1 bg-nique-blue text-white rounded-md disabled:opacity-50 hover:bg-nique-blue-hover"
          >
            <h6>Next</h6>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;

import { pdfjs, Document, Page } from 'react-pdf';
import { useState, useEffect, useRef } from 'react';
import Spinner from './Spinner';
import { X, ChevronRight, ChevronLeft, Download } from 'lucide-react';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface PDFViewerProps {
  isOpen: boolean;
  onClose: () => void;
  pdfFile: string;
  title: string;
}

function downloadPDF() {
  const link = document.createElement('a');
  link.href = '../assets/media-kit-2024.pdf';
  link.download = 'media-kit-2024.pdf';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

const PDFViewer = ({ isOpen, onClose, pdfFile, title }: PDFViewerProps) => {
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pageWidth, setPageWidth] = useState<number>(450);

  // dynamically resize width of pdf page
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setPageWidth(Math.min(containerRef.current.offsetWidth * 0.8, 450)); // max of 450px width
      }
    };

    updateWidth();

    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
  }

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-row justify-between items-center p-4">
            <div className="flex flex-row items-center">
              <h4 className="text-2xl font-bold text-nique-blue mr-2">{title}</h4>
              <button
                onClick={downloadPDF}
                title="Download a copy here"
                className="hover:bg-gray-100 p-2 rounded-md"
              >
                <Download className="text-nique-blue hover:text-nique-blue-hover" />
              </button>
            </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-nique-blue"
          >
            <X />
          </button>
        </div>
        
        <div 
          ref={containerRef}
          className="h-full overflow-auto flex justify-center p-4"
        >
          <Document 
            file={pdfFile} 
            onLoadSuccess={onDocumentLoadSuccess} 
            className="mx-auto"
            loading={<Spinner/>}
          >
            <Page 
              pageNumber={pageNumber} 
              width={pageWidth}
              className="shadow-md absolute top-0 left-0 z-10 pointer-events-none" 
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>
        </div>

        {/* footer */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex justify-between items-center space-x-4 bg-white/70 px-2 py-1 rounded-md z-20 pointer-events-auto">
          <button 
            onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
            disabled={pageNumber <= 1}
            className="p-1 bg-nique-blue text-white rounded-md disabled:opacity-50 hover:bg-nique-blue-hover"
          >
            <ChevronLeft />
          </button>
          
          <h6 className="text-sm text-gray-600">
            Page {pageNumber} of {numPages || '--'}
          </h6>
          
          <button 
            onClick={() => setPageNumber(Math.min(numPages || pageNumber, pageNumber + 1))}
            disabled={pageNumber >= (numPages || 1)}
            className="p-1 bg-nique-blue text-white rounded-md disabled:opacity-50 hover:bg-nique-blue-hover"
          >
            <ChevronRight />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;

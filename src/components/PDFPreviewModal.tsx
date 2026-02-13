import React, { useState, useEffect } from 'react';
import { X, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';

// Configure PDF Worker for Vite
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();

interface PDFPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    pdfUrl: string;
    title: string;
}

const PDFPreviewModal: React.FC<PDFPreviewModalProps> = ({ isOpen, onClose, pdfUrl, title }) => {
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [containerWidth, setContainerWidth] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    // Measure container width for responsive PDF
    const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!isOpen) return;

        const updateWidth = () => {
            if (containerRef) {
                setContainerWidth(containerRef.clientWidth - 32); // Subtract padding
            }
        };

        // Initial measurement
        updateWidth(); // Short delay to ensure modal is rendered
        const timer = setTimeout(updateWidth, 100);

        window.addEventListener('resize', updateWidth);
        return () => {
            window.removeEventListener('resize', updateWidth);
            clearTimeout(timer);
        };
    }, [isOpen, containerRef]);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
        setLoading(false);
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white w-full max-w-4xl h-[90vh] rounded-[32px] shadow-2xl overflow-hidden flex flex-col animate-scale-in">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                            <FileText size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none">{title}</h3>
                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Preview before sharing</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 rounded-full hover:bg-slate-100 transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* PDF Content */}
                <div className="flex-1 bg-slate-100 overflow-y-auto p-4 flex justify-center" ref={setContainerRef}>
                    {/* Fallback Download if rendering really fails or taking too long */}
                    <div className="relative shadow-lg rounded-xl overflow-hidden bg-white min-h-[400px] flex items-center justify-center w-full max-w-2xl">

                        {loading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                            </div>
                        )}

                        <Document
                            file={pdfUrl}
                            onLoadSuccess={onDocumentLoadSuccess}
                            loading={null}
                            error={
                                <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500">
                                    <FileText size={32} className="mb-4 text-slate-300" />
                                    <p className="mb-4 font-bold text-sm">Preview rendering failed</p>
                                    <a
                                        href={pdfUrl}
                                        download={`Quotation_${new Date().getTime()}.pdf`}
                                        className="px-6 py-3 bg-[#0047AB] text-white rounded-xl font-bold text-xs uppercase tracking-wider"
                                    >
                                        Download PDF
                                    </a>
                                </div>
                            }
                            className="flex flex-col gap-4"
                        >
                            <Page
                                pageNumber={pageNumber}
                                width={Math.min(containerWidth || 600, 650)}
                                renderAnnotationLayer={false}
                                renderTextLayer={false}
                                className="shadow-sm"
                            />
                        </Document>
                    </div>
                </div>

                {/* Pagination (if multipage) */}
                {numPages > 1 && (
                    <div className="bg-white border-t border-slate-100 py-2 flex justify-center items-center gap-4">
                        <button
                            disabled={pageNumber <= 1}
                            onClick={() => setPageNumber(prev => prev - 1)}
                            className="p-2 disabled:opacity-30 hover:bg-slate-50 rounded-full"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <span className="text-xs font-bold text-slate-600">Page {pageNumber} of {numPages}</span>
                        <button
                            disabled={pageNumber >= numPages}
                            onClick={() => setPageNumber(prev => prev + 1)}
                            className="p-2 disabled:opacity-30 hover:bg-slate-50 rounded-full"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                )}

                {/* Footer Actions */}
                <div className="p-4 md:p-6 bg-white border-t border-slate-100 flex flex-col md:flex-row gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        className="flex-1 h-12 rounded-2xl border-2 border-slate-100 text-slate-500 font-black text-xs uppercase tracking-[0.15em] hover:bg-slate-50 active:scale-95 transition-all"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PDFPreviewModal;

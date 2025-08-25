declare module 'pdfjs-dist' {
    export interface PDFDocumentProxy {
      numPages: number;
      getPage(pageNumber: number): Promise<PDFPageProxy>;
    }
    
    export interface PDFPageProxy {
      view: number[];
      getViewport(params: { scale: number }): PDFPageViewport;
      render(params: RenderParameters): RenderTask;
    }
    
    export interface PDFPageViewport {
      width: number;
      height: number;
    }
    
    export interface RenderParameters {
      canvasContext: CanvasRenderingContext2D;
      viewport: PDFPageViewport;
      intent?: string;
    }
    
    export interface RenderTask {
      promise: Promise<void>;
    }
    
    export interface LoadingTask {
      promise: Promise<PDFDocumentProxy>;
    }
    
    export function getDocument(params: { data: ArrayBuffer }): LoadingTask;
    
    export const GlobalWorkerOptions: {
      workerSrc: string;
    };
  }
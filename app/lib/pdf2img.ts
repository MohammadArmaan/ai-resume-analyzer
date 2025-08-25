export interface PdfConversionResult {
    imageUrl: string;
    file: File | null;
    error?: string;
  }
  
  // Dynamic import to avoid SSR issues
  let pdfjsLib: any = null;
  let isLibraryLoaded = false;
  
  async function loadPdfLibrary(): Promise<any> {
    if (pdfjsLib && isLibraryLoaded) {
      return pdfjsLib;
    }
  
    try {
      // Dynamic import to avoid SSR issues
      pdfjsLib = await import('pdfjs-dist');
      
      // Only set worker source in browser environment
      if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      }
      
      isLibraryLoaded = true;
      return pdfjsLib;
    } catch (error) {
      console.error('Failed to load PDF.js library:', error);
      throw new Error('Failed to load PDF.js library');
    }
  }
  
  export async function convertPdfToImage(file: File): Promise<PdfConversionResult> {
    try {
      console.log('Starting PDF conversion for file:', file.name);
      
      // Check if we're in browser environment
      if (typeof window === 'undefined') {
        throw new Error('PDF conversion is only available in browser environment');
      }
      
      // Validate file
      if (!file || file.type !== 'application/pdf') {
        throw new Error('Invalid file: Must be a PDF');
      }
  
      if (file.size === 0) {
        throw new Error('File is empty');
      }
  
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        throw new Error('File too large: Maximum 50MB allowed');
      }
  
      console.log('Loading PDF.js library...');
      const lib = await loadPdfLibrary();
      
      if (!lib) {
        throw new Error('Failed to load PDF.js library');
      }
  
      console.log('Reading file...');
      const arrayBuffer = await file.arrayBuffer();
      
      if (arrayBuffer.byteLength === 0) {
        throw new Error('File appears to be empty or corrupted');
      }
  
      console.log('Loading PDF document...');
      const loadingTask = lib.getDocument({ 
        data: arrayBuffer,
        verbosity: 0, // Reduce console output
        isEvalSupported: false, // Disable eval for security
      });
      
      const pdf = await loadingTask.promise;
      
      if (!pdf || pdf.numPages === 0) {
        throw new Error('PDF document is invalid or has no pages');
      }
  
      console.log('Getting first page...');
      const page = await pdf.getPage(1);
  
      // Use a reasonable scale for good quality without memory issues
      const scale = 2.0;
      const viewport = page.getViewport({ scale });
      
      console.log(`Rendering page at ${viewport.width}x${viewport.height}...`);
      
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
  
      if (!context) {
        throw new Error('Failed to get canvas 2D context');
      }
  
      canvas.width = viewport.width;
      canvas.height = viewport.height;
  
      // Configure canvas for better quality
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
  
      // Render the page
      const renderTask = page.render({ 
        canvasContext: context, 
        viewport,
        intent: 'display'
      });
      
      await renderTask.promise;
  
      console.log('Converting canvas to blob...');
      
      return new Promise((resolve) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              try {
                const originalName = file.name.replace(/\.pdf$/i, "");
                const imageFile = new File([blob], `${originalName}.png`, {
                  type: "image/png",
                });
  
                const imageUrl = URL.createObjectURL(blob);
                
                console.log('Conversion successful!');
                resolve({
                  imageUrl,
                  file: imageFile,
                });
              } catch (fileError) {
                console.error('Error creating image file:', fileError);
                resolve({
                  imageUrl: "",
                  file: null,
                  error: `Failed to create image file: ${fileError}`,
                });
              }
            } else {
              console.error('Failed to create blob from canvas');
              resolve({
                imageUrl: "",
                file: null,
                error: "Failed to create image blob from canvas",
              });
            }
          },
          "image/png",
          0.95
        );
      });
    } catch (err) {
      console.error('PDF conversion error:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      return {
        imageUrl: "",
        file: null,
        error: `Failed to convert PDF: ${errorMessage}`,
      };
    }
  }
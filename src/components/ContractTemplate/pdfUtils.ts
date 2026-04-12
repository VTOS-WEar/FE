import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**
 * Captures a DOM element and returns it as a base64-encoded PDF string.
 * Returns null if generation fails (non-critical — sign still proceeds).
 */
export async function generateContractPdf(elementId: string): Promise<string | null> {
    try {
        const element = document.getElementById(elementId);
        if (!element) return null;

        // Capture element at 1.5x scale (balance between quality and file size)
        const canvas = await html2canvas(element, {
            scale: 1.5,
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#ffffff",
            logging: false,
        });

        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
        });

        const pdfWidthMm = pdf.internal.pageSize.getWidth();   // 210mm
        const pdfHeightMm = pdf.internal.pageSize.getHeight(); // 297mm
        const canvasW = canvas.width;
        const canvasH = canvas.height;
        const contentHeightMm = pdfWidthMm * (canvasH / canvasW);

        if (contentHeightMm <= pdfHeightMm) {
            // Fits on a single page
            pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, pdfWidthMm, contentHeightMm);
        } else {
            // Multi-page: slice canvas height into A4-sized chunks
            const pageHeightPx = Math.round((pdfHeightMm / contentHeightMm) * canvasH);
            let offsetY = 0;
            let pageNum = 0;

            while (offsetY < canvasH) {
                if (pageNum > 0) pdf.addPage();

                const sliceH = Math.min(pageHeightPx, canvasH - offsetY);
                const pageCanvas = document.createElement("canvas");
                pageCanvas.width = canvasW;
                pageCanvas.height = sliceH;
                const ctx = pageCanvas.getContext("2d")!;
                ctx.drawImage(canvas, 0, offsetY, canvasW, sliceH, 0, 0, canvasW, sliceH);

                const sliceHeightMm = (sliceH / canvasH) * contentHeightMm;
                pdf.addImage(pageCanvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, pdfWidthMm, sliceHeightMm);

                offsetY += pageHeightPx;
                pageNum++;
            }
        }

        // Return base64 content only (strip "data:application/pdf;base64," prefix)
        const dataUri = pdf.output("datauristring");
        return dataUri.split(",")[1];
    } catch (err) {
        console.error("[pdfUtils] PDF generation failed:", err);
        return null;
    }
}

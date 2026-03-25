import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InvoiceResponseDto } from './dto/invoice-response.dto';
import {
  OcrExtractResponseDto,
  OcrExtractedInvoiceDto,
  OcrLineItemDto,
} from './dto/ocr-extract-response.dto';
import type { File as MulterFile } from 'multer';

type OcrEngine = 'google-vision' | 'gemini-vision' | 'tesseract' | 'pdf-text';
type StructuredInvoiceCandidate = Partial<OcrExtractedInvoiceDto>;

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  private ocrStoreReady = false;

  private readonly SUPPORTED_OCR_MIME_TYPES = new Set([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/pdf',
  ]);

  private async ensureOcrStore(): Promise<void> {
    if (this.ocrStoreReady) {
      return;
    }

    await this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "InvoiceOcrDocument" (
        "id" SERIAL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "fileName" TEXT NOT NULL,
        "mimeType" TEXT NOT NULL,
        "fileSize" INTEGER NOT NULL,
        "ocrEngine" TEXT NOT NULL,
        "rawText" TEXT,
        "extractedData" JSONB,
        "confidence" DOUBLE PRECISION,
        "status" TEXT NOT NULL DEFAULT 'Processed',
        "error" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await this.prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "InvoiceOcrDocument_userId_createdAt_idx"
      ON "InvoiceOcrDocument" ("userId", "createdAt" DESC);
    `);

    await this.prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION update_invoice_ocr_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW."updatedAt" = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await this.prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_trigger
          WHERE tgname = 'trg_invoice_ocr_updated_at'
        ) THEN
          CREATE TRIGGER trg_invoice_ocr_updated_at
          BEFORE UPDATE ON "InvoiceOcrDocument"
          FOR EACH ROW
          EXECUTE FUNCTION update_invoice_ocr_updated_at();
        END IF;
      END $$;
    `);

    this.ocrStoreReady = true;
  }

  async extractFromDocument(
    userId: string,
    file: MulterFile,
    createClientIfMissing = true,
  ): Promise<OcrExtractResponseDto> {
    await this.ensureOcrStore();

    if (!file?.buffer?.length) {
      throw new BadRequestException('Uploaded file is empty');
    }

    const mimeType = (file.mimetype || '').toLowerCase();
    if (!this.SUPPORTED_OCR_MIME_TYPES.has(mimeType)) {
      throw new BadRequestException(
        'Unsupported file type. Use JPG, PNG, WEBP, or PDF.',
      );
    }

    const { rawText, ocrEngine, confidence } = await this.extractTextFromFile(file);
    const parsedInvoice = await this.parseInvoiceFromText(
      rawText,
      file.originalname,
      file.buffer,
      mimeType,
    );
    const clientResolution = await this.resolveClientFromOcr(
      userId,
      parsedInvoice,
      createClientIfMissing,
    );

    if (clientResolution.status !== 'none') {
      parsedInvoice.party = clientResolution.name || parsedInvoice.party;
      parsedInvoice.partyGstin = clientResolution.gstin || parsedInvoice.partyGstin;
      parsedInvoice.recipientLegalName =
        clientResolution.name || parsedInvoice.recipientLegalName || parsedInvoice.party;
    }

    const inserted = await this.prisma.$queryRawUnsafe<{ id: number }[]>(
      `
      INSERT INTO "InvoiceOcrDocument" (
        "userId",
        "fileName",
        "mimeType",
        "fileSize",
        "ocrEngine",
        "rawText",
        "extractedData",
        "confidence",
        "status"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, 'Processed')
      RETURNING "id"
      `,
      userId,
      file.originalname,
      mimeType,
      file.size,
      ocrEngine,
      rawText,
      JSON.stringify(parsedInvoice),
      confidence,
    );

    const documentId = inserted[0]?.id || 0;

    return {
      documentId,
      fileName: file.originalname,
      mimeType,
      ocrEngine,
      confidence,
      extractedTextPreview: rawText.slice(0, 1200),
      invoice: parsedInvoice,
      clientResolution,
    };
  }

  private sanitizeClientName(value: string): string {
    const cleaned = (value || '')
      .replace(/^[:\-\s]+/, '')
      .replace(/\b(gstin|gst|pan|state|city|address|mobile|phone|email)\b.*$/i, '')
      .replace(/\s+/g, ' ')
      .trim();
    return cleaned;
  }

  private isLikelyPartyName(value: string): boolean {
    const cleaned = this.sanitizeClientName(value || '');
    if (!cleaned || cleaned.length < 2 || cleaned.length > 90) {
      return false;
    }

    if (/\b\d{2}[/-]\d{2}[/-]\d{2,4}\b/.test(cleaned)) {
      return false;
    }

    if (/\b(invoice|date|amount|tax|gst|cgst|sgst|igst|total|bill)\b/i.test(cleaned)) {
      return false;
    }

    return /[A-Za-z]/.test(cleaned);
  }

  private isGstinNearCustomerContext(text: string, gstin: string): boolean {
    if (!gstin) {
      return false;
    }

    const escaped = gstin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const contextRegex = new RegExp(
      `(?:customer|bill\\s*to|buyer|party|ship\\s*to)[\\s\\S]{0,220}${escaped}`,
      'i',
    );
    return contextRegex.test(text);
  }

  private makeClientFallbackEmail(userId: string, gstin: string): string {
    const safeUser = (userId || 'user').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) || 'user';
    const safeGstin = (gstin || 'nocode').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) || 'nocode';
    return `${safeUser}.${safeGstin}@smartgst.local`;
  }

  private makeClientFallbackPhone(gstin: string): string {
    const digits = (gstin || '').replace(/\D/g, '');
    if (digits.length >= 10) {
      return digits.slice(0, 10);
    }
    return `9${(digits + '000000000').slice(0, 9)}`;
  }

  private async resolveClientFromOcr(
    userId: string,
    invoice: OcrExtractedInvoiceDto,
    createClientIfMissing: boolean,
  ): Promise<{
    status: 'matched' | 'created' | 'none';
    clientId?: number;
    name?: string;
    gstin?: string;
  }> {
    const gstin = (invoice.partyGstin || '').trim().toUpperCase();
    const partyName = this.sanitizeClientName(invoice.party || '');

    let existingClient: {
      id: number;
      name: string;
      gstin: string;
    } | null = null;

    if (gstin) {
      existingClient = await this.prisma.clients.findFirst({
        where: { userId, gstin },
        select: { id: true, name: true, gstin: true },
      });
    }

    if (!existingClient && partyName) {
      existingClient = await this.prisma.clients.findFirst({
        where: {
          userId,
          name: {
            equals: partyName,
            mode: 'insensitive',
          },
        },
        select: { id: true, name: true, gstin: true },
      });
    }

    if (existingClient) {
      return {
        status: 'matched',
        clientId: existingClient.id,
        name: existingClient.name,
        gstin: existingClient.gstin,
      };
    }

    if (!createClientIfMissing || !gstin || !partyName) {
      return { status: 'none' };
    }

    try {
      const created = await this.prisma.clients.create({
        data: {
          userId,
          name: partyName,
          legalName: invoice.recipientLegalName || partyName,
          gstin,
          phoneNumber: this.makeClientFallbackPhone(gstin),
          email: this.makeClientFallbackEmail(userId, gstin),
          clientType: invoice.invoiceType === 'purchase' ? 'Supplier' : 'Customer',
          address: invoice.recipientAddress || null,
          billingAddress: invoice.recipientAddress || null,
          place: invoice.recipientAddress?.split(',')?.[0]?.trim() || null,
          stateCode: invoice.placeOfSupplyStateCode || invoice.recipientStateCode || null,
          pincode: invoice.recipientPincode || null,
          shippingGstin: gstin,
          shippingStateCode: invoice.placeOfSupplyStateCode || invoice.recipientStateCode || null,
          shippingPincode: invoice.recipientPincode || null,
        },
      });

      return {
        status: 'created',
        clientId: created.id,
        name: created.name,
        gstin: created.gstin,
      };
    } catch {
      // Handle race conditions where another request creates the same client.
      const fallback = await this.prisma.clients.findFirst({
        where: { userId, gstin },
        select: { id: true, name: true, gstin: true },
      });

      if (fallback) {
        return {
          status: 'matched',
          clientId: fallback.id,
          name: fallback.name,
          gstin: fallback.gstin,
        };
      }

      return { status: 'none' };
    }
  }

  private async extractTextFromFile(
    file: MulterFile,
  ): Promise<{ rawText: string; ocrEngine: OcrEngine; confidence: number }> {
    const mimeType = (file.mimetype || '').toLowerCase();
    const isPdf = mimeType === 'application/pdf';

    if (isPdf) {
      const pdfText = await this.tryExtractPdfText(file.buffer);
      if (pdfText.length > 0) {
        return {
          rawText: pdfText,
          ocrEngine: 'pdf-text',
          confidence: 0.96,
        };
      }
    }

    const visionText = await this.tryGoogleVisionOcr(file.buffer, mimeType);
    if (visionText.length > 0) {
      return {
        rawText: visionText,
        ocrEngine: 'google-vision',
        confidence: 0.93,
      };
    }

    const geminiVisionText = await this.tryGeminiVisionOcr(file.buffer, mimeType);
    if (geminiVisionText.length > 0) {
      return {
        rawText: geminiVisionText,
        ocrEngine: 'gemini-vision',
        confidence: 0.9,
      };
    }

    if (isPdf) {
      throw new BadRequestException(
        'Could not extract text from PDF. Configure GOOGLE_CLOUD_VISION_API_KEY or GOOGLE_API_KEY, or upload a clearer image (JPG/PNG).',
      );
    }

    const tesseractText = await this.tryTesseractOcr(file.buffer);
    if (tesseractText.length === 0) {
      throw new BadRequestException(
        'Could not extract text from document. Try a clearer file or use image/PDF under 10MB.',
      );
    }

    return {
      rawText: tesseractText,
      ocrEngine: 'tesseract',
      confidence: 0.78,
    };
  }

  private async tryExtractPdfText(buffer: Buffer): Promise<string> {
    try {
      const pdfParseModule = await import('pdf-parse');
      const pdfParse = (pdfParseModule as any).default || pdfParseModule;
      const parsed = await pdfParse(buffer);
      return this.normalizeWhitespace(parsed?.text || '');
    } catch {
      return '';
    }
  }

  private async tryGoogleVisionOcr(
    buffer: Buffer,
    mimeType: string,
  ): Promise<string> {
    const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY?.trim();
    if (!apiKey) {
      return '';
    }

    try {
      const content = buffer.toString('base64');
      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [
              {
                image: { content },
                features: [
                  {
                    type: 'DOCUMENT_TEXT_DETECTION',
                    maxResults: 1,
                  },
                ],
                imageContext:
                  mimeType === 'application/pdf'
                    ? undefined
                    : {
                        languageHints: ['en', 'en-t-i0-handwrit'],
                      },
              },
            ],
          }),
        },
      );

      if (!response.ok) {
        return '';
      }

      const payload = (await response.json()) as any;
      const text =
        payload?.responses?.[0]?.fullTextAnnotation?.text ||
        payload?.responses?.[0]?.textAnnotations?.[0]?.description ||
        '';

      return this.normalizeWhitespace(text);
    } catch {
      return '';
    }
  }

  private async tryGeminiVisionOcr(
    buffer: Buffer,
    mimeType: string,
  ): Promise<string> {
    const apiKey = process.env.GOOGLE_API_KEY?.trim();
    if (!apiKey) {
      return '';
    }

    const configuredModel = (process.env.GEMINI_OCR_MODEL || '').trim();
    const model = configuredModel || 'gemini-2.0-flash';

    try {
      const payload = {
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: 'Extract all readable text from this invoice document. Return plain text only, preserve important labels, line breaks, and numbers where possible.',
              },
              {
                inlineData: {
                  mimeType,
                  data: buffer.toString('base64'),
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 4096,
        },
      };

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        return '';
      }

      const data = (await response.json()) as any;
      const text =
        data?.candidates?.[0]?.content?.parts
          ?.map((part: { text?: string }) => part?.text || '')
          .join('\n')
          .trim() || '';

      return this.normalizeWhitespace(text);
    } catch {
      return '';
    }
  }

  private async tryTesseractOcr(buffer: Buffer): Promise<string> {
    try {
      const tesseractModule = await import('tesseract.js');
      const createWorker =
        (tesseractModule as any).createWorker || (tesseractModule as any).default?.createWorker;

      if (typeof createWorker !== 'function') {
        return '';
      }

      const worker = await createWorker('eng');
      try {
        const result = await worker.recognize(buffer);
        const text = result?.data?.text || '';
        return this.normalizeWhitespace(text);
      } finally {
        await worker.terminate();
      }
    } catch {
      return '';
    }
  }

  private normalizeWhitespace(value: string): string {
    return (value || '').replace(/\r/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  private stripMarkdownFences(value: string): string {
    return value
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
  }

  private safeJsonParse<T>(value: string): T | null {
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  private extractFirstJsonObject(value: string): string {
    const text = value || '';
    const start = text.indexOf('{');
    if (start < 0) {
      return '';
    }

    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = start; i < text.length; i += 1) {
      const ch = text[i];

      if (inString) {
        if (escaped) {
          escaped = false;
          continue;
        }
        if (ch === '\\') {
          escaped = true;
          continue;
        }
        if (ch === '"') {
          inString = false;
        }
        continue;
      }

      if (ch === '"') {
        inString = true;
        continue;
      }

      if (ch === '{') {
        depth += 1;
      } else if (ch === '}') {
        depth -= 1;
        if (depth === 0) {
          return text.slice(start, i + 1);
        }
      }
    }

    return '';
  }

  private parseDateString(value: string | undefined): string {
    if (!value) {
      return new Date().toISOString().slice(0, 10);
    }

    const cleaned = value.replace(/[^0-9/-]/g, '').trim();
    if (!cleaned) {
      return new Date().toISOString().slice(0, 10);
    }

    const slashPattern = /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/;
    const slashMatch = cleaned.match(slashPattern);
    if (slashMatch) {
      const day = Number.parseInt(slashMatch[1], 10);
      const month = Number.parseInt(slashMatch[2], 10);
      const yearRaw = Number.parseInt(slashMatch[3], 10);
      const year = yearRaw < 100 ? 2000 + yearRaw : yearRaw;
      const date = new Date(year, month - 1, day);
      if (!Number.isNaN(date.getTime())) {
        return date.toISOString().slice(0, 10);
      }
    }

    const isoAttempt = new Date(cleaned);
    if (!Number.isNaN(isoAttempt.getTime())) {
      return isoAttempt.toISOString().slice(0, 10);
    }

    return new Date().toISOString().slice(0, 10);
  }

  private toAmountString(value: number): string {
    if (!Number.isFinite(value)) {
      return '0.00';
    }
    return value.toFixed(2);
  }

  private parseCurrencyNumber(value: string): number {
    const normalized = value.replace(/[^0-9.,-]/g, '').replace(/,(?=\d{3}(\D|$))/g, '');
    const direct = Number.parseFloat(normalized.replace(/,/g, ''));
    if (!Number.isNaN(direct)) {
      return direct;
    }
    return 0;
  }

  private extractGstinCandidates(text: string): string[] {
    const matches = text.match(/\b\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]\b/gi) || [];
    return [...new Set(matches.map((item) => item.toUpperCase()))];
  }

  private extractFieldFromSection(text: string, sectionLabel: RegExp, fieldPattern: RegExp): string {
    const sectionMatch = text.match(sectionLabel);
    if (!sectionMatch || sectionMatch.index === undefined) {
      return '';
    }

    const start = sectionMatch.index;
    const block = text.slice(start, Math.min(start + 500, text.length));
    const match = block.match(fieldPattern);
    return match?.[1]?.trim() || '';
  }

  private extractPartyGstinFromContext(text: string, fallback: string[]): string {
    const fromClientBlock =
      this.extractFieldFromSection(
        text,
        /(?:client\s*name|bill\s*to|buyer|customer|party\s*name)\s*[:\-]?/i,
        /\b(\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z])\b/i,
      ) ||
      this.extractFieldFromSection(
        text,
        /ship\s*to\s*[:\-]?/i,
        /\b(\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z])\b/i,
      );

    if (fromClientBlock) {
      return fromClientBlock.toUpperCase();
    }

    // Do not default to supplier GSTIN when customer GSTIN is absent.
    return '';
  }

  private extractCustomerName(text: string): string {
    const directCustomer = this.findFieldByPattern(
      text,
      /customer\s*[:\-]?\s*([^\n]{2,120})/i,
    );
    if (directCustomer) {
      return this.sanitizeClientName(directCustomer);
    }

    const billTo = this.findFieldByPattern(
      text,
      /(?:bill\s*to|buyer|party\s*name)\s*[:\-]?\s*([^\n]{2,120})/i,
    );
    return this.sanitizeClientName(billTo);
  }

  private extractBillingAddressBlock(text: string): string {
    const block = this.findFieldByPattern(
      text,
      /billing\s*address\s*[:\-]?\s*([\s\S]{10,260}?)(?:\n\s*shipping\s*address|\n\s*(?:no\.?|s\.?no\.?|item\s*name|taxable\s*value)|$)/i,
    );

    if (!block) {
      return '';
    }

    return this.normalizeWhitespace(block).replace(/\n+/g, ', ').slice(0, 180);
  }

  private extractSummaryTaxAmount(text: string, label: RegExp): number {
    const summaryStart = text.search(/taxable\s*value|total\s*payable|total\s*value/i);
    const scope = summaryStart >= 0 ? text.slice(summaryStart, Math.min(text.length, summaryStart + 800)) : text;

    const match = scope.match(label);
    return this.parseCurrencyNumber(match?.[1] || '');
  }

  private sanitizeStructuredCandidate(
    candidate: StructuredInvoiceCandidate | null,
  ): StructuredInvoiceCandidate | null {
    if (!candidate || typeof candidate !== 'object') {
      return null;
    }

    const sanitizeNumber = (value: unknown, fallback = 0): number => {
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }
      if (typeof value === 'string') {
        return this.parseCurrencyNumber(value) || fallback;
      }
      return fallback;
    };

    const sanitizeString = (value: unknown): string => {
      if (typeof value === 'string') {
        return value.trim();
      }
      return '';
    };

    const normalizedInvoiceType = sanitizeString(candidate.invoiceType).toLowerCase();
    const invoiceType = normalizedInvoiceType === 'purchase' ? 'purchase' : 'sale';

    const normalizedItems = Array.isArray(candidate.items)
      ? candidate.items
          .map((item) => ({
            itemName: sanitizeString((item as any)?.itemName),
            hsnCode: sanitizeString((item as any)?.hsnCode),
            quantity: sanitizeNumber((item as any)?.quantity, 1),
            price: sanitizeNumber((item as any)?.price, 0),
            discount: sanitizeNumber((item as any)?.discount, 0),
            taxRate: sanitizeNumber((item as any)?.taxRate, 18),
            amount: sanitizeNumber((item as any)?.amount, 0),
          }))
          .filter((item) => item.itemName || item.amount > 0 || item.price > 0)
      : [];

    const candidateAmount = sanitizeNumber(candidate.amount, 0);
    const candidateGst = sanitizeNumber(candidate.gst, 0);
    const candidateTotal = sanitizeNumber(candidate.totalAmount, 0);

    return {
      invoiceNumber: sanitizeString(candidate.invoiceNumber),
      invoiceDate: this.parseDateString(sanitizeString(candidate.invoiceDate) || undefined),
      dueDate: this.parseDateString(sanitizeString(candidate.dueDate) || undefined),
      invoiceType,
      party: this.sanitizeClientName(sanitizeString(candidate.party)),
      partyGstin: sanitizeString(candidate.partyGstin).toUpperCase(),
      recipientLegalName: this.sanitizeClientName(sanitizeString(candidate.recipientLegalName)),
      recipientAddress: sanitizeString(candidate.recipientAddress),
      recipientStateCode: sanitizeString(candidate.recipientStateCode),
      placeOfSupplyStateCode: sanitizeString(candidate.placeOfSupplyStateCode),
      recipientPincode: sanitizeString(candidate.recipientPincode),
      ewayBillNumber: sanitizeString(candidate.ewayBillNumber),
      notes: sanitizeString(candidate.notes),
      amount: this.toAmountString(candidateAmount),
      gst: this.toAmountString(candidateGst),
      totalAmount: this.toAmountString(candidateTotal),
      status: sanitizeString(candidate.status) || 'Pending',
      items: normalizedItems,
    };
  }

  private async tryGeminiStructuredInvoiceExtraction(
    buffer: Buffer,
    mimeType: string,
    rawText: string,
    fileName: string,
  ): Promise<StructuredInvoiceCandidate | null> {
    const apiKey = process.env.GOOGLE_API_KEY?.trim();
    if (!apiKey) {
      return null;
    }

    const configuredModel = (process.env.GEMINI_OCR_MODEL || '').trim();
    const model = configuredModel || 'gemini-2.0-flash';

    const prompt = [
      'Extract structured invoice data from the given OCR text and file.',
      'Return ONLY valid JSON object without markdown.',
      'Use this exact schema:',
      '{"invoiceNumber":"","invoiceDate":"YYYY-MM-DD","dueDate":"YYYY-MM-DD","invoiceType":"sale|purchase","party":"","partyGstin":"","recipientLegalName":"","recipientAddress":"","recipientStateCode":"","placeOfSupplyStateCode":"","recipientPincode":"","ewayBillNumber":"","notes":"","amount":"0.00","gst":"0.00","totalAmount":"0.00","status":"Pending","items":[{"itemName":"","hsnCode":"","quantity":1,"price":0,"discount":0,"taxRate":18,"amount":0}]}',
      'Use values from document only. If unknown, keep empty string or numeric 0.',
      `File name: ${fileName}`,
      `OCR text:\n${rawText.slice(0, 16000)}`,
    ].join('\n');

    const callGemini = async (parts: any[]): Promise<StructuredInvoiceCandidate | null> => {
      try {
        const payload = {
          contents: [
            {
              role: 'user',
              parts,
            },
          ],
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 4096,
            responseMimeType: 'application/json',
          },
        };

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          },
        );

        if (!response.ok) {
          return null;
        }

        const data = (await response.json()) as any;
        const text =
          data?.candidates?.[0]?.content?.parts
            ?.map((part: { text?: string }) => part?.text || '')
            .join('\n')
            .trim() || '';

        if (!text) {
          return null;
        }

        const cleaned = this.stripMarkdownFences(text);
        const direct = this.safeJsonParse<StructuredInvoiceCandidate>(cleaned);
        if (direct) {
          return this.sanitizeStructuredCandidate(direct);
        }

        const firstObject = this.extractFirstJsonObject(cleaned);
        if (!firstObject) {
          return null;
        }

        const recovered = this.safeJsonParse<StructuredInvoiceCandidate>(firstObject);
        return this.sanitizeStructuredCandidate(recovered);
      } catch {
        return null;
      }
    };

    const withImage = await callGemini([
      { text: prompt },
      {
        inlineData: {
          mimeType,
          data: buffer.toString('base64'),
        },
      },
    ]);

    if (withImage) {
      return withImage;
    }

    // Second attempt: parse strictly from OCR text only to recover from multimodal failures.
    const withTextOnly = await callGemini([{ text: prompt }]);
    return withTextOnly;
  }

  private findFieldByPattern(text: string, pattern: RegExp): string {
    const match = text.match(pattern);
    return match?.[1]?.trim() || '';
  }

  private extractLineItems(text: string): OcrLineItemDto[] {
    const lines = text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 300);

    const items: OcrLineItemDto[] = [];
    const rowPattern = /^([A-Za-z][A-Za-z0-9 .,&()\/-]{2,})\s{1,}(\d{1,5})\s{1,}(\d+(?:\.\d{1,2})?)\s{1,}(\d+(?:\.\d{1,2})?)$/;

    for (const line of lines) {
      const match = line.match(rowPattern);
      if (!match) {
        continue;
      }

      const quantity = Number.parseFloat(match[2]);
      const price = Number.parseFloat(match[3]);
      const amount = Number.parseFloat(match[4]);

      if (!Number.isFinite(quantity) || !Number.isFinite(price) || !Number.isFinite(amount)) {
        continue;
      }

      items.push({
        itemName: match[1].trim(),
        hsnCode: '',
        quantity,
        price,
        discount: 0,
        taxRate: 18,
        amount,
      });

      if (items.length >= 10) {
        break;
      }
    }

    return items;
  }

  private async parseInvoiceFromText(
    rawText: string,
    fileName: string,
    fileBuffer?: Buffer,
    mimeType?: string,
  ): Promise<OcrExtractedInvoiceDto> {
    const text = rawText || '';
    const gstins = this.extractGstinCandidates(text);

    const invoiceNumber =
      this.findFieldByPattern(
        text,
        /invoice\s*(?:no|number|#)?\s*[:\-]?\s*([A-Z0-9\/-]{3,40})/i,
      ) ||
      this.findFieldByPattern(text, /bill\s*(?:no|number|#)?\s*[:\-]?\s*([A-Z0-9\/-]{3,40})/i) ||
      `OCR-${Date.now()}`;

    const invoiceDate = this.parseDateString(
      this.findFieldByPattern(
        text,
        /invoice\s*date\s*[:\-]?\s*([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4})/i,
      ) ||
        this.findFieldByPattern(
          text,
          /date\s*[:\-]?\s*([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4})/i,
        ),
    );

    const dueDate = this.parseDateString(
      this.findFieldByPattern(
        text,
        /due\s*date\s*[:\-]?\s*([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4})/i,
      ) || invoiceDate,
    );

    const party =
      this.extractCustomerName(text) ||
      this.sanitizeClientName(
        this.findFieldByPattern(
          text,
          /(?:client\s*name|bill\s*to|buyer|customer|party\s*name|party)\s*[:\-]?\s*([A-Za-z0-9 .,&()\/-]{3,120})/i,
        ) ||
          this.findFieldByPattern(
            text,
            /(?:ship\s*to)\s*\n\s*([A-Za-z0-9 .,&()\/-]{3,120})/i,
          ),
      ) ||
      fileName.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim() ||
      'Unknown Party';

    const ewayBillNumber =
      this.findFieldByPattern(
        text,
        /(?:e[ -]?way\s*bill(?:\s*no)?|eway\s*bill(?:\s*number)?)\s*[:\-]?\s*([A-Z0-9\/-]{6,30})/i,
      ) || undefined;

    const notes =
      this.findFieldByPattern(
        text,
        /(?:note|remarks?)\s*[:\-]?\s*([A-Za-z0-9 .,&()\/-]{3,200})/i,
      ) ||
      'Auto-filled from OCR document.';

    const totalAmountMatch = text.match(
      /(?:grand\s*total|invoice\s*value|total\s*value\s*\(?(?:in\s*figure)?\)?|total\s*amount|net\s*amount|amount\s*due|total\s*payable)\s*[:\-]?\s*(?:rs\.?|inr)?\s*([0-9,]+(?:\.\d{1,2})?)/i,
    );
    const amountMatch = text.match(
      /(?:total\s*taxable\s*value|taxable\s*value|taxable\s*amount|subtotal|sub\s*total|amount\s*before\s*tax)\s*[:\-]?\s*(?:rs\.?|inr)?\s*([0-9,]+(?:\.\d{1,2})?)/i,
    );
    const gstMatch = text.match(
      /(?:total\s*tax\s*amount|total\s*tax|gst\s*amount|igst\s*amount|cgst\s*amount|sgst\s*amount)\s*[:\-]?\s*(?:rs\.?|inr)?\s*([0-9,]+(?:\.\d{1,2})?)/i,
    );

    let totalAmount = this.parseCurrencyNumber(totalAmountMatch?.[1] || '');
    let amount = this.parseCurrencyNumber(amountMatch?.[1] || '');
    let gst = this.parseCurrencyNumber(gstMatch?.[1] || '');

    const summaryCgst = this.extractSummaryTaxAmount(
      text,
      /(?:central\s*goods\s*and\s*services\s*tax\s*\(?(?:cgst)?\)?|cgst)\s*[:\-]?\s*([0-9,]+(?:\.\d{1,2})?)/i,
    );
    const summarySgst = this.extractSummaryTaxAmount(
      text,
      /(?:state\s*goods\s*and\s*services\s*tax\s*\(?(?:sgst)?\)?|sgst)\s*[:\-]?\s*([0-9,]+(?:\.\d{1,2})?)/i,
    );
    const summaryIgst = this.extractSummaryTaxAmount(
      text,
      /(?:integrated\s*goods\s*and\s*services\s*tax\s*\(?(?:igst)?\)?|igst)\s*[:\-]?\s*([0-9,]+(?:\.\d{1,2})?)/i,
    );

    if (!gst && (summaryCgst || summarySgst || summaryIgst)) {
      gst = summaryCgst + summarySgst + summaryIgst;
    }

    const items = this.extractLineItems(text);
    if (items.length > 0 && (!amount || !totalAmount)) {
      const derivedAmount = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
      const derivedTotal = items.reduce((sum, item) => sum + item.amount, 0);
      amount = amount || derivedAmount;
      totalAmount = totalAmount || derivedTotal;
    }

    if (!totalAmount && amount && gst) {
      totalAmount = amount + gst;
    }
    if (!amount && totalAmount && gst) {
      amount = Math.max(totalAmount - gst, 0);
    }
    if (!gst && totalAmount && amount) {
      gst = Math.max(totalAmount - amount, 0);
    }

    if (!amount && totalAmount) {
      amount = totalAmount;
    }
    if (!totalAmount && amount) {
      totalAmount = amount;
    }

    const parsed: OcrExtractedInvoiceDto = {
      invoiceNumber,
      invoiceDate,
      dueDate,
      invoiceType: /purchase|vendor|supplier/i.test(text) ? 'purchase' : 'sale',
      party,
      partyGstin: this.extractPartyGstinFromContext(text, gstins),
      recipientLegalName: party,
      recipientAddress:
        this.extractBillingAddressBlock(text) ||
        this.findFieldByPattern(
          text,
          /(?:bill\s*to\s*address|customer\s*address|ship\s*to\s*address|address)\s*[:\-]?\s*([A-Za-z0-9 .,&()\/-]{6,180})/i,
        ),
      recipientStateCode:
        this.findFieldByPattern(text, /state\s*code\s*[:\-]?\s*(\d{2})/i) ||
        this.findFieldByPattern(text, /place\s*of\s*supply\s*[:\-]?\s*([A-Z]{2,3}|\d{2})/i),
      placeOfSupplyStateCode:
        this.findFieldByPattern(text, /place\s*of\s*supply\s*[:\-]?\s*([A-Z]{2,3}|\d{2})/i) ||
        this.findFieldByPattern(text, /state\s*code\s*[:\-]?\s*(\d{2})/i),
      recipientPincode: this.findFieldByPattern(text, /\b(\d{6})\b/),
      ewayBillNumber,
      notes,
      amount: this.toAmountString(amount),
      gst: this.toAmountString(gst),
      totalAmount: this.toAmountString(totalAmount),
      status: 'Pending',
      items,
    };

    let structured: StructuredInvoiceCandidate | null = null;
    if (fileBuffer && mimeType) {
      structured = await this.tryGeminiStructuredInvoiceExtraction(
        fileBuffer,
        mimeType,
        rawText,
        fileName,
      );
    }

    const pick = (preferred?: string, fallback?: string): string => {
      const p = (preferred || '').trim();
      if (p) {
        return p;
      }
      return (fallback || '').trim();
    };

    const pickAmount = (preferred?: string, fallback?: string): string => {
      const p = this.parseCurrencyNumber(preferred || '');
      if (p > 0) {
        return this.toAmountString(p);
      }
      return fallback || '0.00';
    };

    if (structured) {
      parsed.invoiceNumber = pick(structured.invoiceNumber, parsed.invoiceNumber) || parsed.invoiceNumber;
      parsed.invoiceDate = pick(structured.invoiceDate, parsed.invoiceDate) || parsed.invoiceDate;
      parsed.dueDate = pick(structured.dueDate, parsed.dueDate) || parsed.dueDate;
      parsed.invoiceType = pick(structured.invoiceType, parsed.invoiceType) || parsed.invoiceType;

      const structuredParty = this.sanitizeClientName(structured.party || '');
      if (this.isLikelyPartyName(structuredParty)) {
        parsed.party = structuredParty;
      }

      const structuredPartyGstin = (structured.partyGstin || '').toUpperCase();
      if (this.isGstinNearCustomerContext(text, structuredPartyGstin)) {
        parsed.partyGstin = structuredPartyGstin;
      }

      const structuredRecipient = this.sanitizeClientName(structured.recipientLegalName || '');
      if (this.isLikelyPartyName(structuredRecipient)) {
        parsed.recipientLegalName = structuredRecipient;
      } else {
        parsed.recipientLegalName = parsed.recipientLegalName || parsed.party;
      }

      parsed.recipientAddress = pick(structured.recipientAddress, parsed.recipientAddress);
      parsed.recipientStateCode = pick(structured.recipientStateCode, parsed.recipientStateCode);
      parsed.placeOfSupplyStateCode = pick(
        structured.placeOfSupplyStateCode,
        parsed.placeOfSupplyStateCode || parsed.recipientStateCode,
      );
      parsed.recipientPincode = pick(structured.recipientPincode, parsed.recipientPincode);
      parsed.ewayBillNumber = pick(structured.ewayBillNumber, parsed.ewayBillNumber);
      parsed.notes = pick(structured.notes, parsed.notes);
      parsed.amount = pickAmount(structured.amount, parsed.amount);
      parsed.gst = pickAmount(structured.gst, parsed.gst);
      parsed.totalAmount = pickAmount(structured.totalAmount, parsed.totalAmount);
      parsed.status = pick(structured.status, parsed.status) || 'Pending';

      if (Array.isArray(structured.items) && structured.items.length > 0) {
        parsed.items = structured.items;
      }
    }

    // Ensure at least one line item so create-invoice form can be submitted directly.
    if (!parsed.items.length) {
      const fallbackPrice = this.parseCurrencyNumber(parsed.amount);
      const fallbackTotal = this.parseCurrencyNumber(parsed.totalAmount);
      const fallbackTax = this.parseCurrencyNumber(parsed.gst);
      const derivedTaxRate =
        fallbackPrice > 0 && fallbackTax > 0 ? Math.min(Math.round((fallbackTax / fallbackPrice) * 100), 28) : 18;

      parsed.items.push({
        itemName: 'OCR Extracted Item',
        hsnCode: '',
        quantity: 1,
        price: fallbackPrice || fallbackTotal || 0,
        discount: 0,
        taxRate: derivedTaxRate || 18,
        amount: fallbackTotal || fallbackPrice || 0,
      });
    }

    return parsed;
  }

  private normalizePrefix(prefix?: string | null): string {
    const cleaned = (prefix ?? 'INV').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    return cleaned || 'INV';
  }

  private extractSequence(invoiceNumber: string, prefix: string): { seq: number; width: number } | null {
    const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = invoiceNumber
      .trim()
      .toUpperCase()
      .match(new RegExp(`^${escapedPrefix}[-/\\s]?(\\d+)$`));

    if (!match) {
      return null;
    }

    return {
      seq: Number.parseInt(match[1], 10),
      width: Math.max(match[1].length, 3),
    };
  }

  private async generateNextInvoiceNumber(userId: string): Promise<string> {
    const settings = await this.prisma.settings.findUnique({
      where: { userId },
      select: { invoicePrefix: true },
    });

    const prefix = this.normalizePrefix(settings?.invoicePrefix);

    const existing = await this.prisma.invoices.findMany({
      where: { userId },
      select: { invoiceNumber: true },
    });

    let maxSeq = 0;
    let width = 3;

    for (const row of existing) {
      const parsed = this.extractSequence(row.invoiceNumber, prefix);
      if (!parsed) {
        continue;
      }
      if (parsed.seq > maxSeq) {
        maxSeq = parsed.seq;
      }
      if (parsed.width > width) {
        width = parsed.width;
      }
    }

    return `${prefix}-${String(maxSeq + 1).padStart(width, '0')}`;
  }

  async create(createInvoiceDto: CreateInvoiceDto): Promise<InvoiceResponseDto> {
    const createData: any = {
      ...createInvoiceDto,
      invoiceDate: new Date(createInvoiceDto.invoiceDate),
      dueDate: new Date(createInvoiceDto.dueDate),
    };

    if (createInvoiceDto.documentDate) {
      createData.documentDate = new Date(createInvoiceDto.documentDate);
    }

    if (createInvoiceDto.precedingInvoiceDate) {
      createData.precedingInvoiceDate = new Date(createInvoiceDto.precedingInvoiceDate);
    }

    // Always assign a sequence number from invoice history so numbering remains consistent.
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        createData.invoiceNumber = await this.generateNextInvoiceNumber(createInvoiceDto.userId);

        const invoice = await this.prisma.invoices.create({
          data: createData,
        });

        return invoice;
      } catch (error) {
        if (error.code === 'P2002' && attempt < 3) {
          continue;
        }

        if (error.code === 'P2002') {
          const field = error.meta?.target?.[0];
          throw new ConflictException(`Invoice with this ${field} already exists`);
        }

        throw error;
      }
    }

    throw new ConflictException('Failed to generate a unique sequential invoice number');
  }

  async findAll(userId: string): Promise<InvoiceResponseDto[]> {
    return await this.prisma.invoices.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(userId: string, id: number): Promise<InvoiceResponseDto> {
    const invoice = await this.prisma.invoices.findFirst({
      where: { userId, id },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return invoice;
  }

  async findByInvoiceNumber(userId: string, invoiceNumber: string): Promise<InvoiceResponseDto> {
    const invoice = await this.prisma.invoices.findFirst({
      where: { 
        userId,
        invoiceNumber 
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with number ${invoiceNumber} not found`);
    }

    return invoice;
  }

  async findByPartyGstin(userId: string, partyGstin: string): Promise<InvoiceResponseDto[]> {
    return await this.prisma.invoices.findMany({
      where: { 
        userId,
        partyGstin 
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByInvoiceType(userId: string, invoiceType: string): Promise<InvoiceResponseDto[]> {
    return await this.prisma.invoices.findMany({
      where: { 
        userId,
        invoiceType: {
          equals: invoiceType,
          mode: 'insensitive',
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByStatus(userId: string, status: string): Promise<InvoiceResponseDto[]> {
    return await this.prisma.invoices.findMany({
      where: { 
        userId,
        status: {
          equals: status,
          mode: 'insensitive',
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByDateRange(userId: string, startDate: string, endDate: string): Promise<InvoiceResponseDto[]> {
    return await this.prisma.invoices.findMany({
      where: {
        userId,
        invoiceDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      orderBy: {
        invoiceDate: 'desc',
      },
    });
  }

  async update(userId: string, id: number, updateInvoiceDto: UpdateInvoiceDto): Promise<InvoiceResponseDto> {
    // Verify ownership
    await this.findOne(userId, id);
    
    try {
      const updateData: any = { ...updateInvoiceDto };
      
      if (updateInvoiceDto.invoiceDate) {
        updateData.invoiceDate = new Date(updateInvoiceDto.invoiceDate);
      }
      
      if (updateInvoiceDto.dueDate) {
        updateData.dueDate = new Date(updateInvoiceDto.dueDate);
      }

      if (updateInvoiceDto.documentDate) {
        updateData.documentDate = new Date(updateInvoiceDto.documentDate);
      }

      if (updateInvoiceDto.precedingInvoiceDate) {
        updateData.precedingInvoiceDate = new Date(updateInvoiceDto.precedingInvoiceDate);
      }

      const invoice = await this.prisma.invoices.update({
        where: { id },
        data: updateData,
      });
      return invoice;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Invoice with ID ${id} not found`);
      }
      if (error.code === 'P2002') {
        const field = error.meta?.target?.[0];
        throw new ConflictException(`Invoice with this ${field} already exists`);
      }
      throw error;
    }
  }

  async updateByInvoiceNumber(userId: string, invoiceNumber: string, updateInvoiceDto: UpdateInvoiceDto): Promise<InvoiceResponseDto> {
    // Verify ownership
    const existing = await this.findByInvoiceNumber(userId, invoiceNumber);
    
    try {
      const updateData: any = { ...updateInvoiceDto };
      
      if (updateInvoiceDto.invoiceDate) {
        updateData.invoiceDate = new Date(updateInvoiceDto.invoiceDate);
      }
      
      if (updateInvoiceDto.dueDate) {
        updateData.dueDate = new Date(updateInvoiceDto.dueDate);
      }

      if (updateInvoiceDto.documentDate) {
        updateData.documentDate = new Date(updateInvoiceDto.documentDate);
      }

      if (updateInvoiceDto.precedingInvoiceDate) {
        updateData.precedingInvoiceDate = new Date(updateInvoiceDto.precedingInvoiceDate);
      }

      const invoice = await this.prisma.invoices.update({
        where: { id: existing.id },
        data: updateData,
      });
      return invoice;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Invoice with number ${invoiceNumber} not found`);
      }
      if (error.code === 'P2002') {
        const field = error.meta?.target?.[0];
        throw new ConflictException(`Invoice with this ${field} already exists`);
      }
      throw error;
    }
  }

  async remove(userId: string, id: number): Promise<{ message: string }> {
    // Verify ownership
    await this.findOne(userId, id);
    
    try {
      await this.prisma.invoices.delete({
        where: { id },
      });
      return { message: `Invoice with ID ${id} successfully deleted` };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Invoice with ID ${id} not found`);
      }
      throw error;
    }
  }

  async removeByInvoiceNumber(userId: string, invoiceNumber: string): Promise<{ message: string }> {
    // Verify ownership
    const existing = await this.findByInvoiceNumber(userId, invoiceNumber);
    
    try {
      await this.prisma.invoices.delete({
        where: { id: existing.id },
      });
      return { message: `Invoice with number ${invoiceNumber} successfully deleted` };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Invoice with number ${invoiceNumber} not found`);
      }
      throw error;
    }
  }

  async getInvoiceStats(userId: string): Promise<any> {
    const totalInvoices = await this.prisma.invoices.count({
      where: { userId }
    });
    const salesInvoices = await this.prisma.invoices.count({
      where: { userId, invoiceType: 'Sales' },
    });
    const purchaseInvoices = await this.prisma.invoices.count({
      where: { userId, invoiceType: 'Purchase' },
    });

    return {
      totalInvoices,
      salesInvoices,
      purchaseInvoices,
    };
  }
}

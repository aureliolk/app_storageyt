import { estimateBase64DecodedBytes } from "../media/base64.js";
import { sniffMimeFromBase64 } from "../media/sniff-mime-from-base64.js";

export type ChatAttachment = {
  type?: string;
  mimeType?: string;
  fileName?: string;
  content?: unknown;
};

export type ChatImageContent = {
  type: "image" | "audio";
  mediaType?:
    | "image/jpeg"
    | "image/png"
    | "image/gif"
    | "image/webp"
    | "audio/mpeg"
    | "audio/ogg"
    | "audio/wav"
    | "audio/webm";
  mimeType?: string;
  data: string; // base64
};
export type ParsedMessageWithImages = {
  message: string;
  images: ChatImageContent[];
};

type AttachmentLog = {
  warn: (message: string) => void;
};

function normalizeMime(mime?: string): string | undefined {
  if (!mime) {
    return undefined;
  }
  const cleaned = mime.split(";")[0]?.trim().toLowerCase();
  return cleaned || undefined;
}

function isImageMime(mime?: string): boolean {
  return typeof mime === "string" && mime.startsWith("image/");
}

function isValidBase64(value: string): boolean {
  // Allow whitespaces/newlines which are common in large payloads
  const cleaned = value.replace(/\s/g, "");
  // Minimal validation; avoid full decode allocations for large payloads.
  return (
    cleaned.length > 0 && cleaned.length % 4 === 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(cleaned)
  );
}

/**
 * Parse attachments and extract images as structured content blocks.
 * Returns the message text and an array of image content blocks
 * compatible with Claude API's image format.
 */
export async function parseMessageWithAttachments(
  message: string,
  attachments: ChatAttachment[] | undefined,
  opts?: { maxBytes?: number; log?: AttachmentLog },
): Promise<ParsedMessageWithImages> {
  const maxBytes = opts?.maxBytes ?? 5_000_000; // decoded bytes (5,000,000)
  const log = opts?.log;
  if (!attachments || attachments.length === 0) {
    return { message, images: [] };
  }

  const images: ChatImageContent[] = [];

  for (const [idx, att] of attachments.entries()) {
    if (!att) {
      continue;
    }
    const mime = att.mimeType ?? "";
    const content = att.content;
    const label = att.fileName || att.type || `attachment-${idx + 1}`;

    if (typeof content !== "string") {
      throw new Error(`attachment ${label}: content must be base64 string`);
    }

    let sizeBytes = 0;
    let b64 = content.trim();
    // Strip data URL prefix if present (e.g., "data:image/jpeg;base64,...")
    const dataUrlMatch = /^data:[^;]+;base64,([\s\S]*)$/.exec(b64);
    if (dataUrlMatch) {
      b64 = dataUrlMatch[1];
    }

    // Strip all internal whitespaces/newlines before processing
    b64 = b64.replace(/\s/g, "");

    if (!isValidBase64(b64)) {
      throw new Error(`attachment ${label}: invalid base64 content`);
    }
    sizeBytes = estimateBase64DecodedBytes(b64);
    if (sizeBytes <= 0 || sizeBytes > maxBytes) {
      throw new Error(`attachment ${label}: exceeds size limit (${sizeBytes} > ${maxBytes} bytes)`);
    }

    const providedMime = normalizeMime(mime);
    const sniffedMime = normalizeMime(await sniffMimeFromBase64(b64));

    // Check if it's image OR audio
    const isImage = (m: string | undefined) => isImageMime(m);
    const isAudio = (m: string | undefined) => m && m.startsWith("audio/");

    const effectiveMime = sniffedMime ?? providedMime ?? mime;
    const isValidMedia = isImage(effectiveMime) || isAudio(effectiveMime);

    if (sniffedMime && !isValidMedia) {
      log?.warn(`attachment ${label}: detected non-media (${sniffedMime}), dropping`);
      continue;
    }
    if (!sniffedMime && !isValidMedia) {
      log?.warn(`attachment ${label}: unable to detect valid media mime type, dropping`);
      continue;
    }
    if (sniffedMime && providedMime && sniffedMime !== providedMime) {
      log?.warn(
        `attachment ${label}: mime mismatch (${providedMime} -> ${sniffedMime}), using sniffed`,
      );
    }

    // We reuse ChatImageContent structure but pass through the correct type
    // This allows the media understanding layer to pick it up correctly later
    images.push({
      type: isAudio(effectiveMime) ? "audio" : "image",
      data: b64,
      mimeType: effectiveMime,
    } as ChatImageContent);
  }

  return { message, images };
}

/**
 * @deprecated Use parseMessageWithAttachments instead.
 * This function converts images to markdown data URLs which Claude API cannot process as images.
 */
export function buildMessageWithAttachments(
  message: string,
  attachments: ChatAttachment[] | undefined,
  opts?: { maxBytes?: number },
): string {
  const maxBytes = opts?.maxBytes ?? 2_000_000; // 2 MB
  if (!attachments || attachments.length === 0) {
    return message;
  }

  const blocks: string[] = [];

  for (const [idx, att] of attachments.entries()) {
    if (!att) {
      continue;
    }
    const mime = att.mimeType ?? "";
    const content = att.content;
    const label = att.fileName || att.type || `attachment-${idx + 1}`;

    if (typeof content !== "string") {
      throw new Error(`attachment ${label}: content must be base64 string`);
    }
    if (!mime.startsWith("image/")) {
      throw new Error(`attachment ${label}: only image/* supported`);
    }

    let sizeBytes = 0;
    const b64 = content.trim();
    if (!isValidBase64(b64)) {
      throw new Error(`attachment ${label}: invalid base64 content`);
    }
    sizeBytes = estimateBase64DecodedBytes(b64);
    if (sizeBytes <= 0 || sizeBytes > maxBytes) {
      throw new Error(`attachment ${label}: exceeds size limit (${sizeBytes} > ${maxBytes} bytes)`);
    }

    const safeLabel = label.replace(/\s+/g, "_");
    const dataUrl = `![${safeLabel}](data:${mime};base64,${content})`;
    blocks.push(dataUrl);
  }

  if (blocks.length === 0) {
    return message;
  }
  const separator = message.trim().length > 0 ? "\n\n" : "";
  return `${message}${separator}${blocks.join("\n\n")}`;
}

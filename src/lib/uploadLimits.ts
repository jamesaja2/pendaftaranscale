export const MAX_UPLOAD_MB = 200;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

export function formatMaxUploadLabel() {
  return `${MAX_UPLOAD_MB}MB`;
}

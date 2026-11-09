import sharp from 'sharp';

// Sharp tries to use all available CPU cores to process images in parallel
// which will cause Out Of Memory crashes for us
// Restricting concurrency to 1 forces Sharp to process one task at a time 
sharp.concurrency(1);

export interface ProcessedVariant {
  width: number;
  format: string;
  buffer: Buffer;
  mimeType: string;
  size: number;
}

export const processImageVariants = async (inputBuffer: Buffer): Promise<ProcessedVariant[]> => {
  const widths = [400, 800, 1600];
  const formats = ['avif', 'webp', 'jpeg'] as const;
  const variants: ProcessedVariant[] = [];

  const baseImage = sharp(inputBuffer);
  
  for (const width of widths) {
    const resized = baseImage.clone().resize(width, null, { 
        // ensures that uploading a tiny 300px image won't pixelate if stretched
        withoutEnlargement: true, 
        fit: 'inside' 
    });

    for (const format of formats) {
      const buffer = await resized
        .clone()
        .toFormat(format, {
          quality: 80,
          // balances compression size with much faster processing time (4)
          ...(format === 'avif' && { effort: 4 }) 
        })
        .toBuffer();

      variants.push({
        width,
        format,
        buffer,
        mimeType: `image/${format}`,
        size: buffer.length
      });
    }
  }

  return variants;
};
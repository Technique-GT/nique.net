# Photo Compression Strategy ADR

- **Issue:** [Spike: Photo compression strategies exploration #49](https://github.com/Technique-GT/technique/issues/49)

## Context

Raw photo uploads from the admin/editor panel are currently written directly to object storage and lead to high storage consumption and large payload sizes over the CDN. We need an automated pre-storage transformation step to normalize and compress uploads.

## Recommendation
Process uploads server-side using **[`sharp`](https://sharp.pixelplumbing.com/)** before sending assets to object storage.

### Pipeline Strategy
* **Primary format: WebP**
  * Provides ~65–75% reduction over raw uncompressed camera files, and ~25–35% smaller footprints than JPEGs based on [Google's WebP compression data](https://developers.google.com/speed/webp/docs/compression).
  * Native browser support is >96% globally according to [Can I Use: WebP](https://caniuse.com/webp).
* **AVIF?** While AVIF has 15–25% higher compression efficiency at equivalent SSIM, AVIF encoding speed in libvips/sharp takes roughly 4–10x longer per image than WebP (according to [sharp format performance discussions](https://github.com/lovell/sharp/discussions)). 
* **Fallbacks:**
  * Generate a single progressive JPEG for RSS feeds, legacy clients, and OpenGraph/social meta tags.
  * Retain original assets in an archival/cold storage if uncompressed copies are needed.

### Things to Consider
We should resize incoming images into three standard widths so that different devices don't display the wrong size image:
* **Thumbnail (`400px`):** Author bios, sidebar widgets, related story grids.
* **Inline (`800px`):** Standard inline story content.
* **Main Image (`1600px`):** Headers and article cover images.

## Alternatives

| Option | Pros | Cons | Thoughts |
| :--- | :--- | :--- | :--- |
| **Edge / CDN Transformations** ([Cloudflare Images](https://www.cloudflare.com/developer-platform/products/images/), [Cloudinary](https://cloudinary.com/)) | Zero server compute, on-the-fly resizing | Usage-based pricing tiers, vendor lock-in | Not cost-effective |
| **Client-side Compression** (Browser Canvas/WASM) | Zero server CPU load, faster uploads | Device-dependent throttling, not secure, inconsistent outputs | We need a reliable server-side source of truth for images. |
| **Legacy MozJPEG Only** | 100% universal compatibility | 25–35% larger payloads than WebP | Less efficient bandwidth and speed on mobile. |

## Trade-offs
* **Server Compute:** Batch uploads will spike CPU usage. We will need to enforce upload payload limits and throttle concurrent resize tasks.
* **More individual files, but less total disk space:** Saving three resized copies (thumbnail, inline, hero) for every photo means storing more total files, but because they are compressed, all three combined will still take up far fewer megabytes than the original raw image.

## Next Steps
1. Create implementation issue: *"Add sharp compression middleware to media upload routes"*.
2. Establish storage key conventions (e.g., `/media/:id/{thumb,inline,hero}.webp`).
# Photo Compression Strategy ADR

- **Issue:** [Spike: Photo compression strategies exploration #49](https://github.com/Technique-GT/technique/issues/49)

## Context

Raw photo uploads from the admin/editor panel are currently written directly to object storage and lead to high storage consumption and large payload sizes over the CDN. We need an automated pre-storage transformation step to normalize and compress uploads.

## Recommendation
Use AVIF as the primary delivery format to modern supporting browsers, paired with WebP and JPEG fallbacks.

Pre-Storage Pipeline (sharp): Encode assets directly to AVIF (and necessary fallbacks) on upload prior to CDN storage, keeping runtime operations simple and free from third-party runtime billing.

Edge Resizing API (Cloudflare): Store full-resolution master copies and leverage an edge resizing API (like Cloudflare Image Resizing) to negotiate format, dimensions, and crops on the fly based on the client request.

### Pipeline Strategy
* Primary Format: AVIF
  * Modern browsers get AVIF for maximum compression efficiency and bandwidth savings
* Fallbacks: WebP & JPEG
  * WebP: Serves browsers without native AVIF support
  * JPEG: Retained for RSS feeds, legacy clients, OpenGraph/social meta crawlers, and email newsletters
* Master Asset Retention: Retain high-resolution originals in cold/archival storage for future re-processing or print usage

### Things to Consider
Generate or request images in three standard widths to prevent mobile devices from downloading desktop assets:
* Thumbnail (400px): Author bios, sidebar widgets, related story grids
* Inline (800px): Standard inline story content
* Main Image (1600px): Headers and article cover images

## Alternatives

| Option | Pros | Cons | Thoughts |
| :--- | :--- | :--- | :--- |
| **Edge / CDN Transformations** ([Cloudflare Images](https://www.cloudflare.com/developer-platform/products/images/), [Cloudinary](https://cloudinary.com/)) | Zero server compute, on-the-fly resizing | Usage-based pricing tiers, vendor lock-in | Not cost-effective |
| **Client-side Compression** (Browser Canvas/WASM) | Zero server CPU load, faster uploads | Device-dependent throttling, not secure, inconsistent outputs | We need a reliable server-side source of truth for images. |
| **Legacy MozJPEG Only** | 100% universal compatibility | 25–35% larger payloads than WebP | Less efficient bandwidth and speed on mobile. |

## Trade-offs
* Encoding Overhead vs. Bandwidth: AVIF encoding takes longer than WebP, but delivers superior compression ratios on modern connections

* Dynamic Edge vs. Static Variants: Dynamic edge resizing requires an external API subscription, whereas static pre-generation requires writing multiple files per upload to object storage

## Next Steps
1. Evaluate whether our Cloudflare plan includes Image Resizing quotas, or if we should default to server-side pre-generation
2. Define asset path conventions (e.g., /media/:id/{size}.{avif,webp,jpg})
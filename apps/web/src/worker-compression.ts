/**
 * Cloudflare Workers compression middleware
 * Handles Brotli and Gzip compression for optimal performance
 */

export interface CompressionOptions {
  brotli?: boolean;
  gzip?: boolean;
  minSize?: number;
  excludePatterns?: RegExp[];
}

const DEFAULT_OPTIONS: CompressionOptions = {
  brotli: true,
  gzip: true,
  minSize: 1024, // Don't compress files smaller than 1KB
  excludePatterns: [
    /\.(jpg|jpeg|png|gif|webp|avif|svg|woff|woff2|ttf|otf|eot)$/i, // Already compressed formats
  ],
};

/**
 * Check if the content should be compressed based on headers and file type
 */
function shouldCompress(
  request: Request,
  response: Response,
  options: CompressionOptions
): boolean {
  // Check if response is already compressed
  if (response.headers.get('content-encoding')) {
    return false;
  }

  // Check minimum size
  const contentLength = response.headers.get('content-length');
  if (contentLength && parseInt(contentLength) < (options.minSize || 1024)) {
    return false;
  }

  // Check content type
  const contentType = response.headers.get('content-type') || '';
  const compressibleTypes = [
    'text/',
    'application/javascript',
    'application/json',
    'application/xml',
    'application/xhtml+xml',
    'application/rss+xml',
    'application/atom+xml',
    'application/x-font-ttf',
    'application/x-font-opentype',
    'application/vnd.ms-fontobject',
    'image/svg+xml',
    'image/x-icon',
  ];

  const isCompressible = compressibleTypes.some((type) =>
    contentType.includes(type)
  );

  if (!isCompressible) {
    return false;
  }

  // Check URL against exclude patterns
  const url = new URL(request.url);
  if (options.excludePatterns?.some((pattern) => pattern.test(url.pathname))) {
    return false;
  }

  return true;
}

/**
 * Get accepted encoding from request headers
 */
function getAcceptedEncoding(request: Request): {
  brotli: boolean;
  gzip: boolean;
} {
  const acceptEncoding = request.headers.get('accept-encoding') || '';
  return {
    brotli: acceptEncoding.includes('br'),
    gzip: acceptEncoding.includes('gzip'),
  };
}

/**
 * Compress response body using the appropriate algorithm
 */
async function compressResponse(
  response: Response,
  encoding: 'br' | 'gzip'
): Promise<Response> {
  // Get the response body
  const body = await response.arrayBuffer();

  // Create compression stream
  let stream: CompressionStream;
  if (encoding === 'br') {
    // Note: Brotli compression is not yet available in all Cloudflare Workers environments
    // Fall back to gzip
    stream = new CompressionStream('gzip');
    encoding = 'gzip';
  } else {
    stream = new CompressionStream('gzip');
  }

  // Compress the body
  const writer = stream.writable.getWriter();
  writer.write(body);
  writer.close();

  const compressedBody = await new Response(stream.readable).arrayBuffer();

  // Create new response with compressed body
  const compressedResponse = new Response(compressedBody, {
    status: response.status,
    statusText: response.statusText,
    headers: new Headers(response.headers),
  });

  // Update headers
  compressedResponse.headers.set('content-encoding', encoding);
  compressedResponse.headers.delete('content-length'); // Browser will handle this
  compressedResponse.headers.set('vary', 'accept-encoding');

  return compressedResponse;
}

/**
 * Compression middleware for Cloudflare Workers
 */
export async function compressionMiddleware(
  request: Request,
  response: Response,
  options: CompressionOptions = DEFAULT_OPTIONS
): Promise<Response> {
  // Check if compression should be applied
  if (!shouldCompress(request, response, options)) {
    return response;
  }

  // Get accepted encodings
  const accepted = getAcceptedEncoding(request);

  // Prefer Brotli over Gzip
  if (options.brotli && accepted.brotli) {
    return compressResponse(response, 'br');
  }

  if (options.gzip && accepted.gzip) {
    return compressResponse(response, 'gzip');
  }

  // No compression
  return response;
}

/**
 * Edge function to wrap the application with compression
 */
export function withCompression(
  handler: (request: Request) => Promise<Response>,
  options?: CompressionOptions
) {
  return async (request: Request): Promise<Response> => {
    const response = await handler(request);
    return compressionMiddleware(request, response, options);
  };
}

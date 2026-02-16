const IMAGE_EXTENSIONS_REGEX = /\.(ico|png|jpg|jpeg|svg|webp)$/;

export default {
    async fetch(request, env) {
        try {
            const response = await env.ASSETS.fetch(request);
            const newHeaders = new Headers(response.headers);

            // Security Headers
            newHeaders.set('X-Content-Type-Options', 'nosniff');
            newHeaders.set('X-Frame-Options', 'DENY');
            newHeaders.set('X-XSS-Protection', '1; mode=block');
            newHeaders.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
            newHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
            newHeaders.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

            // Content Security Policy
            newHeaders.set('Content-Security-Policy',
                "default-src 'self'; " +
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
                "font-src https://fonts.gstatic.com; " +
                "img-src 'self' data:; " +
                "script-src 'self'; " +
                "connect-src 'self';"
            );

            // Cache Control based on file type
            const url = new URL(request.url);
            const pathname = url.pathname;

            if (pathname.endsWith('app.js')) {
                // Avoid stale app logic when file name is not versioned.
                newHeaders.set('Cache-Control', 'public, max-age=0, must-revalidate');
            } else if (pathname.endsWith('.css') || pathname.endsWith('.js')) {
                // Long-term caching for static assets
                newHeaders.set('Cache-Control', 'public, max-age=31536000, immutable');
            } else if (pathname.endsWith('.html') || pathname === '/') {
                // Short-term caching for HTML
                newHeaders.set('Cache-Control', 'public, max-age=3600, must-revalidate');
            } else if (pathname.match(IMAGE_EXTENSIONS_REGEX)) {
                // Medium-term caching for images
                newHeaders.set('Cache-Control', 'public, max-age=86400');
            }

            return new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers: newHeaders
            });
        } catch (error) {
            // Error handling
            console.error('Worker error:', error);
            return new Response('Internal Server Error', { status: 500 });
        }
    },
};

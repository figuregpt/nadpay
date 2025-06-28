export async function GET() {
  return new Response(
    JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'nadpay-web',
      uptime: process.uptime(),
      version: process.env.npm_package_version || '0.1.0'
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      },
    }
  );
} 
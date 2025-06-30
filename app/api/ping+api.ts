export function HEAD() {
  return new Response(null, {
    status: 200,
    headers: {
      'Cache-Control': 'no-cache',
    },
  });
}

export function GET() {
  return Response.json({ 
    status: 'alive', 
    timestamp: new Date().toISOString() 
  });
}
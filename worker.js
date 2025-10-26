/**
 * worker.js
 * Cloudflare Worker for handling R2 file uploads and listing.
 */

// Worker Bindings တွင် သတ်မှတ်ထားသော R2 Bucket Variable Name
declare const UPLOAD_BUCKET: R2Bucket; 

// Base URL ကို သတ်မှတ်သည်
const WORKER_BASE_URL = 'https://kp-upload-worker.kopaing232003.workers.dev'; 

// =======================================================
// Main Fetch Handler
// =======================================================
export default {
    async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
        const url = new URL(request.url);
        
        // CORS Headers ကို သတ်မှတ်သည်
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*', 
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Content-Length',
        };

        // OPTIONS Request ကို ကိုင်တွယ်ခြင်း (CORS Preflight)
        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: corsHeaders });
        }
        
        try {
            if (url.pathname === '/upload' && request.method === 'POST') {
                return handleUpload(request, corsHeaders);
            }
            
            if (url.pathname === '/list' && request.method === 'GET') {
                return handleList(request, corsHeaders);
            }

            // တခြား Request များကို ကိုင်တွယ်ခြင်း
            return new Response('{"message": "Welcome to KP R2 Worker. Use /upload or /list."}', {
                status: 200,
                headers: { 'Content-Type': 'application/json', ...corsHeaders },
            });

        } catch (error) {
            // General Error Handling
            console.error('Worker Error:', error.stack || error);
            return new Response(`{"error": "Internal Server Error: ${error.message || 'Unknown'}"}`, {
                status: 500,
                headers: { 'Content-Type': 'application/json', ...corsHeaders },
            });
        }
    },
};

// =======================================================
// A. Upload Handler (R2 သို့ ဖိုင်တင်ခြင်း)
// =======================================================
async function handleUpload(request: Request, corsHeaders: HeadersInit): Promise<Response> {
    const contentType = request.headers.get('content-type');
    
    // Response headers with JSON type
    const jsonHeaders = { 'Content-Type': 'application/json', ...corsHeaders };

    if (!contentType || !contentType.includes('multipart/form-data')) {
        return new Response('{"error": "Missing or Invalid Content-Type header"}', { status: 400, headers: jsonHeaders });
    }

    const formData = await request.formData();
    const file = formData.get('uploadFile') as File | null; 

    if (!file || typeof file === 'string' || file.size === 0) {
        return new Response('{"error": "No file uploaded or file is empty"}', { status: 400, headers: jsonHeaders });
    }

    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const r2Key = `${Date.now()}_${sanitizedFileName}`; 

    try {
        await UPLOAD_BUCKET.put(r2Key, file.stream(), {
            httpMetadata: { contentType: file.type },
        });
        
        const publicUrl = `${WORKER_BASE_URL}/${r2Key}`; 
        
        // Response ကို တိကျသော JSON format ဖြင့် ပြန်ပို့သည်။
        return new Response(JSON.stringify({ 
            message: "Successfully uploaded!",
            key: r2Key,
            url: publicUrl 
        }), {
            status: 200,
            headers: jsonHeaders,
        });

    } catch (r2Error) {
        console.error('R2 API Error during PUT:', r2Error.stack || r2Error);
        return new Response(`{"error": "R2 API Failure: ${r2Error.message || r2Error}"}`, {
            status: 500,
            headers: jsonHeaders,
        });
    }
}


// =======================================================
// B. List Handler (R2 မှ ဖိုင်စာရင်း ရယူခြင်း)
// =======================================================
async function handleList(request: Request, corsHeaders: HeadersInit): Promise<Response> {
    const jsonHeaders = { 'Content-Type': 'application/json', ...corsHeaders };
    try {
        const listedObjects = await UPLOAD_BUCKET.list();
        
        const fileList = listedObjects.objects.map(obj => ({
            key: obj.key,
            size: obj.size,
            uploaded: obj.uploaded.toISOString(),
        }));

        return new Response(JSON.stringify(fileList), {
            status: 200,
            headers: jsonHeaders,
        });

    } catch (r2Error) {
        console.error('R2 API Error during List:', r2Error.stack || r2Error);
        return new Response(`{"error": "R2 API Failure: Cannot list objects"}`, {
            status: 500,
            headers: jsonHeaders,
        });
    }
}

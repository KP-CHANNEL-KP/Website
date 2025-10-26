/**
 * worker.js
 * Cloudflare Worker for handling R2 file uploads and listing.
 */

// ဤနေရာတွင် သင်၏ R2 Bucket Binding Name ကို အတိအကျ သုံးပါ။
// သင်၏ Cloudflare Dashboard, Worker Bindings တွင် သုံးထားသော 'UPLOAD_BUCKET' ဖြစ်သည်
declare const UPLOAD_BUCKET: R2Bucket; 

// Base URL ကို သတ်မှတ်သည် (သင့် Worker ၏ Domain ကို အစားထိုးနိုင်သည်)
const WORKER_BASE_URL = 'https://kp-upload-worker.kopaing232003.workers.dev'; 

// =======================================================
// Main Fetch Handler
// =======================================================
export default {
    async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
        const url = new URL(request.url);
        
        // CORS Headers ကို သတ်မှတ်သည်
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*', // CORS ဖွင့်ထားသည်
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Content-Length',
        };

        // OPTIONS Request ကို ကိုင်တွယ်ခြင်း (CORS Preflight)
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: corsHeaders,
            });
        }
        
        try {
            if (url.pathname === '/upload' && request.method === 'POST') {
                return handleUpload(request, corsHeaders);
            }
            
            if (url.pathname === '/list' && request.method === 'GET') {
                return handleList(request, corsHeaders);
            }

            // တခြား Request များကို ကိုင်တွယ်ခြင်း
            return new Response('Welcome to KP R2 Worker. Use /upload or /list.', {
                status: 200,
                headers: corsHeaders,
            });

        } catch (error) {
            // General Error Handling
            console.error('Worker Error:', error.stack);
            return new Response(`{"error": "Internal Server Error"}`, {
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

    if (!contentType || !contentType.includes('multipart/form-data')) {
        return new Response('{"error": "Missing or Invalid Content-Type header"}', {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
    }

    // FormData ကို parse လုပ်သည်
    const formData = await request.formData();
    // free.html (upload.js) က ပို့လိုက်သော 'uploadFile' ကို ယူသည်
    const file = formData.get('uploadFile') as File | null; 

    if (!file || typeof file === 'string' || file.size === 0) {
        return new Response('{"error": "No file uploaded or file is empty"}', {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
    }

    // ဖိုင်နာမည်ကို သန့်စင်ပြီး Key အဖြစ် သုံးသည်
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const r2Key = `${Date.now()}_${sanitizedFileName}`; // ထပ်မတူစေရန် Time Stamp ထည့်သည်

    try {
        // **ဤနေရာသည် R2 Upload ကို လုပ်ဆောင်သည့် အဓိကနေရာဖြစ်သည်**
        // UPLOAD_BUCKET Binding ကို သုံး၍ put() function ကို ခေါ်သည်
        await UPLOAD_BUCKET.put(r2Key, file.stream(), {
            httpMetadata: {
                contentType: file.type, // File type ကို ထည့်သည်
            },
        });
        
        // အောင်မြင်လျှင် Public URL ကို ပြန်ပို့သည်
        const publicUrl = `${WORKER_BASE_URL}/${r2Key}`; 
        return new Response(`Successfully uploaded! Key: ${r2Key}, URL: ${publicUrl}`, {
            status: 200,
            headers: corsHeaders,
        });

    } catch (r2Error) {
        // R2 API မှ ပြန်လာသော Error ကို ဖမ်းသည်
        console.error('R2 API Error during PUT:', r2Error.stack || r2Error);
        return new Response(`{"error": "R2 API Failure: ${r2Error.message || r2Error}"}`, {
            status: 500, // Status 500 Error ကို ဒီနေရာမှ ပြန်ပို့နိုင်သည်
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
    }
}


// =======================================================
// B. List Handler (R2 မှ ဖိုင်စာရင်း ရယူခြင်း)
// =======================================================
async function handleList(request: Request, corsHeaders: HeadersInit): Promise<Response> {
    try {
        // R2 Bucket မှ ဖိုင်များစာရင်းကို ရယူသည်
        const listedObjects = await UPLOAD_BUCKET.list();
        
        // key, size, uploaded date တို့ကိုသာ ရွေးပြီး ပြန်ပို့သည်
        const fileList = listedObjects.objects.map(obj => ({
            key: obj.key,
            size: obj.size,
            uploaded: obj.uploaded.toISOString(),
        }));

        return new Response(JSON.stringify(fileList), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });

    } catch (r2Error) {
        console.error('R2 API Error during List:', r2Error.stack || r2Error);
        return new Response(`{"error": "R2 API Failure: Cannot list objects"}`, {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
    }
}

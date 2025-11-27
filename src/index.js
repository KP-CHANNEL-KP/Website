// --- src/index.js ---

// Admin Authentication စစ်ဆေးမှု function
function authenticate(request, env) {
    const adminKey = request.headers.get('X-Admin-Key'); // Request Header မှ Key ကိုယူမည်
    if (adminKey !== env.ADMIN_SECRET) {
        return new Response('Unauthorized: Invalid Admin Key.', { status: 401 });
    }
    return null; // Authentication အောင်မြင်ပါက null ပြန်မည်
}

// ----------------------------------------------------
// CRUD လုပ်ဆောင်ချက်များ (Admin/Public)
// ----------------------------------------------------

// 1. POST /notes - မှတ်စုအသစ် ထည့်သွင်းခြင်း (Admin Only)
async function createNote(request, env) {
    const authError = authenticate(request, env);
    if (authError) return authError; // Admin မဟုတ်ရင် 401 ပြန်မည်

    try {
        const newNote = await request.json();
        if (!newNote.title || !newNote.content) {
            return new Response('Title and content are required.', { status: 400 });
        }

        const id = Date.now().toString(); // Unique ID အတွက် Timestamp သုံး
        const key = `note:${id}`;

        const noteData = {
            id: id,
            title: newNote.title,
            content: newNote.content,
            category: newNote.category || 'General',
            createdAt: new Date().toISOString()
        };

        await env.NOTES_KV.put(key, JSON.stringify(noteData));
        
        return new Response(JSON.stringify({ message: 'Note created successfully', id: id }), { 
            status: 201, 
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return new Response('Error creating note: ' + e.message, { status: 500 });
    }
}

// 2. GET /notes - မှတ်စုများ စာရင်းထုတ်ခြင်းနှင့် ရှာဖွေခြင်း (Public)
async function listNotes(request, env) {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search'); // ?search=...
    const categoryFilter = searchParams.get('category'); // ?category=...

    try {
        // KV မှ key အားလုံးကို note: prefix ဖြင့် ရယူခြင်း
        const list = await env.NOTES_KV.list({ prefix: 'note:' });
        const keys = list.keys.map(k => k.name);
        
        // key များဖြင့် data အားလုံးကို တစ်ပြိုင်နက် ဖတ်ခြင်း
        const notesData = await env.NOTES_KV.getMany(keys, 'json');
        let notes = notesData.map(item => item.value).filter(n => n !== null); // null များကို ဖယ်ရှားခြင်း

        // Search and Filter Logic (Worker ဘက်တွင် လုပ်ဆောင်ခြင်း)
        if (search) {
            const query = search.toLowerCase();
            notes = notes.filter(n => 
                n.title.toLowerCase().includes(query) || 
                n.content.toLowerCase().includes(query)
            );
        }

        if (categoryFilter) {
             const filter = categoryFilter.toLowerCase();
             notes = notes.filter(n => n.category && n.category.toLowerCase() === filter);
        }

        // အသစ်ဆုံး မှတ်စုကို အပေါ်ဆုံးတွင် ပြသရန် စီစဉ်ခြင်း
        notes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return new Response(JSON.stringify(notes), { 
            status: 200, 
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return new Response('Error listing notes: ' + e.message, { status: 500 });
    }
}

// 3. PUT /notes/:id - မှတ်စု ပြင်ဆင်ခြင်း (Admin Only)
async function updateNote(request, env, id) {
    const authError = authenticate(request, env);
    if (authError) return authError; 

    try {
        const key = `note:${id}`;
        const existingNote = await env.NOTES_KV.get(key, 'json');

        if (!existingNote) {
            return new Response('Note not found.', { status: 404 });
        }

        const updates = await request.json();
        
        const updatedNote = {
            ...existingNote,
            ...updates, // title, content, category ကို updates ဖြင့် အစားထိုး
            updatedAt: new Date().toISOString()
        };

        await env.NOTES_KV.put(key, JSON.stringify(updatedNote));
        
        return new Response(JSON.stringify({ message: 'Note updated successfully' }), { 
            status: 200, 
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return new Response('Error updating note: ' + e.message, { status: 500 });
    }
}

// 4. DELETE /notes/:id - မှတ်စု ဖျက်ခြင်း (Admin Only)
async function deleteNote(request, env, id) {
    const authError = authenticate(request, env);
    if (authError) return authError;

    try {
        const key = `note:${id}`;
        await env.NOTES_KV.delete(key);
        
        return new Response(JSON.stringify({ message: `Note ${id} deleted successfully` }), { 
            status: 200, 
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return new Response('Error deleting note: ' + e.message, { status: 500 });
    }
}

// ----------------------------------------------------
// Worker Request Handler (Router)
// ----------------------------------------------------

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;
        const method = request.method;
        
        // CORS (Cross-Origin Resource Sharing) Headers
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*', // သင့် website URL ကိုသာ ခွင့်ပြုသင့်သည်
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key',
        };

        // OPTIONS Request ကို ကိုင်တွယ်ခြင်း (Preflight Request)
        if (method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: corsHeaders });
        }
        
        // Router Logic
        if (path === '/notes' || path === '/notes/') {
            if (method === 'GET') {
                return listNotes(request, env);
            }
            if (method === 'POST') {
                return createNote(request, env);
            }
        }
        
        // /notes/:id အတွက် Route
        const match = path.match(/^\/notes\/(\d+)$/);
        if (match) {
            const id = match[1];
            if (method === 'PUT') {
                return updateNote(request, env, id);
            }
            if (method === 'DELETE') {
                return deleteNote(request, env, id);
            }
        }

        return new Response('Not Found', { status: 404 });
    },
};

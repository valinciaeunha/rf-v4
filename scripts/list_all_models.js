const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function listAllModels() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await response.json();
        const modelNames = data.models.map(m => m.name);
        fs.writeFileSync('scripts/all_models.txt', modelNames.join('\n'), 'utf8');
        console.log('All models saved to scripts/all_models.txt');
    } catch (e) {
        console.error(e);
    }
}

listAllModels();

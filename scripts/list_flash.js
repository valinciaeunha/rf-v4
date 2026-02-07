const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function listModels() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await response.json();
        const flashModels = data.models.filter(m => m.name.includes('flash')).map(m => m.name);
        fs.writeFileSync('scripts/flash_models.txt', flashModels.join('\n'), 'utf8');
        console.log('Flash models saved to scripts/flash_models.txt');
    } catch (e) {
        console.error(e);
    }
}

listModels();

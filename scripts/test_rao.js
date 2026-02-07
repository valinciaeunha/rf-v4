async function testRao() {
    try {
        const response = await fetch('https://api.puter.com/v1/rao', {
            method: 'POST',
            headers: {
                'Origin': 'https://puter.com'
            }
        });
        const data = await response.json();
        console.log("RAO Response:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("RAO Error:", e);
    }
}

testRao();

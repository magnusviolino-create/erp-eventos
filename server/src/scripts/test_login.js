async function testLogin() {
    // Assuming backend is on 3001
    const url = 'http://localhost:3001/api/auth/login';
    const body = {
        email: 'magnus.violino@gmail.com',
        password: '123456'
    };

    console.log(`Attempting login to ${url}...`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        console.log('Status:', response.status);
        const data = await response.json();
        console.log('Body:', JSON.stringify(data, null, 2));

        if (response.status === 200 && data.token) {
            console.log('✅ Login SUCCESSFUL via script.');
        } else {
            console.log('❌ Login FAILED via script.');
        }
    } catch (e) {
        console.error('Error during fetch:', e.message);
        console.log('Assuming server might not be running on 3001 or at all.');
    }
}

testLogin();

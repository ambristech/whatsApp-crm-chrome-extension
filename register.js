document.addEventListener('DOMContentLoaded', function() {
    const registerButton = document.getElementById('registerButton');
    const statusDiv = document.getElementById('status');

    registerButton.addEventListener('click', async function() {
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (!name || !email || !password || !confirmPassword) {
            showStatus('Please fill in all fields', 'error');
            return;
        }

        if (password !== confirmPassword) {
            showStatus('Passwords do not match', 'error');
            return;
        }

        try {
            const response = await fetch('http://localhost/3.0/auth.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'register',
                    name: name,
                    email: email,
                    password: password
                })
            });

            const data = await response.json();
            
            if (data.status === 'success') {
                showStatus('Registration successful! Redirecting to login...', 'success');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                showStatus(data.message, 'error');
            }
        } catch (error) {
            showStatus('Error connecting to server', 'error');
        }
    });

    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = type;
    }
}); 
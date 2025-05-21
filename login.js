document.addEventListener('DOMContentLoaded', function() {
    const loginButton = document.getElementById('loginButton');
    const showRegisterLink = document.getElementById('showRegister');
    const statusDiv = document.getElementById('status');

    // Check if user is already logged in
    chrome.storage.local.get(['user'], function(result) {
        if (result.user) {
            window.location.href = 'popup.html';
        }
    });

    loginButton.addEventListener('click', async function() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if (!email || !password) {
            showStatus('Please fill in all fields', 'error');
            return;
        }

        try {
            const response = await fetch('http://localhost/3.0/auth.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'login',
                    email: email,
                    password: password
                })
            });

            const data = await response.json();
            
            if (data.status === 'success') {
                // Store user data
                chrome.storage.local.set({ user: data.user }, function() {
                    showStatus('Login successful!', 'success');
                    setTimeout(() => {
                        window.location.href = 'popup.html';
                    }, 1000);
                });
            } else {
                showStatus(data.message, 'error');
            }
        } catch (error) {
            showStatus('Error connecting to server', 'error');
        }
    });

    showRegisterLink.addEventListener('click', function() {
        window.location.href = 'register.html';
    });

    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = type;
    }
}); 
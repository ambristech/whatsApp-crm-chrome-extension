document.addEventListener('DOMContentLoaded', function() {
  // Check if user is logged in
  chrome.storage.local.get(['user'], function(result) {
    if (!result.user) {
      window.location.href = 'login.html';
      return;
    }
  });

  const fetchContactsBtn = document.getElementById('fetchContacts');
  const contactData = document.getElementById('contactData');
  const messageInput = document.getElementById('message');
  const intervalInput = document.getElementById('interval');
  const startButton = document.getElementById('startButton');
  const statusDiv = document.getElementById('status');
  const logoutButton = document.createElement('button');
  logoutButton.textContent = 'Logout';
  logoutButton.style.marginTop = '10px';
  logoutButton.style.backgroundColor = '#dc3545';
  document.body.appendChild(logoutButton);

  let contacts = [];
  let currentIndex = 0;
  let isSending = false;

  // Add logout functionality
  logoutButton.addEventListener('click', function() {
    chrome.storage.local.remove(['user'], function() {
      window.location.href = 'login.html';
    });
  });

  fetchContactsBtn.addEventListener('click', async function() {
    try {
      const response = await fetch('http://localhost/3.0/api.php');
      const data = await response.json();
      
      if (data.status === 'success') {
        contacts = data.data;
        contactData.value = contacts.map(contact => 
          `${contact.name},${contact.company_name},${contact.phone_number}`
        ).join('\n');
        showStatus('Contacts fetched successfully!', 'success');
      } else {
        showStatus('Error fetching contacts: ' + data.message, 'error');
      }
    } catch (error) {
      showStatus('Error connecting to database: ' + error.message, 'error');
    }
  });

  startButton.addEventListener('click', function() {
    if (isSending) {
      stopSending();
    } else {
      startSending();
    }
  });

  function startSending() {
    if (!messageInput.value.trim()) {
      showStatus('Please enter a message template', 'error');
      return;
    }

    if (contacts.length === 0) {
      showStatus('No contacts available', 'error');
      return;
    }

    isSending = true;
    startButton.textContent = 'Stop Sending';
    currentIndex = 0;
    sendNextMessage();
  }

  function stopSending() {
    isSending = false;
    startButton.textContent = 'Start Sending';
    showStatus('Sending stopped', 'success');
  }

  async function sendNextMessage() {
    if (!isSending || currentIndex >= contacts.length) {
      stopSending();
      return;
    }

    const contact = contacts[currentIndex];
    const message = messageInput.value
      .replace('[Name]', contact.name)
      .replace('[Company]', contact.company_name);

    try {
      // Validate phone number
      if (!isValidPhoneNumber(contact.phone_number)) {
        showStatus(`Skipping invalid number for ${contact.name}`, 'error');
        currentIndex++;
        setTimeout(sendNextMessage, 1000); // Reduced delay for skipped numbers
        return;
      }

      // Get the current active tab
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentTab = tabs[0];

      // Check if we're on WhatsApp Web
      if (!currentTab.url.includes('web.whatsapp.com')) {
        // If not on WhatsApp Web, navigate to it first
        await chrome.tabs.update(currentTab.id, { url: 'https://web.whatsapp.com' });
        // Wait for WhatsApp Web to load
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      // Navigate to the specific chat
      const whatsappUrl = `https://web.whatsapp.com/send?phone=${contact.phone_number}&text=${encodeURIComponent(message)}`;
      await chrome.tabs.update(currentTab.id, { url: whatsappUrl });

      // Wait for the chat to load
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Check if the number is on WhatsApp
      const isNumberValid = await chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        function: () => {
          // Check for "Phone number shared via url is invalid" message
          const invalidNumberMsg = document.querySelector('div[data-testid="invalid-number"]');
          if (invalidNumberMsg) {
            return false;
          }
          return true;
        }
      });

      if (!isNumberValid[0].result) {
        showStatus(`Skipping ${contact.name} - Number not on WhatsApp`, 'error');
        currentIndex++;
        setTimeout(sendNextMessage, 1000); // Reduced delay for skipped numbers
        return;
      }

      // Inject the send message script
      const sendResult = await chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        function: async () => {
          // Wait for the send button to appear
          const maxAttempts = 30;
          let attempts = 0;
          
          while (attempts < maxAttempts) {
            const sendButton = document.querySelector('button[aria-label="Send"]');
            if (sendButton) {
              sendButton.click();
              return true;
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
            attempts++;
          }
          return false;
        }
      });

      if (sendResult[0].result) {
        showStatus(`Message sent to ${contact.name}`, 'success');
      } else {
        showStatus(`Skipping ${contact.name} - Could not send message`, 'error');
      }

      currentIndex++;
      setTimeout(sendNextMessage, intervalInput.value * 1000);
    } catch (error) {
      showStatus(`Error with ${contact.name}: ${error.message}`, 'error');
      currentIndex++;
      setTimeout(sendNextMessage, 1000); // Reduced delay for errors
    }
  }

  function isValidPhoneNumber(phone) {
    // Basic phone number validation
    return phone && phone.length >= 10 && /^[0-9+]+$/.test(phone);
  }

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = type;
  }
}); 
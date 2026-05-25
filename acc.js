// guahh.net/acc.js
if (!window._guahhAccountsInjected) {
    window._guahhAccountsInjected = true;

    // Create the iframe dynamically
    const iframe = document.createElement('iframe');
    iframe.id = 'guahh-auth-iframe';
    // Points to the new HTML file you will create
    iframe.src = 'https://guahh.net/auth.html'; 
    iframe.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; border: none; z-index: 999999; background: transparent; display: none;';
    
    // Add to body once loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => document.body.appendChild(iframe));
    } else {
        document.body.appendChild(iframe);
    }

    // Global function to open the pop-up
    window.openGuahhModal = function() {
        const frame = document.getElementById('guahh-auth-iframe');
        if (frame) {
            frame.style.display = 'block';
            // Tell the iframe to wake up and check for saved logins
            frame.contentWindow.postMessage({ type: 'GUAHH_AUTH_OPEN' }, '*');
        }
    };

    // Listen for API messages from the auth.html iframe
    window.addEventListener('message', (event) => {
        // Close Button Pressed
        if (event.data.type === 'GUAHH_AUTH_CLOSE') {
            document.getElementById('guahh-auth-iframe').style.display = 'none';
        }
        
        // Successful Login/Signup
        if (event.data.type === 'GUAHH_AUTH_SUCCESS') {
            document.getElementById('guahh-auth-iframe').style.display = 'none';
            
            // Save token to the host website so it can make database calls
            localStorage.setItem('_guahh_tk', event.data.token);
            localStorage.setItem('_guahh_uid', event.data.user.userId);
            
            // Notify the website that login is done
            window.dispatchEvent(new CustomEvent('guahh-login-success', { detail: event.data.user }));
        }
    });
}

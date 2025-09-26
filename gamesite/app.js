document.addEventListener('DOMContentLoaded', () => {
    const gameContainer = document.getElementById('game-container');

    // Get the game source from the URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const gameSrc = urlParams.get('game');

    if (gameSrc) {
        // Create an iframe to hold the game
        const iframe = document.createElement('iframe');
        iframe.src = gameSrc;
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';

        // Important: This attribute is necessary to allow the iframe to go fullscreen
        iframe.setAttribute('allowfullscreen', 'true');

        gameContainer.appendChild(iframe);

        // --- Fullscreen Logic ---
        // We need to wait for the iframe to load to avoid errors
        iframe.onload = () => {
            const el = gameContainer; // The element we want to make fullscreen

            // Browser-compatible fullscreen request
            const requestFullscreen = el.requestFullscreen || el.mozRequestFullScreen || el.webkitRequestFullscreen || el.msRequestFullscreen;

            if (requestFullscreen) {
                // Request fullscreen. The .catch() is important to handle cases where the browser blocks it.
                requestFullscreen.call(el).catch(err => {
                    alert(`Could not automatically enter fullscreen mode. Please click the fullscreen button in the game if available.`);
                    console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
                });
            }
        };
    } else {
        gameContainer.innerHTML = '<h1>No game specified!</h1>';
    }
});

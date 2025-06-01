/**
 * Advanced Iframe Bypass System
 * Works with Cloudflare Worker to encode URLs and bypass iframe restrictions
 * Also supports direct iframe embedding for CrazyGames
 */

// Configuration
const WORKER_URL = 'https://classlinkapps.derekter127.workers.dev'; // Cloudflare worker URL
const CRAZYGAMES_DOMAIN = 'games.crazygames.com'; // CrazyGames domain for direct iframe embedding

/**
 * Encodes a URL using the Cloudflare worker
 * @param {string} url - The URL to encode
 * @returns {Promise<string>} - Promise resolving to the encoded URL
 */
async function encodeGameUrl(url) {
    try {
        const response = await fetch(`${WORKER_URL}/encode?url=${encodeURIComponent(url)}`);
        if (!response.ok) {
            throw new Error(`Error encoding URL: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.encoded;
    } catch (error) {
        console.error('Failed to encode URL:', error);
        // Fallback to local encoding if worker is unavailable
        return btoa(url);
    }
}

/**
 * Decodes an encoded URL
 * @param {string} encodedUrl - The encoded URL
 * @returns {string} - The decoded URL
 */
function decodeGameUrl(encodedUrl) {
    try {
        return atob(encodedUrl);
    } catch (error) {
        console.error('Failed to decode URL:', error);
        return '';
    }
}

/**
 * Opens a game in an iframe with advanced bypass
 * @param {string} gameUrl - The URL of the game
 * @param {string} gameTitle - The title of the game
 */
async function openGameWithBypass(gameUrl, gameTitle) {
    try {
        // Create or get the iframe container
        let iframeContainer = document.getElementById('iframe-container');
        if (!iframeContainer) {
            iframeContainer = document.createElement('div');
            iframeContainer.id = 'iframe-container';
            iframeContainer.className = 'iframe-container';
            document.body.appendChild(iframeContainer);
        }

        // Check if this is a CrazyGames URL for direct embedding
        if (gameUrl.includes(CRAZYGAMES_DOMAIN)) {
            // Direct iframe embedding for CrazyGames
            iframeContainer.innerHTML = `
                <div class="iframe-content" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 9999; background: #000;">
                    <iframe src="${gameUrl}" class="game-frame" style="width: 100%; height: 100%; border: none; position: absolute; top: 0; left: 0;" allowfullscreen frameborder="0" sandbox="allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts"></iframe>
                    <button class="close-button" style="position: absolute; top: 10px; right: 10px; z-index: 10000; padding: 8px 16px; background: rgba(0,0,0,0.7); color: white; border: none; border-radius: 4px; cursor: pointer;" onclick="closeGame()">CLOSE</button>
                    <button class="fullscreen-button" style="position: absolute; top: 10px; right: 90px; z-index: 10000; padding: 8px 16px; background: rgba(0,0,0,0.7); color: white; border: none; border-radius: 4px; cursor: pointer;" onclick="toggleFullscreen()">FULLSCREEN</button>
                    <div class="bypass-info" style="position: absolute; bottom: 10px; left: 10px; color: rgba(255,255,255,0.5); font-size: 12px;">Direct CrazyGames Embed</div>
                </div>
            `;
        } else {
            // Use worker proxy for other URLs
            const encodedUrl = await encodeGameUrl(gameUrl);
            
            // Use the new /encoded endpoint for UV-style iframe embedding
            const proxyUrl = `${WORKER_URL}/encoded?encoded=${encodedUrl}`;
            
            iframeContainer.innerHTML = `
                <div class="iframe-content" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 9999; background: #000;">
                    <iframe src="${proxyUrl}" class="game-frame" style="width: 100%; height: 100%; border: none; position: absolute; top: 0; left: 0;" allowfullscreen scrolling="no"></iframe>
                    <button class="close-button" style="position: absolute; top: 10px; right: 10px; z-index: 10000; padding: 8px 16px; background: rgba(0,0,0,0.7); color: white; border: none; border-radius: 4px; cursor: pointer;" onclick="closeGame()">CLOSE</button>
                    <button class="fullscreen-button" style="position: absolute; top: 10px; right: 90px; z-index: 10000; padding: 8px 16px; background: rgba(0,0,0,0.7); color: white; border: none; border-radius: 4px; cursor: pointer;" onclick="toggleFullscreen()">FULLSCREEN</button>
                    <div class="bypass-info" style="position: absolute; bottom: 10px; left: 10px; color: rgba(255,255,255,0.5); font-size: 12px;">UV-Style Bypass Active</div>
                </div>
            `;
        }

        // Show the iframe container
        iframeContainer.style.display = 'block';
        
        // Prevent scrolling on the body when game is open
        document.body.style.overflow = 'hidden';
        
        // Add event listener to prevent arrow keys and WASD from scrolling the page
        window.addEventListener('keydown', preventDefaultForGameKeys);
        
        // Log successful bypass
        console.log(`Game opened: ${gameTitle}`);
        
    } catch (error) {
        console.error('Error in bypass system:', error);
        // Fall back to regular game opening method if bypass fails
        openGame(gameUrl, gameTitle);
    }
}

/**
 * Stores an encoded URL in local storage for later use
 * @param {string} encodedUrl - The encoded URL to store
 * @param {string} gameTitle - The title of the game
 */
function storeEncodedGame(encodedUrl, gameTitle) {
    try {
        const gameData = {
            encoded: encodedUrl,
            title: gameTitle,
            timestamp: Date.now()
        };
        
        // Get existing stored games
        let storedGames = JSON.parse(localStorage.getItem('bypassGames') || '[]');
        
        // Add new game to the list (or update if exists)
        const existingIndex = storedGames.findIndex(game => game.title === gameTitle);
        if (existingIndex >= 0) {
            storedGames[existingIndex] = gameData;
        } else {
            storedGames.push(gameData);
        }
        
        // Limit to last 20 games
        if (storedGames.length > 20) {
            storedGames = storedGames.slice(-20);
        }
        
        // Save back to localStorage
        localStorage.setItem('bypassGames', JSON.stringify(storedGames));
        
        return true;
    } catch (error) {
        console.error('Failed to store encoded game:', error);
        return false;
    }
}

/**
 * Gets the list of stored encoded games
 * @returns {Array} - Array of stored game objects
 */
function getStoredEncodedGames() {
    try {
        return JSON.parse(localStorage.getItem('bypassGames') || '[]');
    } catch (error) {
        console.error('Failed to retrieve stored games:', error);
        return [];
    }
}

/**
 * Tests the connection to the Cloudflare worker
 * @returns {Promise<boolean>} - Promise resolving to true if connection is successful
 */
async function testWorkerConnection() {
    try {
        const response = await fetch(WORKER_URL);
        return response.ok;
    } catch (error) {
        console.error('Worker connection test failed:', error);
        return false;
    }
}

/**
 * Opens a CrazyGames embed using the worker proxy
 * @param {string} gameUrl - The URL of the CrazyGames game
 */
async function openCrazyGamesEmbed(gameUrl) {
    try {
        // Extract the game title from the URL
        const urlObj = new URL(gameUrl);
        const pathParts = urlObj.pathname.split('/');
        let gameTitle = 'CrazyGames';
        
        // Try to extract a meaningful title from the URL
        if (pathParts.length > 0) {
            const lastPart = pathParts[pathParts.length - 1];
            if (lastPart && lastPart !== '') {
                gameTitle = lastPart.replace(/\.[^/.]+$/, '').replace(/-/g, ' ');
                gameTitle = gameTitle.split('/').pop().split('?')[0]; // Remove any query parameters
                gameTitle = gameTitle.charAt(0).toUpperCase() + gameTitle.slice(1); // Capitalize first letter
            }
        }
        
        // Always use the worker proxy for CrazyGames URLs
        const encodedUrl = await encodeGameUrl(gameUrl);
        // Use the new /encoded endpoint for UV-style iframe embedding
        const proxyUrl = `${WORKER_URL}/encoded?encoded=${encodedUrl}`;
        
        // Create or get the iframe container
        let iframeContainer = document.getElementById('iframe-container');
        if (!iframeContainer) {
            iframeContainer = document.createElement('div');
            iframeContainer.id = 'iframe-container';
            iframeContainer.className = 'iframe-container';
            document.body.appendChild(iframeContainer);
        }
        
        iframeContainer.innerHTML = `
            <div class="iframe-content">
                <iframe src="${proxyUrl}" class="game-frame" allowfullscreen sandbox="allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts"></iframe>
                <button class="close-button" onclick="closeGame()">CLOSE</button>
                <button class="fullscreen-button" onclick="toggleFullscreen()">FULLSCREEN</button>
                <div class="bypass-info">CrazyGames Proxy Active</div>
            </div>
        `;
        
        // Show the iframe container
        iframeContainer.style.display = 'block';
        
        // Prevent scrolling on the body when game is open
        document.body.style.overflow = 'hidden';
        
        // Add event listener to prevent arrow keys and WASD from scrolling the page
        window.addEventListener('keydown', preventDefaultForGameKeys);
        
        // Log successful bypass
        console.log(`CrazyGames opened: ${gameTitle}`);
        
        // Store the game for later access
        storeEncodedGame(encodedUrl, gameTitle);
        
    } catch (error) {
        console.error('Error opening CrazyGames embed:', error);
        // Fall back to direct URL opening if proxy fails
        window.open(gameUrl, '_blank');
    }
}

// Export functions for use in the main application
window.iframeBypass = {
    encodeGameUrl,
    decodeGameUrl,
    openGameWithBypass,
    storeEncodedGame,
    getStoredEncodedGames,
    testWorkerConnection,
    openCrazyGamesEmbed,
    preventDefaultForGameKeys: function(e) {
        // Prevent arrow keys and WASD from scrolling
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', ' '].includes(e.key)) {
            e.preventDefault();
        }
    }
};

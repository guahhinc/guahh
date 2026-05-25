<!-- GUAHH ACCOUNTS MODAL SYSTEM -->
<style>
    /* Scope everything to avoid breaking host site styles */
    #guahh-modal-overlay {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background-color: rgba(0,0,0,0.5); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
        display: none; justify-content: center; align-items: center; 
        z-index: 999999; font-family: 'Inter Tight', -apple-system, sans-serif;
    }
    
    #guahh-modal-content {
        background-color: #FFFFFF;
        padding: 30px; border-radius: 16px; width: 90%; max-width: 400px;
        box-shadow: 0 4px 24px rgba(0,0,0,0.15);
        position: relative; text-align: center; color: #333333; overflow: hidden;
    }

    .guahh-close-btn {
        position: absolute; top: 15px; right: 15px; background: none; border: none;
        font-size: 24px; color: #888; cursor: pointer; line-height: 1; padding: 0;
    }

    .guahh-title { font-size: 1.8rem; margin: 0 0 20px 0; font-weight: 700; color: #111; }
    
    .guahh-input {
        width: 100%; margin-bottom: 12px; padding: 12px 14px; border-radius: 8px;
        background: #F5F5F5; color: #333; border: 1px solid #DDDDDD; 
        font-size: 15px; font-family: inherit; box-sizing: border-box;
        transition: border-color 0.2s;
    }
    .guahh-input:focus { outline: none; border-color: #007bff; background: #FFFFFF; }

    .guahh-btn {
        width: 100%; padding: 12px; border: none; border-radius: 8px; cursor: pointer;
        font-weight: 600; transition: all 0.27s ease; font-size: 15px; font-family: inherit;
        touch-action: manipulation; -webkit-user-select: none; user-select: none;
        background-color: #007bff; color: white;
    }
    
    .guahh-btn:disabled { opacity: 0.6; cursor: not-allowed; }

    /* Pop Animation */
    @keyframes guahh-btn-pop {
        0% { transform: scale(1); filter: brightness(1); }
        50% { transform: scale(1.04); filter: brightness(1.15); }
        100% { transform: scale(1); filter: brightness(1); }
    }
    .guahh-btn-pop { animation: guahh-btn-pop 0.35s ease !important; }

    .guahh-link {
        color: #007bff; text-decoration: none; font-size: 14px; 
        font-weight: 500; cursor: pointer; display: inline-block; margin-top: 15px;
    }
    .guahh-link:hover { text-decoration: underline; }

    .guahh-error { color: #D32F2F; font-size: 13px; margin-bottom: 10px; display: none; }

    /* Custom Google-style Loading Spinner */
    .guahh-spinner { width: 40px; height: 40px; animation: g-rotate 2s linear infinite; margin: 0 auto; display: block; }
    .guahh-spinner circle { stroke: #007bff; stroke-width: 4; stroke-dasharray: 1, 200; stroke-dashoffset: 0; animation: g-dash 1.5s ease-in-out infinite; stroke-linecap: round; fill: none; }
    @keyframes g-rotate { 100% { transform: rotate(360deg); } }
    @keyframes g-dash { 0% { stroke-dasharray: 1, 200; stroke-dashoffset: 0; } 50% { stroke-dasharray: 89, 200; stroke-dashoffset: -35px; } 100% { stroke-dasharray: 89, 200; stroke-dashoffset: -124px; } }
</style>

<div id="guahh-modal-overlay">
    <div id="guahh-modal-content">
        <button class="guahh-close-btn" onclick="closeGuahhModal()">&times;</button>
        
        <!-- LOADING VIEW -->
        <div id="guahh-loading-view" style="display: none; padding: 30px 0;">
            <svg class="guahh-spinner" viewBox="25 25 50 50">
                <circle cx="50" cy="50" r="20"></circle>
            </svg>
            <p style="color: #666; margin-top: 20px; font-weight: 500;">Securing session...</p>
        </div>

        <!-- CONTINUE (AUTO-LOGIN) VIEW -->
        <div id="guahh-continue-view" style="display: none;">
            <h2 class="guahh-title">Welcome back</h2>
            <img id="guahh-user-avatar" src="" style="width: 84px; height: 84px; border-radius: 50%; object-fit: cover; border: 3px solid #E0E0E0; margin-bottom: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
            <h3 id="guahh-user-name" style="margin: 0 0 5px 0; font-size: 20px; font-weight: 600; color: #111;"></h3>
            <p id="guahh-user-handle" style="margin: 0 0 20px 0; font-size: 14px; color: #666;"></p>
            
            <button id="guahh-continue-btn" class="guahh-btn">Continue</button>
            <br>
            <a class="guahh-link" onclick="switchGuahhView('login', true)">Not you? Use another account</a>
        </div>

        <!-- LOGIN VIEW -->
        <div id="guahh-login-view" style="display: none;">
            <h2 class="guahh-title">Sign In</h2>
            <div id="guahh-login-error" class="guahh-error"></div>
            
            <input type="text" id="guahh-login-id" class="guahh-input" placeholder="Email or Username" autocomplete="username">
            <input type="password" id="guahh-login-pass" class="guahh-input" placeholder="Password" autocomplete="current-password">
            
            <button id="guahh-login-btn" class="guahh-btn">Log In</button>
            <br>
            <a class="guahh-link" onclick="switchGuahhView('signup')">Create a Guahh Account</a>
        </div>

        <!-- SIGN UP VIEW -->
        <div id="guahh-signup-view" style="display: none;">
            <h2 class="guahh-title">Create Account</h2>
            <div id="guahh-signup-error" class="guahh-error"></div>
            
            <input type="text" id="guahh-signup-first" class="guahh-input" placeholder="First Name">
            <input type="text" id="guahh-signup-user" class="guahh-input" placeholder="Username (Unique)">
            <input type="email" id="guahh-signup-email" class="guahh-input" placeholder="Email Address">
            <input type="password" id="guahh-signup-pass" class="guahh-input" placeholder="Password (Min 6 chars)">
            
            <button id="guahh-signup-btn" class="guahh-btn">Sign Up</button>
            <br>
            <a class="guahh-link" onclick="switchGuahhView('login')">Already have an account? Sign in</a>
        </div>
    </div>
</div>

<script>
// --- SECURITY: IIFE AND OBFUSCATION ---
(() => {
    // Hex encoded AppScript URL (Highly stable, exact same method as Coachbuddy)
    const GUAHH_API_URL = "\x68\x74\x74\x70\x73\x3a\x2f\x2f\x73\x63\x72\x69\x70\x74\x2e\x67\x6f\x6f\x67\x6c\x65\x2e\x63\x6f\x6d\x2f\x6d\x61\x63\x72\x6f\x73\x2f\x73\x2f\x41\x4b\x66\x79\x63\x62\x79\x4b\x45\x69\x6a\x77\x67\x4b\x32\x79\x61\x54\x34\x4d\x4c\x62\x41\x61\x37\x77\x37\x75\x55\x45\x6a\x54\x46\x59\x53\x73\x55\x6d\x63\x4a\x45\x74\x55\x4b\x52\x56\x65\x61\x53\x47\x61\x5f\x74\x6e\x41\x61\x39\x6a\x6c\x79\x6a\x6f\x34\x57\x4b\x4c\x4b\x71\x49\x48\x62\x67\x6e\x67\x2f\x65\x78\x65\x63";
    const GUAHH_VERSION = "0.1";

    // Keys
    const _TK = "_guahh_tk";
    const _UID = "_guahh_uid";

    let cachedUser = null;

    // Make functions globally available for the host site to trigger
    window.openGuahhModal = async function() {
        try {
            document.getElementById('guahh-modal-overlay').style.display = 'flex';
            
            const token = localStorage.getItem(_TK);
            const uid = localStorage.getItem(_UID);

            if (token && uid) {
                window.switchGuahhView('loading');
                const res = await apiGuahhCall('verify_token', { token, userId: uid });
                
                if(res && res.user) {
                    cachedUser = res.user;
                    // Populate Continue screen
                    document.getElementById('guahh-user-avatar').src = cachedUser.profilePicUrl || '';
                    document.getElementById('guahh-user-name').textContent = cachedUser.firstName || 'User';
                    document.getElementById('guahh-user-handle').textContent = `@${cachedUser.username || 'unknown'}`;
                    
                    window.switchGuahhView('continue');
                } else {
                    throw new Error("Invalid session data");
                }
            } else {
                window.switchGuahhView('login');
            }
        } catch (e) {
            console.error("Guahh Auth Error:", e); // Failsafe logging so it doesn't freeze invisibly
            clearAuth();
            window.switchGuahhView('login');
        }
    };

    window.closeGuahhModal = function() {
        document.getElementById('guahh-modal-overlay').style.display = 'none';
        clearGuahhErrors();
    };

    window.switchGuahhView = function(view, forceClearAuth = false) {
        if (forceClearAuth) clearAuth();
        clearGuahhErrors();
        
        ['loading', 'continue', 'login', 'signup'].forEach(v => {
            const el = document.getElementById(`guahh-${v}-view`);
            if (el) el.style.display = v === view ? 'block' : 'none';
        });
    };

    function clearAuth() {
        localStorage.removeItem(_TK);
        localStorage.removeItem(_UID);
        cachedUser = null;
    }

    function showGuahhError(view, msg) {
        const el = document.getElementById(`guahh-${view}-error`);
        if (el) {
            el.textContent = msg;
            el.style.display = 'block';
        }
    }

    function clearGuahhErrors() {
        const loginErr = document.getElementById('guahh-login-error');
        const signupErr = document.getElementById('guahh-signup-error');
        if (loginErr) loginErr.style.display = 'none';
        if (signupErr) signupErr.style.display = 'none';
    }

    // Button Pop Animation listener
    document.getElementById('guahh-modal-overlay').addEventListener('pointerdown', (e) => {
        const btn = e.target.closest('.guahh-btn');
        if (btn && !btn.disabled) {
            btn.classList.remove('guahh-btn-pop'); void btn.offsetWidth; btn.classList.add('guahh-btn-pop');
            setTimeout(() => btn.classList.remove('guahh-btn-pop'), 350);
        }
    });

    // --- SECURE API REQUESTS ---
    async function apiGuahhCall(action, payload = {}) {
        // Anti-devtools screen size check
        const cWidthDiff = window.outerWidth > 0 && (window.outerWidth - window.innerWidth > 200);
        const cHeightDiff = window.outerHeight > 0 && (window.outerHeight - window.innerHeight > 200);
        if (cWidthDiff || cHeightDiff) {
            console.warn("Security Notification: Diagnostic tools detected.");
        }

        payload.action = action;
        payload.version = GUAHH_VERSION;
        
        // Base64 encode the payload
        const encPayload = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));

        const res = await fetch(GUAHH_API_URL, {
            method: 'POST', mode: 'cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: encPayload
        });

        // Response is Base64 encoded to hide it
        const raw = await res.text();
        let data;
        try {
            data = JSON.parse(decodeURIComponent(escape(atob(raw))));
        } catch(err) {
            throw new Error("Server communication error.");
        }
        if (data.result === 'error') throw new Error(data.error);
        return data;
    }

    // --- AUTH ACTIONS ---
    document.getElementById('guahh-continue-btn').onclick = () => {
        // User clicked continue with saved session
        closeGuahhModal();
        window.dispatchEvent(new CustomEvent('guahh-login-success', { detail: cachedUser }));
    };

    document.getElementById('guahh-login-btn').onclick = async () => {
        const identifier = document.getElementById('guahh-login-id').value.trim();
        const password = document.getElementById('guahh-login-pass').value.trim();
        
        if (!identifier || !password) return showGuahhError('login', 'Please fill in all fields.');
        
        const btn = document.getElementById('guahh-login-btn');
        btn.textContent = 'Logging in...'; btn.disabled = true;
        clearGuahhErrors();

        try {
            const res = await apiGuahhCall('login', { identifier, password });
            localStorage.setItem(_TK, res.token);
            localStorage.setItem(_UID, res.user.userId);
            
            closeGuahhModal();
            window.dispatchEvent(new CustomEvent('guahh-login-success', { detail: res.user }));
        } catch (e) {
            showGuahhError('login', e.message);
        } finally {
            btn.textContent = 'Log In'; btn.disabled = false;
        }
    };

    document.getElementById('guahh-signup-btn').onclick = async () => {
        const firstName = document.getElementById('guahh-signup-first').value.trim();
        const username = document.getElementById('guahh-signup-user').value.trim();
        const email = document.getElementById('guahh-signup-email').value.trim();
        const password = document.getElementById('guahh-signup-pass').value.trim();

        if (!firstName || !username || !email || !password) return showGuahhError('signup', 'All fields are required.');
        
        const btn = document.getElementById('guahh-signup-btn');
        btn.textContent = 'Creating account...'; btn.disabled = true;
        clearGuahhErrors();

        try {
            const res = await apiGuahhCall('signup', { firstName, username, email, password });
            localStorage.setItem(_TK, res.token);
            localStorage.setItem(_UID, res.user.userId);
            
            closeGuahhModal();
            window.dispatchEvent(new CustomEvent('guahh-login-success', { detail: res.user }));
        } catch (e) {
            showGuahhError('signup', e.message);
        } finally {
            btn.textContent = 'Sign Up'; btn.disabled = false;
        }
    };
})(); // End of IIFE wrapper
</script>

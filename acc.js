// guahh.net/acc.js
(() => {
    const API_URL = "https://script.google.com/macros/s/AKfycbyKEijwgK2yaT4MLbAa7w7uUEjTFYSsUmcJEtUKRVeaSGa_tnAa9jlyjo4WKLKqIHbgng/exec";
    const GUAHH_VERSION = "0.1";
    const _TK = "_guahh_tk";
    const _UID = "_guahh_uid";
    let cachedUser = null;

    function injectGuahhDOM() {
        if (document.getElementById('guahh-modal-overlay')) return;

        // 1. Inject Styles
        const style = document.createElement('style');
        style.innerHTML = `
            #guahh-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); display: none; justify-content: center; align-items: center; z-index: 999999; font-family: 'Inter Tight', -apple-system, sans-serif; }
            #guahh-modal-content { background-color: #FFFFFF; padding: 30px; border-radius: 16px; width: 90%; max-width: 400px; box-shadow: 0 4px 24px rgba(0,0,0,0.15); position: relative; text-align: center; color: #333333; overflow: hidden; }
            .guahh-close-btn { position: absolute; top: 15px; right: 15px; background: none; border: none; font-size: 24px; color: #888; cursor: pointer; line-height: 1; padding: 0; }
            .guahh-title { font-size: 1.8rem; margin: 0 0 20px 0; font-weight: 700; color: #111; }
            .guahh-input { width: 100%; margin-bottom: 12px; padding: 12px 14px; border-radius: 8px; background: #F5F5F5; color: #333; border: 1px solid #DDDDDD; font-size: 15px; font-family: inherit; box-sizing: border-box; transition: border-color 0.2s; }
            .guahh-input:focus { outline: none; border-color: #007bff; background: #FFFFFF; }
            .guahh-btn { width: 100%; padding: 12px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.27s ease; font-size: 15px; font-family: inherit; touch-action: manipulation; -webkit-user-select: none; user-select: none; background-color: #007bff; color: white; }
            .guahh-btn:disabled { opacity: 0.6; cursor: not-allowed; }
            @keyframes guahh-btn-pop { 0% { transform: scale(1); filter: brightness(1); } 50% { transform: scale(1.04); filter: brightness(1.15); } 100% { transform: scale(1); filter: brightness(1); } }
            .guahh-btn-pop { animation: guahh-btn-pop 0.35s ease !important; }
            .guahh-link { color: #007bff; text-decoration: none; font-size: 14px; font-weight: 500; cursor: pointer; display: inline-block; margin-top: 15px; }
            .guahh-link:hover { text-decoration: underline; }
            .guahh-error { color: #D32F2F; font-size: 13px; margin-bottom: 10px; display: none; }
            .guahh-spinner { width: 40px; height: 40px; animation: g-rotate 2s linear infinite; margin: 0 auto; display: block; }
            .guahh-spinner circle { stroke: #007bff; stroke-width: 4; stroke-dasharray: 1, 200; stroke-dashoffset: 0; animation: g-dash 1.5s ease-in-out infinite; stroke-linecap: round; fill: none; }
            @keyframes g-rotate { 100% { transform: rotate(360deg); } }
            @keyframes g-dash { 0% { stroke-dasharray: 1, 200; stroke-dashoffset: 0; } 50% { stroke-dasharray: 89, 200; stroke-dashoffset: -35px; } 100% { stroke-dasharray: 89, 200; stroke-dashoffset: -124px; } }
        `;
        document.head.appendChild(style);

        // 2. Inject HTML Structure
        const overlay = document.createElement('div');
        overlay.id = 'guahh-modal-overlay';
        overlay.innerHTML = `
            <div id="guahh-modal-content">
                <button class="guahh-close-btn" id="guahh-close-btn">&times;</button>
                
                <div id="guahh-loading-view" style="display: none; padding: 30px 0;">
                    <svg class="guahh-spinner" viewBox="25 25 50 50"><circle cx="50" cy="50" r="20"></circle></svg>
                    <p style="color: #666; margin-top: 20px; font-weight: 500;">Securing session...</p>
                </div>

                <div id="guahh-continue-view" style="display: none;">
                    <h2 class="guahh-title">Welcome back</h2>
                    <img id="guahh-user-avatar" src="" style="width: 84px; height: 84px; border-radius: 50%; object-fit: cover; border: 3px solid #E0E0E0; margin-bottom: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                    <h3 id="guahh-user-name" style="margin: 0 0 5px 0; font-size: 20px; font-weight: 600; color: #111;"></h3>
                    <p id="guahh-user-handle" style="margin: 0 0 20px 0; font-size: 14px; color: #666;"></p>
                    <button id="guahh-continue-btn" class="guahh-btn">Continue</button><br>
                    <a class="guahh-link" id="guahh-not-you-link">Not you? Use another account</a>
                </div>

                <div id="guahh-login-view" style="display: none;">
                    <h2 class="guahh-title">Sign In</h2>
                    <div id="guahh-login-error" class="guahh-error"></div>
                    <input type="text" id="guahh-login-id" class="guahh-input" placeholder="Email or Username" autocomplete="username">
                    <input type="password" id="guahh-login-pass" class="guahh-input" placeholder="Password" autocomplete="current-password">
                    <button id="guahh-login-btn" class="guahh-btn">Log In</button><br>
                    <a class="guahh-link" id="guahh-go-signup">Create a Guahh Account</a>
                </div>

                <div id="guahh-signup-view" style="display: none;">
                    <h2 class="guahh-title">Create Account</h2>
                    <div id="guahh-signup-error" class="guahh-error"></div>
                    <input type="text" id="guahh-signup-first" class="guahh-input" placeholder="First Name">
                    <input type="text" id="guahh-signup-user" class="guahh-input" placeholder="Username (Unique)">
                    <input type="email" id="guahh-signup-email" class="guahh-input" placeholder="Email Address">
                    <input type="password" id="guahh-signup-pass" class="guahh-input" placeholder="Password (Min 6 chars)">
                    <button id="guahh-signup-btn" class="guahh-btn">Sign Up</button><br>
                    <a class="guahh-link" id="guahh-go-login">Already have an account? Sign in</a>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        // 3. Bind Events dynamically
        document.getElementById('guahh-close-btn').onclick = window.closeGuahhModal;
        document.getElementById('guahh-not-you-link').onclick = () => window.switchGuahhView('login', true);
        document.getElementById('guahh-go-signup').onclick = () => window.switchGuahhView('signup');
        document.getElementById('guahh-go-login').onclick = () => window.switchGuahhView('login');
        
        overlay.addEventListener('pointerdown', (e) => {
            const btn = e.target.closest('.guahh-btn');
            if (btn && !btn.disabled) {
                btn.classList.remove('guahh-btn-pop'); void btn.offsetWidth; btn.classList.add('guahh-btn-pop');
                setTimeout(() => btn.classList.remove('guahh-btn-pop'), 350);
            }
        });

        document.getElementById('guahh-continue-btn').onclick = () => {
            window.closeGuahhModal();
            window.dispatchEvent(new CustomEvent('guahh-login-success', { detail: cachedUser }));
        };

        document.getElementById('guahh-login-btn').onclick = async () => {
            const btn = document.getElementById('guahh-login-btn');
            const id = document.getElementById('guahh-login-id').value.trim();
            const pass = document.getElementById('guahh-login-pass').value.trim();
            if (!id || !pass) return showGuahhError('login', 'Please fill in all fields.');
            
            btn.textContent = 'Logging in...'; btn.disabled = true; clearGuahhErrors();
            try {
                const res = await apiGuahhCall('login', { identifier: id, password: pass });
                localStorage.setItem(_TK, res.token); localStorage.setItem(_UID, res.user.userId);
                window.closeGuahhModal();
                window.dispatchEvent(new CustomEvent('guahh-login-success', { detail: res.user }));
            } catch (e) { showGuahhError('login', e.message); } 
            finally { btn.textContent = 'Log In'; btn.disabled = false; }
        };

        document.getElementById('guahh-signup-btn').onclick = async () => {
            const btn = document.getElementById('guahh-signup-btn');
            const first = document.getElementById('guahh-signup-first').value.trim();
            const user = document.getElementById('guahh-signup-user').value.trim();
            const email = document.getElementById('guahh-signup-email').value.trim();
            const pass = document.getElementById('guahh-signup-pass').value.trim();
            if (!first || !user || !email || !pass) return showGuahhError('signup', 'All fields are required.');
            
            btn.textContent = 'Creating account...'; btn.disabled = true; clearGuahhErrors();
            try {
                const res = await apiGuahhCall('signup', { firstName: first, username: user, email, password: pass });
                localStorage.setItem(_TK, res.token); localStorage.setItem(_UID, res.user.userId);
                window.closeGuahhModal();
                window.dispatchEvent(new CustomEvent('guahh-login-success', { detail: res.user }));
            } catch (e) { showGuahhError('signup', e.message); } 
            finally { btn.textContent = 'Sign Up'; btn.disabled = false; }
        };
    }

    async function apiGuahhCall(action, payload = {}) {
        payload.action = action; payload.version = GUAHH_VERSION;
        const res = await fetch(API_URL, {
            method: 'POST', mode: 'cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
        });
        const data = JSON.parse(decodeURIComponent(escape(atob(await res.text()))));
        if (data.result === 'error') throw new Error(data.error);
        return data;
    }

    function showGuahhError(view, msg) {
        const el = document.getElementById(`guahh-${view}-error`);
        if (el) { el.textContent = msg; el.style.display = 'block'; }
    }

    function clearGuahhErrors() {
        const l = document.getElementById('guahh-login-error'); if(l) l.style.display = 'none';
        const s = document.getElementById('guahh-signup-error'); if(s) s.style.display = 'none';
    }

    // --- GLOBAL FUNCTIONS EXPOSED TO HOST WEBSITE ---
    window.openGuahhModal = async function() {
        injectGuahhDOM(); // Builds UI instantly if it doesn't exist
        document.getElementById('guahh-modal-overlay').style.display = 'flex';
        
        const token = localStorage.getItem(_TK);
        const uid = localStorage.getItem(_UID);

        if (token && uid) {
            window.switchGuahhView('loading');
            try {
                const res = await apiGuahhCall('verify_token', { token, userId: uid });
                if(res && res.user) {
                    cachedUser = res.user;
                    document.getElementById('guahh-user-avatar').src = cachedUser.profilePicUrl || `https://api.dicebear.com/9.x/thumbs/svg?seed=${cachedUser.username}`;
                    document.getElementById('guahh-user-name').textContent = cachedUser.firstName || 'User';
                    document.getElementById('guahh-user-handle').textContent = `@${cachedUser.username || 'unknown'}`;
                    window.switchGuahhView('continue');
                } else { throw new Error("Invalid session data"); }
            } catch (e) {
                localStorage.removeItem(_TK); localStorage.removeItem(_UID);
                window.switchGuahhView('login');
            }
        } else {
            window.switchGuahhView('login');
        }
    };

    window.closeGuahhModal = function() {
        const el = document.getElementById('guahh-modal-overlay');
        if (el) el.style.display = 'none';
        clearGuahhErrors();
    };

    window.switchGuahhView = function(view, forceClearAuth = false) {
        if (forceClearAuth) { localStorage.removeItem(_TK); localStorage.removeItem(_UID); cachedUser = null; }
        clearGuahhErrors();
        ['loading', 'continue', 'login', 'signup'].forEach(v => {
            const el = document.getElementById(`guahh-${v}-view`);
            if (el) el.style.display = v === view ? 'block' : 'none';
        });
    };
})();

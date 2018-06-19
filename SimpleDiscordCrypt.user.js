// ==UserScript==
// @name         SimpleDiscordCrypt
// @namespace    https://gitlab.com/An0/SimpleDiscordCrypt
// @version      0.1.0
// @description  I hope people won't start calling this SDC ^_^
// @author       An0
// @license      LGPLv3 - https://www.gnu.org/licenses/lgpl-3.0.txt
// @downloadURL  https://gitlab.com/An0/SimpleDiscordCrypt/raw/master/SimpleDiscordCrypt.user.js
// @updateURL    https://gitlab.com/An0/SimpleDiscordCrypt/raw/master/SimpleDiscordCrypt.meta.js
// @icon         https://gitlab.com/An0/SimpleDiscordCrypt/raw/master/logo.png
// @match        https://discordapp.com/channels/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        unsafeWindow
// @grant        GM_xmlhttpRequest
// @connect      cdn.discordapp.com
// ==/UserScript==

// Credits to the original DiscordCrypt

(function() {

'use strict';

const BaseColor = "#0fc";
const BaseColorInt = 0x00ffcc;

const Style = {
    css: `.sdc * {
	font-family: Whitney,Helvetica Neue,Helvetica,Arial,sans-serif;
	font-size: 16px;
	line-height: 1;
	text-rendering: optimizeLegibility;
	color: #f6f6f7;
	user-select: none;
	display: flex;
	padding: 0;
	margin: 0;
}
.sdc-overlay,.sdc-cover {
	position: fixed;
	left: 0;
	bottom: 0;
	right: 0;
	top: 0;
	z-index: 1000;
	align-items: center;
	justify-content: center;
	pointer-events: none;
}
.sdc-cover {
	background: rgba(0,0,0,.85);
	pointer-events: auto;
}
.sdc-window {
	background-color: #36393f;
	flex-direction: column;
	border-radius: 5px;
	pointer-events: auto;
}
.sdc-window > * { margin: 0 20px }
.sdc-footer {
	margin: 0;
	padding: 20px;
	background-color: #2f3136;
	box-shadow: inset 0 1px 0 rgba(47,49,54,.6);
	border-radius: 0 0 5px 5px;
	justify-content: flex-end;
}
.sdc h4,.sdc h4 * {
	text-transform: uppercase;
	letter-spacing: .3px;
	font-weight: 600;
	line-height: 20px;
}
.sdc h5,.sdc h5 * {
	color: #b9bbbe;
	text-transform: uppercase;
	letter-spacing: .5px;
	font-weight: 600;
	font-size: 12px;
	line-height: 16px;
}
.sdc input {
	background: rgba(0,0,0,.1);
	border: solid 1px rgba(0,0,0,.3);
	border-radius: 3px;
	height: 38px;
	padding: 0 10px;
	outline: 0;
	transition: border .15s ease;
}
.sdc input:focus { border-color: #72dac7 }
.sdc button {
	min-height: 38px;
	border-radius: 3px;
	justify-content: center;
	padding: 2px 16px;
	cursor: pointer;
}
.sdc button,.sdc button * {
	font-size: 14px;
	font-weight: 500;
	line-height: 16px;
}
.sdc-btn {
	border: 0;
	color: #fff;
	background-color: #72dac7;
	transition: background-color .17s ease;
}
.sdc-btn:hover { background-color: #67c4b3 }
.sdc-lnkbtn {
	border: 0;
	color: #fff;
	background-color: rgba(0,0,0,0);
}
.sdc-lnkbtn:hover > * { background-image: linear-gradient(0,transparent,transparent 1px,#fff 0,#fff 2px,transparent 0); }
.sdc-rbtn {
	color: #f04747;
	border: solid 1px rgba(240,71,71,.3);
	transition: border-color .17s ease;
	background-color: rgba(0,0,0,0);
}
.sdc-rbtn:hover { border-color: rgba(240,71,71,.6) }
.sdc-select input {
	width: 17px;
	height: 0;
}
.sdc-select {
	background: rgba(0,0,0,.1);
	border-radius: 4px;
	position: relative;
	transition: border-color .15s ease;
}
.sdc-select:hover { border-color: #040405; }
.sdc-select input::after {
	content: '';
	border-color: #999 transparent transparent;
	border-style: solid;
	border-width: 5px 5px 2.5px;
	position: absolute;
	right: 10px;
	margin-top: -2px;
}
.sdc-select:hover input::after { border-color: #f6f6f7 transparent transparent }
.sdc-select input:checked::after {
	border-color: transparent transparent #f6f6f7;
	border-width: 0 5px 5px;
}
.sdc-select, .sdc-select > div {
	border: solid 1px rgba(0,0,0,.3);
	flex-direction: column;
}
.sdc-select > div {
	background: #303237;
	position: absolute;
	top: 100%;
	width: 100%;
	margin: -1px;
	margin-top: -2px;
	border-radius: 0 0 4px 4px;
	box-shadow: 0 1px 5px rgba(0,0,0,.3);
	z-index: 1;
}
.sdc-select > label,.sdc-select > div > * {
	height: 38px;
	padding: 0 10px;
	align-items: center;
}
.sdc-select > div > a:hover { background: rgba(0,0,0,.1) }

.sdc-tooltip {
	visibility: hidden;
	width: 124px;
	background-color: black;
	font-size: 15px;
	justify-content: center;
	border-radius: 6px;
	padding: 6px 0;
	position: absolute;
	z-index: 1;
	top: 150%;
	left: 50%;
	margin-left: -62px;
}
.sdc-tooltip::after {
	content: '';
	position: absolute;
	bottom: 100%;
	left: 50%;
	margin-left: -5px;
	border-width: 5px;
	border-style: solid;
	border-color: transparent transparent black transparent;
}
:hover > .sdc-tooltip { visibility: visible }`,
    Inject: function() {
        let style = document.createElement('style');
        style.innerHTML = this.css;
        document.head.appendChild(style);
        this.domElement = style;
    },
    Remove: function() {
        if(document.head.contains(this.domElement))
            document.head.removeChild(this.domElement);
    }
};
const UnlockWindow = {
    html: `<div class="sdc">
<div class="SDC_CANCEL sdc-cover"></div>
<div class="sdc-overlay">
	<form class="SDC_UNBLOCK sdc-window" style="min-width: 480px">
		<div style="margin-top:20px">
			<h4>Unlock Database</h4>
		</div>
		<h5 style="margin-top:20px">Password</h5>
		<input class="SDC_PASSWORD" style="margin-top:8px;margin-bottom:20px" type="password" name="sdc-password">
		<div class="sdc-footer"><button type="button" class="SDC_CANCEL sdc-lnkbtn"><p>Cancel</p></button><button type="button" class="SDC_NEWDB sdc-rbtn" style="margin:0 4px">New DB</button><button type="submit" class="sdc-btn" style="min-width:96px">Unlock</button></div>
	</form>
</div>
</div>`,
    Show: function(passwordCallback, newdbCallback, cancelCallback) {
        let wrapper = document.createElement('div');
        wrapper.innerHTML = this.html;
        let self = this;

        Utils.AttachEventToClass(wrapper, 'SDC_UNBLOCK', 'submit', (e) => {
            e.preventDefault();
            self.Remove();
            passwordCallback(wrapper.getElementsByClassName('SDC_PASSWORD')[0].value);
        });
        Utils.AttachEventToClass(wrapper, 'SDC_NEWDB', 'click', () => {
            self.Remove();
            newdbCallback();
        });
        Utils.AttachEventToClass(wrapper, 'SDC_CANCEL', 'click', () => {
            self.Remove();
            if(cancelCallback) cancelCallback();
        });

        document.body.appendChild(wrapper);
        this.domElement = wrapper;
    },
    Remove: function() {
        if(document.body.contains(this.domElement))
            document.body.removeChild(this.domElement);
    }
};
const NewdbWindow = {
    html: `<div class="sdc">
<div class="SDC_CANCEL sdc-cover"></div>
<div class="sdc-overlay">
	<form class="SDC_CREATEDB sdc-window" style="min-width: 480px">
		<div style="margin-top:20px">
			<h4>Create Database</h4>
		</div>
		<h5 style="margin-top:20px">Password <p style="margin-left:5px;opacity:.6">(optional)</p></h5>
		<input class="SDC_PASSWORD" style="margin-top:8px;margin-bottom:20px" type="password" name="sdc-password">
		<div class="sdc-footer"><button type="button" class="SDC_CANCEL sdc-lnkbtn" style="min-width:96px"><p>Cancel</p></button><button type="submit" class="sdc-btn" style="min-width:96px">Create</button></div>
	</form>
</div>
</div>`,
    Show: function(newdbCallback, cancelCallback) {
        let wrapper = document.createElement('div');
        wrapper.innerHTML = this.html;
        let self = this;

        Utils.AttachEventToClass(wrapper, 'SDC_CREATEDB', 'submit', (e) => {
            e.preventDefault();
            self.Remove();
            newdbCallback(wrapper.getElementsByClassName('SDC_PASSWORD')[0].value);
        });
        Utils.AttachEventToClass(wrapper, 'SDC_CANCEL', 'click', () => {
            self.Remove();
            if(cancelCallback) cancelCallback();
        });

        document.body.appendChild(wrapper);
        this.domElement = wrapper;
    },
    Remove: function() {
        if(document.body.contains(this.domElement))
            document.body.removeChild(this.domElement);
    }
};
const MenuBar = {
    menuBarCss: `.SDC_TOGGLE{opacity:.6;fill:#fff;height:24px;cursor:pointer}.SDC_TOGGLE:hover{opacity:.8}`,
    toggleOnButtonHtml: `<div class="sdc" style="position:relative"><svg class="SDC_TOGGLE" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><path d="M18 0c-4.612 0-8.483 3.126-9.639 7.371l3.855 1.052C12.91 5.876 15.233 4 18 4c3.313 0 6 2.687 6 6v10h4V10c0-5.522-4.477-10-10-10z"/><path d="M31 32c0 2.209-1.791 4-4 4H9c-2.209 0-4-1.791-4-4V20c0-2.209 1.791-4 4-4h18c2.209 0 4 1.791 4 4v12z"/></svg><p class="sdc-tooltip">Encrypt Channel</p></div>`,
    toggleOffButtonHtml: `<div class="sdc" style="position:relative"><svg class="SDC_TOGGLE" style="opacity:1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><path d="M18 3C12.477 3 8 7.477 8 13v10h4V13c0-3.313 2.686-6 6-6s6 2.687 6 6v10h4V13c0-5.523-4.477-10-10-10z"/><path d="M31 32c0 2.209-1.791 4-4 4H9c-2.209 0-4-1.791-4-4V20c0-2.209 1.791-4 4-4h18c2.209 0 4 1.791 4 4v12z"/><p class="sdc-tooltip">Disable Encryption</p></svg>`,
    keySelectHtml: `<div class="sdc sdc-select" style="margin-left:5px"><label style="width:200px;height:30px;justify-content:center"><p class="SDC_SELECTED"></p><input class="SDC_DROPDOWN" type="checkbox"></label><div class="SDC_OPTIONS" style="visibility:hidden"></div></div>`,
    toggledOnCss: `.inner-zqa7da{box-shadow:0 0 0 1px ${BaseColor} !important}`,
    Show: function(getToggleStatus, toggle, getCurrentKeyDescriptor, getKeys, selectKey) {
        this.toggledOnStyle = document.createElement('style');
        this.toggledOnStyle.innerHTML = this.toggledOnCss;

        this.menuBarStyle = document.createElement('style');
        this.menuBarStyle.innerHTML = this.menuBarCss;
        document.head.appendChild(this.menuBarStyle);

        this.keySelect = document.createElement('div');
        this.keySelect.innerHTML = this.keySelectHtml;
        let keySelectSelected = this.keySelect.getElementsByClassName('SDC_SELECTED')[0];
        let keySelectDropdown = this.keySelect.getElementsByClassName('SDC_DROPDOWN')[0];
        let keySelectOptions = this.keySelect.getElementsByClassName('SDC_OPTIONS')[0];

        this.toggleOnButton = document.createElement('div');
        this.toggleOnButton.innerHTML = this.toggleOnButtonHtml;
        this.toggleOnButton.onclick = toggle;

        this.toggleOffButton = document.createElement('div');
        this.toggleOffButton.innerHTML = this.toggleOffButtonHtml;
        this.toggleOffButton.onclick = toggle;

        const dropdownOn = () => {
            let keys = getKeys();
            keySelectOptions.innerText = "";

            for(let key of keys) {
                let option = document.createElement('a');
                option.innerText = key.descriptor;
                if(key.selected)
                    option.style.backgroundColor = "rgba(0,0,0,.2)";
                else
                    option.onclick = () => selectKey(key.hash);
                keySelectOptions.appendChild(option);
            };
            keySelectOptions.style.visibility = 'visible';
        };
        const dropdownOff = () => {
            keySelectOptions.style.visibility = 'hidden';
        };
        keySelectDropdown.onclick = () => {
            if(keySelectDropdown.checked) dropdownOn();
            else dropdownOff();
        };
        keySelectDropdown.onblur = () => {
            if(!keySelectDropdown.matches(':active')) {
                keySelectDropdown.checked = false;
                dropdownOff()
            }
        };

        this.Update = function(isRetry) {
            let titleElement = document.body.getElementsByClassName('titleText-3X-zRE')[0];
            if(titleElement == null) {
                if(!isRetry) this.retries = 0;
                if(this.retries < 10) {
                    this.retries++;
                    this.retryTimeout = setTimeout(() => { this.Update(true) }, this.retries * 400);
                }
                return;
            }
            clearTimeout(this.retryTimeout);

            let styleEnabled = document.head.contains(this.toggledOnStyle);
            let keySelectEnabled = document.body.contains(this.keySelect);
            let toggleOnEnabled = document.body.contains(this.toggleOnButton);
            let toggleOffEnabled = document.body.contains(this.toggleOffButton);
            let toggledOn = getToggleStatus();

            keySelectSelected.innerText = getCurrentKeyDescriptor();
            if(!keySelectEnabled) titleElement.insertAdjacentElement('afterend', this.keySelect);

            if(toggledOn) {
                if(!styleEnabled) document.head.appendChild(this.toggledOnStyle);
                if(toggleOnEnabled) this.toggleOnButton.parentNode.removeChild(this.toggleOnButton);
                if(!toggleOffEnabled) titleElement.insertAdjacentElement('afterend', this.toggleOffButton);
            }
            else {
                if(styleEnabled) document.head.removeChild(this.toggledOnStyle);
                if(toggleOffEnabled) this.toggleOffButton.parentNode.removeChild(this.toggleOffButton);
                if(!toggleOnEnabled) titleElement.insertAdjacentElement('afterend', this.toggleOnButton);
            }
        };
        this.Update();
    },
    Remove: function() {
        if(document.head.contains(this.toggledOnStyle))
            document.head.removeChild(this.toggledOnStyle);
        if(document.head.contains(this.menuBarStyle))
            document.head.removeChild(this.menuBarStyle);
        if(document.body.contains(this.toggleOnButton))
            document.body.removeChild(this.toggleOnButton);
        if(document.body.contains(this.toggleOffButton))
            document.body.removeChild(this.toggleOffButton);
    }
};


var Discord;
var Utils;
var DataBase;
var Cache;

function Init(nonInvasive)
{
    Discord = { window: (typeof(unsafeWindow) !== 'undefined') ? unsafeWindow : window };

    if(Discord.window.webpackJsonp == null) { if(!nonInvasive) Utils.Error("Webpack not found."); return 0; }

    const webpackExports = typeof(Discord.window.webpackJsonp) === 'function' ?
          Discord.window.webpackJsonp(
              [],
              { '__extra_id__': (module, _export_, req) => { _export_.default = req } },
              [ '__extra_id__' ]
          ).default :
          Discord.window.webpackJsonp.push( [
              [],
              { '__extra_id__': (_module_, exports, req) => { _module_.exports = req } },
              [ [ '__extra_id__' ] ] ]
          );

    delete webpackExports.m['__extra_id__'];
    delete webpackExports.c['__extra_id__'];

    const findModule = (filter, nonInvasive) => {
        for(let i in webpackExports.c) {
            if(webpackExports.c.hasOwnProperty(i)) {
                let m = webpackExports.c[i].exports;

                if(!m) continue;

                if(m.__esModule && m.default) m = m.default;

                if(filter(m)) return m;
            }
        }

        if (!nonInvasive) {
            Utils.Warn("Couldn't find module in existing cache. Loading all modules.");

            for (let i = 0; i < webpackExports.m.length; i++) {
                try {
                    let m = webpackExports(i);

                    if(!m) continue;

                    if(m.__esModule && m.default) m = m.default;

                    if(filter(m)) return m;
                }
                catch (e) { }
            }

            Utils.Warn("Cannot find module.");
        }

        return null;
    };

    const findModuleByUniqueProperties = (propNames, nonInvasive) => findModule(module => propNames.every(prop => module[prop] !== undefined), nonInvasive);

    let modules = {};

    modules.MessageQueue = findModuleByUniqueProperties([ 'enqueue', 'handleSend', 'handleResponse' ], nonInvasive);
    if(modules.MessageQueue == null) { if(!nonInvasive) Utils.Error("MessageQueue not found."); return 0; }

    modules.MessageDispatcher = findModuleByUniqueProperties( [ 'dispatch', 'maybeDispatch', 'dirtyDispatch' ], nonInvasive);
    if(modules.MessageDispatcher == null) { if(!nonInvasive) Utils.Error("MessageDispatcher not found."); return 0; }

    modules.UserCache = findModuleByUniqueProperties( [ 'getUser', 'getUsers', 'getCurrentUser' ], nonInvasive);
    if(modules.UserCache == null) { if(!nonInvasive) Utils.Error("UserCache not found."); return 0; }

    modules.ChannelCache = findModuleByUniqueProperties( [ 'getChannel', 'getChannels', 'getDMFromUserId' ], nonInvasive);
    if(modules.ChannelCache == null) { if(!nonInvasive) Utils.Error("ChannelCache not found."); return 0; }

    modules.SelectedChannelStore = findModuleByUniqueProperties( [ 'getChannelId', 'getVoiceChannelId', 'getLastSelectedChannelId' ], nonInvasive);
    if(modules.SelectedChannelStore == null) { if(!nonInvasive) Utils.Error("SelectedChannelStore not found."); return 0; }

    modules.GuildCache = findModuleByUniqueProperties( [ 'getGuild', 'getGuilds' ], nonInvasive);
    if(modules.GuildCache == null) { if(!nonInvasive) Utils.Error("GuildCache not found."); return 0; }

    modules.FileUploader = findModuleByUniqueProperties( [ 'upload', 'cancel', 'instantBatchUpload' ], nonInvasive);
    if(modules.FileUploader == null) { if(!nonInvasive) Utils.Error("FileUploader not found."); return 0; }

    modules.PermissionEvaluator = findModuleByUniqueProperties( [ 'can', 'computePermissions', 'canEveryone' ], nonInvasive);
    if(modules.PermissionEvaluator == null) { if(!nonInvasive) Utils.Error("PermissionEvaluator not found."); return 0; }

    modules.RelationshipStore = findModuleByUniqueProperties( [ 'isFriend', 'isBlocked', 'getFriendIDs' ], nonInvasive);
    if(modules.RelationshipStore == null) { if(!nonInvasive) Utils.Error("RelationshipStore not found."); return 0; }

    modules.PrivateChannelManager = findModuleByUniqueProperties( [ 'openPrivateChannel', 'ensurePrivateChannel', 'closePrivateChannel' ], nonInvasive);
    if(modules.PrivateChannelManager == null) { if(!nonInvasive) Utils.Error("PrivateChannelManager not found."); return 0; }

    //modules.MessageCache = findModuleByUniqueProperties([ '_channelMessages', 'getOrCreate', 'clearCache' ], nonInvasive);
    //if(modules.MessageCache == null) { if(!nonInvasive) Utils.Error("MessageCache not found."); return 0; }

    Discord.modules = modules;

    Utils = {
        Log: (message) => { console.log(`%c[SimpleDiscordCrypt] %c${message}`, `color:${BaseColor};font-weight:bold`, "") },
        Warn: (message) => { console.warn(`%c[SimpleDiscordCrypt] %c${message}`, `color:${BaseColor};font-weight:bold`, "") },
        Error: (message) => { console.error(`%c[SimpleDiscordCrypt] %c${message}`, `color:${BaseColor};font-weight:bold`, "") },

        Sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
        ReadFile: (file) => new Promise((resolve, reject) => {
            let fileReader = new FileReader();
            fileReader.onload = () => resolve(fileReader.result);
            fileReader.onerror = () => reject(fileReader.error);
            fileReader.readAsArrayBuffer(file);
        }),
        DownloadFile:
        (typeof(GM_xmlhttpRequest) !== 'undefined') ? (url) => new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "GET",
                url,
                responseType: 'arraybuffer',
                onload: (result) => resolve(result.response),
                onerror: reject
            })
        })
        : (typeof(require) !== 'undefined') ? (url) => new Promise ((resolve, reject) => {
            require('https').get(url, function(response) {
                let data = [];
                response.on('data', (chunk) => data.push(chunk));
                response.on('end', () => resolve(Buffer.concat(data)));
            }).on('error', reject);
        })
        : (url) => new Promise((resolve, reject) => {
            var xhr = new XMLHttpRequest();
            xhr.responseType = 'arraybuffer';
            xhr.onload = () => resolve(xhr.response);
            xhr.onerror = reject;
            xhr.open('GET', url);
            xhr.withCredentials = true;
            xhr.send();
        }),

        GetNonce: (window.BigInt != null) ? () => (BigInt(Date.now() - 14200704e5) << BigInt(22)).toString() : Date.now().toString(),

        Sha512: async (buffer) => await crypto.subtle.digest('SHA-512', buffer),
        Sha512_128: async (buffer) => (await crypto.subtle.digest('SHA-512', buffer)).slice(0, 16),
        Sha512_128str: async function(string) { return await this.Sha512_128(this.StringToUtf8Bytes(string)) },
        Sha512_256: async (buffer) => (await crypto.subtle.digest('SHA-512', buffer)).slice(0, 32),
        Sha512_256str: async function(string) { return await this.Sha512_256(this.StringToUtf8Bytes(string)) },

        AesImportKey: async (buffer) => await crypto.subtle.importKey('raw', buffer, 'AES-CBC', false, ['encrypt','decrypt']),
        AesEncrypt: async function(key, buffer) {
            let initializationVector = this.GetRandomBytes(16);
            let encryptedBuffer = await crypto.subtle.encrypt({name:'AES-CBC', iv:initializationVector}, key, buffer);
            return this.ConcatBuffers([initializationVector, encryptedBuffer]);
        },
        AesDecrypt: async function(key, buffer) {
            let initializationVector = buffer.slice(0, 16);
            let encryptedBuffer = buffer.slice(16);
            return await crypto.subtle.decrypt({name:'AES-CBC', iv:initializationVector}, key, encryptedBuffer);
        },
        AesEncryptString: async function(key, string) {
            let bytes = this.StringToUtf8Bytes(string);
            return await this.AesEncrypt(key, bytes);
        },
        AesDecryptString: async function(key, buffer) {
            let bytes = await this.AesDecrypt(key, buffer);
            return this.Utf8BytesToString(bytes);
        },

        DhGenerateKeys: async () => await crypto.subtle.generateKey({name:'ECDH', namedCurve:'P-521'}, true, ['deriveBits']),
        DhImportPublicKey: async (buffer) => await crypto.subtle.importKey('raw', buffer, {name:'ECDH', namedCurve:'P-521'}, false, []),
        DhImportPrivateKey: async (buffer) => await crypto.subtle.importKey('pkcs8', buffer, {name:'ECDH', namedCurve:'P-521'}, false, ['deriveBits']),
        DhExportPublicKey: async (key) => await crypto.subtle.exportKey('raw', key),
        DhExportPrivateKey: async (key) => await crypto.subtle.exportKey('pkcs8', key),
        DhGetSecret: async (privateKey, publicKey) => await crypto.subtle.deriveBits({name:'ECDH', namedCurve:'P-521', public:publicKey}, privateKey, 256),

        utf8encoder: new TextEncoder(),
        utf8decoder: new TextDecoder(),
        StringToUtf8Bytes: function(string) { return this.utf8encoder.encode(string) },
        StringToAsciiBytes: (string) => Uint8Array.from(string, c => c.charCodeAt(0)),
        StringToUtf16Shorts: (string) => Uint16Array.from(string, c => c.charCodeAt(0)),
        StringToUtf16Bytes: function(string) { return new Uint8Array(this.StringToUtf16Shorts(string).buffer) },
        AsciiBytesToString: (buffer) => String.fromCharCode.apply(null, new Uint8Array(buffer)),
        Utf16ShortsToString: (buffer) => String.fromCharCode.apply(null, new Uint16Array(buffer)),
        Utf8BytesToString: function(buffer) { return this.utf8decoder.decode(buffer) },

        BytesToBase64: (buffer) => btoa(String.fromCharCode.apply(null, new Uint8Array(buffer))),
        Base64ToBytes: (string) => Uint8Array.from(atob(string), c => c.charCodeAt(0)),

        BytesToBase64url: function(buffer) { return this.BytesToBase64(buffer).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_") },
        Base64urlToBytes: function(string) { return this.Base64ToBytes(string.replace(/\-/g, "+").replace(/_/g, "/")) },

        GetRandomBytes: (n) => crypto.getRandomValues(new Uint8Array(n)),
        GetRandomUints: (n) => crypto.getRandomValues(new Uint32Array(n)),

        ConcatBuffers: (buffers) => {
            let newLength = buffers.reduce((len, x) => len + x.byteLength, 0);
            let newBuffer = new Uint8Array(newLength);

            let currentOffset = 0;
            for(let buffer of buffers) {
                newBuffer.set(new Uint8Array(buffer), currentOffset);
                currentOffset += buffer.byteLength;
            };

            return newBuffer;
        },

        PayloadEncode: (buffer) => String.fromCharCode.apply(null, Uint16Array.from(new Uint8Array(buffer), b => b + 0x2800)),
        PayloadDecode: (string) => Uint8Array.from(string, c => c.charCodeAt(0) - 0x2800),

        AttachEventToClass: (rootElement, className, eventName, callback) => {
            let elements = rootElement.getElementsByClassName(className);
            for (let i = 0; i < elements.length; i++)
                elements[i].addEventListener(eventName, callback);
        },

        trimKeyCache: () => {
            let keyHashes = Object.keys(Cache.keys);
            if(keyHashes.length === 200)
            {
                let lastseen = Number.MAX_SAFE_INTEGER;
                let keyToTrim;
                for(let hash of keyHashes) {
                    let key = DataBase.keys[hash];
                    if(key.l < lastseen)
                    {
                        keyToTrim = hash;
                        lastseen = key.l;
                    }
                };
                delete Cache[keyToTrim];
            }
        },
        GetKeyByHash: async function(hashBase64) {
            let keyObj = DataBase.keys[hashBase64];
            if(keyObj == null) return null;
            keyObj.l = Date.now(); //lastseen
            this.dbChanged = true;

            let cachedKey = Cache.keys[hashBase64];
            if(cachedKey != null) return cachedKey;

            let keyBase64 = keyObj.k;
            let keyBytes = this.Base64ToBytes(keyBase64);

            if(DataBase.isEncrypted)
                keyBytes = await this.AesDecrypt(Cache.dbKey, keyBytes);

            let key = await this.AesImportKey(keyBytes)
            this.trimKeyCache();
            Cache.keys[hashBase64] = key;
            return key;
        },
        GetKeyBytesByHash: async function(hashBase64) {
            let keyObj = DataBase.keys[hashBase64];
            if(keyObj == null) return null;
            keyObj.l = Date.now(); //lastseen
            this.dbChanged = true;

            let keyBase64 = keyObj.k;
            let keyBytes = this.Base64ToBytes(keyBase64);

            if(DataBase.isEncrypted)
                keyBytes = await this.AesDecrypt(Cache.dbKey, keyBytes);

            return keyBytes;
        },
        SaveKey: async function(keyBytes, type, descriptor, hidden) {
            let keyObj = { t: type, d: descriptor, r/*registered*/: Date.now(), l/*lastseen*/: Date.now(), h/*hidden*/: (hidden != null) || ((type > 1) ? 1 : 0) };
            let keyHashBase64 = this.BytesToBase64(await this.Sha512_128(keyBytes));

            if(DataBase.isEncrypted)
                keyBytes = await this.AesEncrypt(Cache.dbKey, keyBytes);

            keyObj.k = this.BytesToBase64(keyBytes);
            DataBase.keys[keyHashBase64] = keyObj;
            this.SaveDb();
            return keyHashBase64;
        },

        dbChanged: false,
        LoadDb: function(callback) {
            let dbString = this.storage.getItem('SimpleDiscordCrypt');
            if(dbString && (DataBase = JSON.parse(dbString))) {
                Cache = { keys: {} };

                if(DataBase.isEncrypted) {
                    const newdbCallback = () => { this.NewDb(callback) };
                    const passwordCallback = async (password) => {
                        if(this.BytesToBase64(await this.Sha512_128str(password + DataBase.dbPasswordSalt)) === DataBase.dbPasswordHash)
                        {
                            Cache.dbKey = await this.AesImportKey(await this.Sha512_256str(password + DataBase.dbKeySalt));
                            callback();
                        }
                        else
                            UnlockWindow.Show(passwordCallback, newdbCallback);
                    };

                    UnlockWindow.Show(passwordCallback, newdbCallback);
                }
                else {
                    callback();
                }
            }
            else {
                this.NewDb(callback);
            }
        },
        SaveDb: function() {
            this.dbChanged = false;
            this.storage.setItem('SimpleDiscordCrypt', JSON.stringify(DataBase));
        },
        saveDbTimeout: null,
        FastSaveDb: function() {
            this.dbChanged = true;
            clearTimeout(this.saveDbTimeout);
            setTimeout(() => { if(this.dbChanged) this.SaveDb() }, 10);
        },

        NewDb: function(callback) {
            NewdbWindow.Show((password) => {
                let promise = (async () => {
                    DataBase = { isEncrypted: password !== "", keys: {}, channels: {}, autoKeyExchange: "DM+friends" };
                    Cache = { keys: {} };
                    if(DataBase.isEncrypted)
                    {
                        let salts = this.GetRandomUints(2);
                        DataBase.dbPasswordSalt = salts[0];
                        DataBase.dbKeySalt = salts[1];

                        DataBase.dbPasswordHash = await this.BytesToBase64(await this.Sha512_128str(password + DataBase.dbPasswordSalt));
                        Cache.dbKey = await this.AesImportKey(await this.Sha512_256str(password + DataBase.dbKeySalt));
                    }

                    await this.NewPersonalKey();
                    await this.NewDhKeys();
                })();
                if(callback) promise.then(callback);
            });
        },
        NewDhKeys: async function() {
            let dhKeys = await this.DhGenerateKeys();
            let dhPrivateKeyBytes = await this.DhExportPrivateKey(dhKeys.privateKey);
            let dhPublicKeyBytes = await this.DhExportPublicKey(dhKeys.publicKey);

            if(DataBase.isEncrypted)
                dhPrivateKeyBytes = await this.AesEncrypt(Cache.dbKey, dhPrivateKeyBytes);

            DataBase.dhPrivateKey = this.BytesToBase64(dhPrivateKeyBytes);
            DataBase.dhPublicKey = this.BytesToBase64(dhPublicKeyBytes);
            this.FastSaveDb();
        },
        ChangeKeyDescriptor: function(hash, descriptor) { DataBase.keys[hash].d = descriptor; this.FastSaveDb() },
        ReplaceChannelKeys: function(oldHash, newHash) { Object.values(DataBase.keys).forEach(x => { if(x.k === oldHash) x.k = newHash } ); this.FastSaveDb() },
        NewPersonalKey: async function() {
            if(DataBase.personalKeyHash != null) this.ChangeKeyDescriptor(DataBase.personalKeyHash, "#Your old personal key#");
            let newPersonalKeyHash = await this.SaveKey(this.GetRandomBytes(32), 3/*personal*/, "#Your personal key#");
            this.ReplaceChannelKeys(DataBase.personalKeyHash, newPersonalKeyHash);
            DataBase.personalKeyHash = newPersonalKeyHash;
            this.FastSaveDb();
        },

        FormatDescriptor: (descriptor) => {
            return descriptor.replace(/<@(\d{1,20})>/g, (m, x) => {
                let user = Discord.getUser(x);
                if(user != null) x = user.username;
                return m;
            }).replace(/<#(\d{1,20})>/g, (m, x) => {
                let channel = Discord.getChannel(x);
                if(channel == null) return m;
                if(channel.guild_id == null) return channel.name;
                let guild = Discord.getGuild(channel.guild_id);
                return `${guild.name} #${channel.name}`;
            });
        },

        GetChannelConfig: function(channelId) {
            let channelConfig = DataBase.channels[channelId];
            if(channelConfig != null)
            {
                channelConfig.l = Date.now();
                this.dbChanged = true;
            }
            return channelConfig;
        },
        GetOrCreateChannelConfig: function(channelId) {
            let channelConfig = DataBase.channels[channelId];
            if(channelConfig != null)
            {
                channelConfig.l = Date.now();
                this.dbChanged = true;
                return channelConfig;
            }
            return this.NewChannelConfig(channelId);
        },
        GetCurrentChannelKeyHash: () => {
            return (Cache.channelConfig != null) ? Cache.channelConfig.k : DataBase.personalKeyHash;
        },
        GetCurrentChannelEncrypt: () => {
           return (Cache.channelConfig != null) && Cache.channelConfig.e;
        },
        NewChannelConfig: function(channelId, keyHash, descriptor, encrypt) {
            let channelConfig = { k: keyHash || DataBase.personalKeyHash, e: encrypt ? 1 : 0, l: Date.now() };
            if(descriptor != null) channelConfig.d = descriptor;
            else
            {
                let channel = Discord.getChannel(channelId);
                if(channel == null) channelConfig.d = `<#${channelId}>`;
                else if(channel.type === 1) channelConfig.d = `DM with <@${channel.recipients[0]}>`;
                else channelConfig.d = `<#${channelId}>`;
            }
            DataBase.channels[channelId] = channelConfig;
            this.FastSaveDb();
            return channelConfig;
        },
        ToggleCurrentChannelEncrypt: function() {
            if(Cache.channelConfig == null)
                Cache.channelConfig = this.NewChannelConfig(Cache.channelId, null, null, true);
            else
            {
                Cache.channelConfig.e = Cache.channelConfig.e ? 0 : 1;
                this.dbChanged = true;
            }
        },
        SetCurrentChannelKey: function(hash) {
            if(Cache.channelConfig == null)
                Cache.channelConfig = this.NewChannelConfig(Cache.channelId, hash, null, false);
            else {
                let oldKeyHash = Cache.channelConfig.k;
                if(hash == oldKeyHash) return;
                if(DataBase.keys[oldKeyHash].t/*type*/ === 2/*conversation*/) delete DataBase.keys[oldKeyHash];
                Cache.channelConfig.k = hash;
                this.dbChanged = true;
            }
        },

        SendSystemMessage: function(channelId, sysmsg) {
            Discord.enqueue({
                type: 'send',
                message: {
                    channelId: channelId,
                    nonce: this.GetNonce(),
                    content: "",
                    embed: {
                        type: 'rich',
                        color: BaseColorInt,
                        author: {
                            name: "-----SYSTEM MESSAGE-----",
                            icon_url: "https://i.imgur.com/pFuRfDE.png",
                            url: "http://gitlab.com/An0/SimpleDiscordCrypt"
                        },
                        description: sysmsg,
                        footer: {
                            text: "𝘚𝘪𝘮𝘱𝘭𝘦𝘋𝘪𝘴𝘤𝘰𝘳𝘥𝘊𝘳𝘺𝘱𝘵",
                            icon_url: "https://i.imgur.com/zWXtTpX.png",
                        }
                    }
                }
            }, () => { /*TODO*/ });
        },
        SendPersonalKey: async function(channelId) {
            let channelConfig = this.GetChannelConfig(channelId);
            let keyHash = channelConfig.k;
            if(channelConfig == null || keyHash === DataBase.personalKeyHash) return;

            let keyHashPayload = this.PayloadEncode(this.Base64ToBytes(keyHash));
            let key = this.GetKeyByHash(keyHash);
            let personalKey = this.GetKeyBytesByHash(DataBase.personalKeyHash);
            let personalKeyPayload = this.PayloadEncode(await this.AesEncode(key, personalKey));

            this.SendSystemMessage(channelId, `*key*: \`${keyHashPayload}\`\n*personalKey*: \`${personalKeyPayload}\``);
        },
        InitKeyExchange: async function(userId, auto) {
            if(/friend/i.test(DataBase.autoKeyExchange) && !Discord.isFriend(userId)) {
                //prompt for confirmation
                return;
            }

            let channelId = Discord.getDMFromUserId(userId);
            let channelConfig;
            if(channelId == null) {
                channelId = await Discord.ensurePrivateChannel(Discord.getCurrentUser().id, userId);
            }
            else if(auto) {
                channelConfig = this.GetChannelConfig(channelId);
                if(channelConfig != null && (channelConfig.s/*systemMessageTime*/ > 0 || channelConfig.w/*waitingForSystemMessage*/))
                    return;
            }

            let dhPublicKeyPayload = Utils.PayloadEncode(Utils.Base64ToBytes(DataBase.dhPublicKey));

            Utils.SendSystemMessage(channelId, `*type*: \`DH KEY\`\n*dhKey*: \`${dhPublicKeyPayload}\``);
            channelConfig = channelConfig || Utils.GetOrCreateChannelConfig(channelId);
            channelConfig.w = 1;
            DataBase.dbChanged = true;
        },
        RequestKey: async function(keyHash, userId, auto) {
            if(DataBase.keys[keyHash] != null) return;

            if(/friend/i.test(DataBase.autoKeyExchange) && !Discord.isFriend(userId)) {
                //prompt for confirmation
                return;
            }

            let channelId = Discord.getDMFromUserId(userId);
            if(channelId == null) return;

            let channelConfig;
            if(auto) {
                channelConfig = this.GetChannelConfig(channelId);
                if(channelConfig != null && channelConfig.w/*waitingForSystemMessage*/)
                    return;
            }

            let requestedKeyPayload = Utils.PayloadEncode(Utils.Base64ToBytes(keyHash));

            Utils.SendSystemMessage(channelId, `*type*: \`KEY REQUEST\`\n*requestedKey*: \`${requestedKeyPayload}\``);
            channelConfig = channelConfig || Utils.GetOrCreateChannelConfig(channelId);
            channelConfig.w = 1;
            DataBase.dbChanged = true;
        }
    };
Discord.window.Utils = Utils;
Discord.window.Discord = Discord;

    if(typeof(GM_getValue) !== 'undefined' && typeof(GM_setValue) !== 'undefined')
        Utils.storage = { getItem: GM_getValue, setItem: GM_setValue };
    else
        Utils.storage = window.localStorage;

    if(!window.crypto || !crypto.subtle) { Utils.Error("Crypto API not found."); return -1; }


    const mirrorFunction = (moduleName, functionName) => {
        Discord[`original_${functionName}`] = modules[moduleName][functionName];
        Discord[functionName] = function() { return Discord[`original_${functionName}`].apply(Discord.modules[moduleName], arguments) };
    };

    if(modules.MessageQueue.enqueue == null) { Utils.Error("enqueue() not found."); return -1; }
    mirrorFunction('MessageQueue', 'enqueue');

    if(modules.MessageDispatcher.dispatch == null) { Utils.Error("dispatch() not found."); return -1; }
    mirrorFunction('MessageDispatcher', 'dispatch');

    if(modules.UserCache.getUser == null) { Utils.Error("getUser() not found."); return -1; }
    mirrorFunction('UserCache', 'getUser');
    if(modules.UserCache.getCurrentUser == null) { Utils.Error("getCurrentUser() not found."); return -1; }
    mirrorFunction('UserCache', 'getCurrentUser');

    if(modules.ChannelCache.getChannel == null) { Utils.Error("getChannel() not found."); return -1; }
    mirrorFunction('ChannelCache', 'getChannel');
    if(modules.ChannelCache.getDMFromUserId == null) { Utils.Error("getDMFromUserId() not found."); return -1; }
    mirrorFunction('ChannelCache', 'getDMFromUserId');

    if(modules.SelectedChannelStore.getChannelId == null) { Utils.Error("getChannelId() not found."); return -1; }
    mirrorFunction('SelectedChannelStore', 'getChannelId');

    if(modules.GuildCache.getGuild == null) { Utils.Error("getGuild() not found."); return -1; }
    mirrorFunction('GuildCache', 'getGuild');

    if(modules.FileUploader.upload == null) { Utils.Error("upload() not found."); return -1; }
    mirrorFunction('FileUploader', 'upload');

    if(modules.PermissionEvaluator.can == null) { Utils.Error("can() not found."); return -1; }
    mirrorFunction('PermissionEvaluator', 'can');

    if(modules.RelationshipStore.isFriend == null) { Utils.Error("isFriend() not found."); return -1; }
    mirrorFunction('RelationshipStore', 'isFriend');

    if(modules.PrivateChannelManager.ensurePrivateChannel == null) { Utils.Error("ensurePrivateChannel() not found."); return -1; }
    mirrorFunction('PrivateChannelManager', 'ensurePrivateChannel');

    //if(modules.MessageCache.prototype._merge == null) { Utils.Error("_merge not found."); return -1; }
    //Discord.original__merge = modules.MessageCache.prototype._merge;

    Style.Inject();


    Utils.LoadDb(Load);

    return 1;
}

async function handleMessage(event) {
    await processMessage(event.message);
}
async function handleMessages(event) {
    for(let message of event.messages)
        await processMessage(message);
}
async function handleSearch(event) {
    for(let group of event.messages)
        for(let message of group)
            await processMessage(message);
}

const messageRegex = /^([⠀-⣿]{16,}) `𝘚𝘪𝘮𝘱𝘭𝘦𝘋𝘪𝘴𝘤𝘰𝘳𝘥𝘊𝘳𝘺𝘱𝘵`$/;
const unknownKeyMessage = "```fix\n-----ENCRYPTED MESSAGE WITH UNKNOWN KEY-----\n```";
const invalidMessage = "```diff\n-⁣----ENCRYPTED MESSAGE WITH UNKNOWN FORMAT-----\n```"; //invisible separator after the first '-'
async function processMessage(message) {

    /*setTimeout(() => {
        let embeds = message.embeds;
        embeds.push({type:'rich', description:"#test#"});
        Discord.dispatch({
            type: 'MESSAGE_UPDATE',
            message: {
                id: message.id, channel_id: message.channel_id, guild_id: message.guild_id,
                embeds,
                content: message.content + "???"
            }
        });
    }, 5000);*/


    let match = messageRegex.exec(message.content);
    if(match != null) { //simple messsage
        let key = await decryptMessage(message, match[1]);

        return;
    }

    await processEmbeds(message);
}

const mediaTypes = { 'png': 'img', 'jpg': 'img', 'jpeg': 'img', 'gif': 'img', 'webp': 'img', 'webm': 'video' }
const extensionRegex = /\.([^.]+)$/
async function fixAttachment(attachment, filename, fileBuffer) {
    attachment.filename = filename;
    attachment.size = fileBuffer.byteLength;
    let url = `${URL.createObjectURL(new File([fileBuffer], filename))}#${filename}`;
    attachment.url = url;
    attachment.proxy_url = url;

    let match = extensionRegex.exec(filename);
    if(match == null) return;
    let mediaType = mediaTypes[match[1]];
    if(mediaType == null) return;

    let tmpMedia = document.createElement(mediaType);
    if(mediaType === 'video') { return; //todo: fix if possible
        await (new Promise((resolve) => {
            tmpMedia.onloadedmetadata = resolve;
            tmpMedia.src = url;
        }));
        attachment.width = tmpMedia.videoWidth;
        attachment.height = tmpMedia.videoHeight;
    }
    else {
        await (new Promise((resolve) => {
            tmpMedia.onload = resolve;
            tmpMedia.src = url;
        }));
        attachment.width = tmpMedia.width;
        attachment.height = tmpMedia.height;
    }
}

async function decryptMessage(message, payload) {
    let payloadBuffer = Utils.PayloadDecode(payload).buffer;
    let keyHashBytes = payloadBuffer.slice(0, 16);
    let keyHashBase64 = Utils.BytesToBase64(keyHashBytes);
    let key;
    for(let i = 1;; i++) {
        key = await Utils.GetKeyByHash(keyHashBase64);
        if(key == null) {
            if(i === 1) {
                await Utils.InitKeyExchange(message.author.id, true);
            }
            else if(i === 10) {
                message.content = unknownKeyMessage;
                message.embeds = [];
                message.attachments = [];
                return;
            }
            await Utils.RequestKey(keyHashBase64, message.author.id, true);

            await Utils.Sleep(i * 200);
            continue;
        }
        break;
    }

    message.embeds = []; //remove embeds in case of edit and in case of the payload is from the embed

    if(payloadBuffer.byteLength === 16) {
        message.content = "<:ENC:458236424798470144>⁣"; //invisible separator at the end to make the emoji smaller
    }
    else {
        try {
            let encryptedMessage = payloadBuffer.slice(16);
            message.content = "<:ENC:458236424798470144>" + await Utils.AesDecryptString(key, encryptedMessage);
        }
        catch(e) {
            message.content = invalidMessage;
            message.attachments = [];
            return;
        }
    }

    if(message.attachments == null) return;

    for(let attachment of message.attachments) {
        try {
            let encryptedFilename = Utils.Base64urlToBytes(attachment.filename);
            let filename = await Utils.AesDecryptString(key, encryptedFilename);
            let encryptedFileBuffer = await Utils.DownloadFile(attachment.url);
            let fileBuffer = await Utils.AesDecrypt(key, encryptedFileBuffer);

            await fixAttachment(attachment, filename, fileBuffer);
        }
        catch(e) {
            attachment.filename = "-----ENCRYPTED FILE FAILED TO DECRYPT-----";
        }
    }
}

function getSystemMessageProperty(propertyName, sysmsg) {
    let match = new RegExp(`\\*${propertyName}\\*:\\s*\`(.*?)\``, "i").exec(sysmsg);
    return (match == null) ? null : match[1];
}


const unknownKeySystemMessage = "```fix\n-----SYSTEM MESSAGE WITH UNKNOWN KEY-----\n```";
const invalidSystemMessage = "```diff\n-⁣----SYSTEM MESSAGE WITH UNKNOWN FORMAT-----\n```";
async function processSystemMessage(message, sysmsg) {
    let channel = Discord.getChannel(message.channel_id);
    if(channel.type !== 1/*DM*/) return;
    if(/friend/i.test(DataBase.autoKeyExchange) && !Discord.isFriend(channel.recipients[0])) {
        //prompt for confirmation
        return;
    }

    message.embeds = [];
    let timestamp = new Date(message.timestamp).getTime();
    let channelConfig = Utils.GetOrCreateChannelConfig(message.channel_id);
    let oldMessage = false;
    if(channelConfig.s/*systemMessageTime*/ == null || timestamp > channelConfig.s) {
        channelConfig.s = timestamp;
        Utils.dbChanged = true;
        oldMessage = true;
    }

    switch(getSystemMessageProperty('type', sysmsg)) {
        case 'DH KEY': {
            message.content = "💻 H-hi I would like to know you better";
            if(oldMessage || message.author.id === Discord.getCurrentUser().id) return;

            let dhKeyPayload = getSystemMessageProperty('dhKey', sysmsg);
            if(dhKeyPayload == null) break;
            try {
                let dhRemoteKeyBytes = Utils.PayloadDecrypt(dhKeyPayload);
                let dhRemoteKey = await Utils.DhImportPublicKey(dhRemoteKeyBytes);

                let dhPrivateKeyBytes = Utils.Base64ToBytes(DataBase.dhPrivateKey);
                if(DataBase.isEncrypted)
                    dhPrivateKeyBytes = await Utils.AesDecrypt(Cache.dbKey, dhPrivateKeyBytes);
                let dhPrivateKey = await Utils.DhImportPrivateKey(dhPrivateKeyBytes);

                let sharedSecret = await Utils.DhGetSecret(dhPrivateKey, dhRemoteKey);
                let keyHash = await Utils.SaveKey(sharedSecret, 2/*conversation*/, `Conversation key with <@${message.author.id}>`);
                channelConfig.k/*keyHash*/ = keyHash;

                let dhPublicKeyPayload = Utils.PayloadEncode(Utils.Base64ToBytes(DataBase.dhPublicKey));

                let key = await Utils.AesImportKey(sharedSecret);

                let encryptedPersonalKey = await Utils.AesEncrypt(key, await Utils.GetKeyBytesByHash(DataBase.personalKeyHash));
                let personalKeyPayload = Utils.PayloadEncode(encryptedPersonalKey);

                Utils.SendSystemMessage(message.channel_id, `*type*: \`DH RESPONSE\`\n*dhKey*: \`${dhPublicKeyPayload}\`\n*personalKey*: \`${personalKeyPayload}\``);

                channelConfig.w = 1; //waitingForSystemMessage
                Utils.dbChanged = true;
            }
            catch(e) { break }
        } return;
        case 'DH RESPONSE': {
            message.content = "💻 I like you :3, you can have my number";
            if(oldMessage || message.author.id === Discord.getCurrentUser().id) return;

            let dhKeyPayload = getSystemMessageProperty('dhKey', sysmsg);
            if(dhKeyPayload == null) break;
            let remotePersonalKeyPayload = getSystemMessageProperty('personalKey', sysmsg);
            if(remotePersonalKeyPayload == null) break;
            try {
                let dhRemoteKeyBytes = Utils.PayloadDecrypt(dhKeyPayload);
                let dhRemoteKey = await Utils.DhImportPublicKey(dhRemoteKeyBytes);

                let dhPrivateKeyBytes = Utils.Base64ToBytes(DataBase.dhPrivateKey);
                if(DataBase.isEncrypted)
                    dhPrivateKeyBytes = await Utils.AesDecrypt(Cache.dbKey, dhPrivateKeyBytes);
                let dhPrivateKey = await Utils.DhImportPrivateKey(dhPrivateKeyBytes);

                let sharedSecret = await Utils.DhGetSecret(dhPrivateKey, dhRemoteKey);
                let keyHash = await Utils.SaveKey(sharedSecret, 2/*conversation*/, `Conversation key with <@${message.author.id}>`);
                channelConfig.k/*keyHash*/ = keyHash;
                Utils.dbChanged = true;
                if(message.channel_id == Cache.channelId) MenuBar.Update();

                let key = await Utils.AesImportKey(sharedSecret);

                let remotePersonalKey = Utils.AesDecrypt(key, Utils.PayloadDecode(remotePersonalKeyPayload));
                if(remotePersonalKey.byteLength != 32) break;
                await Utils.SaveKey(remotePersonalKey, 3/*personal*/, `<@${message.author.id}>'s personal key`);

                await Utils.SendPersonalKey(message.channel_id);
            }
            catch(e) { break }
        } return;
        case 'PERSONAL KEY': {
            message.content = "💻 Here is my number, now we can talk any time!!";
            if(oldMessage || message.author.id === Discord.getCurrentUser().id) return;

            let keyHashPayload = getSystemMessageProperty('key', sysmsg);
            if(keyHashPayload == null) break;
            let remotePersonalKeyPayload = getSystemMessageProperty('personalKey', sysmsg);
            if(remotePersonalKeyPayload == null) break;
            try {
                let keyHash = Utils.BytesToBase64(Utils.PayloadDecrypt(keyHashPayload));
                let key = Utils.GetKeyByHash(keyHash);
                if(key == null) {
                    message.content = unknownKeySystemMessage;
                    return;
                }

                let remotePersonalKey = Utils.AesDecrypt(key, Utils.PayloadDecode(remotePersonalKeyPayload));
                if(remotePersonalKey.byteLength != 32) break;
                await Utils.SaveKey(remotePersonalKey, 3/*personal*/, `<@${message.author.id}>'s personal key`);

                delete channelConfig.w; //waitingForSystemMessage
                Utils.dbChanged = true;
            }
            catch(e) { break }
        } return;
    }
    message.content = invalidSystemMessage;
}

const descriptionRegex = /^[⠀-⣿]{33,}$/;
async function processEmbeds(message) {
    if(message.embeds.length !== 1) return;
    let embed = message.embeds[0];
    if(embed.footer == null || embed.footer.text !== "𝘚𝘪𝘮𝘱𝘭𝘦𝘋𝘪𝘴𝘤𝘰𝘳𝘥𝘊𝘳𝘺𝘱𝘵") return;

    if(embed.author == null) return;

    if(embed.author.name === "-----ENCRYPTED MESSAGE-----") {
        if(!descriptionRegex.test(embed.description)) return;
        await decryptMessage(message, embed.description);
    }
    else if(embed.author.name === "-----SYSTEM MESSAGE-----") {
        processSystemMessage(message);
    }
}

/*async function handleMessageUpdate(event) {
    if(event.message.edited_timestamp != null) return;

    await processEmbeds(event.message);
}*/

async function handleChannelSelect(event) {
    let channelId = event.channelId;
    if(channelId != null) {
        Cache.channelId = channelId;
        Cache.channelConfig = Utils.GetChannelConfig(channelId);

        MenuBar.Update();
    }
}

const prefixRegex = /^(?::ENC:|<:ENC:\d{1,20}>)\s*/;
async function handleSend(channelId, message, forceSimple) {
    let channelConfig = Utils.GetChannelConfig(channelId);
    let content = message.content;
    let prefixMatch = prefixRegex.exec(content);
    if(channelConfig == null) return null;
    if(prefixMatch != null) content = content.substring(prefixMatch[0].length);
    else if(!channelConfig.e) return null;

    let key = await Utils.GetKeyByHash(channelConfig.k);
    let keyHashBytes = Utils.Base64ToBytes(channelConfig.k);
    let messageBytes;
    if(content != "")
    {
        let encryptedMessage = await Utils.AesEncryptString(key, content);
        messageBytes = Utils.ConcatBuffers([keyHashBytes, encryptedMessage]);
    }
    else messageBytes = keyHashBytes;

    let payload = Utils.PayloadEncode(messageBytes);

    let channel = Discord.getChannel(channelId);
    if(forceSimple || (channel.type === 0 && !Discord.can(0x4000/*EMBED_LINKS*/, Discord.getCurrentUser(), channel))) {
       message.content = payload + " `𝘚𝘪𝘮𝘱𝘭𝘦𝘋𝘪𝘴𝘤𝘰𝘳𝘥𝘊𝘳𝘺𝘱𝘵`";
    }
    else {
        message.content = "";
        message.embed = {
            type: 'rich',
            color: BaseColorInt,
            author: {
                name: "-----ENCRYPTED MESSAGE-----",
                icon_url: "https://i.imgur.com/pFuRfDE.png",
                url: "http://gitlab.com/An0/SimpleDiscordCrypt"
            },
            description: payload,
            footer: {
                text: "𝘚𝘪𝘮𝘱𝘭𝘦𝘋𝘪𝘴𝘤𝘰𝘳𝘥𝘊𝘳𝘺𝘱𝘵",
                icon_url: "https://i.imgur.com/zWXtTpX.png",
            }
        };
    }
    return key;
}

async function handleUpload(channelId, file, message) {
    let key = await handleSend(channelId, message, true);
    if(key == null) return file;

    try {
        let encryptedFilename = Utils.BytesToBase64url(await Utils.AesEncryptString(key, file.name));
        let fileBuffer = await Utils.ReadFile(file);
        let encryptedBuffer = await Utils.AesEncrypt(key, fileBuffer);
        return new File([encryptedBuffer], encryptedFilename);
    }
    catch(e) {
        return file;
    }
}

const eventHandlers = {
    'CHANNEL_SELECT': handleChannelSelect,
    'LOAD_MESSAGES_SUCCESS': handleMessages,
    //'LOAD_MESSAGES_SUCCESS_CACHED': handleMessages,
    'LOAD_MESSAGES_AROUND_SUCCESS': handleMessages,
    'LOAD_PINNED_MESSAGES_SUCCESS': handleMessages,
    'LOAD_RECENT_MENTIONS_SUCCESS': handleMessages,
    'SEARCH_FINISH': handleSearch,
    'MESSAGE_CREATE': handleMessage,
    'MESSAGE_UPDATE': handleMessage
}

var dbSaveInterval;
function Load()
{
    let modules = Discord.modules;

    Cache.channelId = Discord.getChannelId();
    Cache.channelConfig = DataBase.channels[Cache.channelId];
    if(Cache.channelConfig != null) Cache.channelConfig.l = Date.now();

    modules.MessageQueue.enqueue = function(packet){(async function(){

        await handleSend(packet.message.channelId, packet.message, packet.type === 'edit');

        Discord.original_enqueue.apply(this, arguments);
    }).apply(this, arguments)};

    modules.MessageDispatcher.dispatch = function(event){(async function(){
        let handler = eventHandlers[event.type];
        if(handler) await handler(event);

        Discord.original_dispatch.apply(this, arguments);
    }).apply(this, arguments)};

    modules.FileUploader.upload = function(channelId, file, message){(async function(){

        arguments[1] = await handleUpload(channelId, file, message);

        Discord.original_upload.apply(this, arguments);
    }).apply(this, arguments)};

    /*modules.MessageCache.prototype._merge = function(messages) {
        console.log(messages);

        messages.forEach((message) => {
            if(message.state !== "SENT") return;
            //message.contentParsed = null;
        });

        Discord.original__merge.apply(this, arguments);
    };*/

    MenuBar.Show(() => Utils.GetCurrentChannelEncrypt(),
                 () => { Utils.ToggleCurrentChannelEncrypt(); MenuBar.Update() },
                 () => Utils.FormatDescriptor(DataBase.keys[Utils.GetCurrentChannelKeyHash()].d),
                 () => {
        let keys = [];
        let currentKeyHash;
        if(Cache.channelConfig != null)
        {
            currentKeyHash = Cache.channelConfig.k;
            let currentKeyObj = DataBase.keys[currentKeyHash];
            if(currentKeyObj.t/*type*/ === 2/*conversation*/)
                keys.push({ hash: currentKeyHash, descriptor: Utils.FormatDescriptor(currentKeyObj.d), selected: true });
        }

        keys.push({hash: DataBase.personalKeyHash,
                   descriptor: Utils.FormatDescriptor(DataBase.keys[DataBase.personalKeyHash].d),
                   selected: (currentKeyHash == null) || (DataBase.personalKeyHash === currentKeyHash)});

        Object.entries(DataBase.keys)
            .filter(([,x]) => x.t/*type*/ === 1/*group*/ && !x.h/*hidden*/)
            .sort(([,a], [,b]) => b.l - a.l)
            .forEach(([hash, keyObj]) => keys.push({ hash, descriptor: Utils.FormatDescriptor(keyObj.d), selected: hash === currentKeyHash }));

        return keys;
    },
                 (keyHash) => Utils.SetCurrentChannelKey(keyHash));

    dbSaveInterval = setInterval(() => { if(Utils.dbChanged) Utils.SaveDb() }, 10000);

    Utils.Log("loaded");
}

function Unload()
{
    const restoreFunction = (moduleName, functionName) => { let module = Discord.modules[moduleName]; module[functionName] = module[`original_${functionName}`]; };

    restoreFunction('MessageQueue', 'enqueue');
    restoreFunction('MessageDispatcher', 'dispatch');
    restoreFunction('FileUploader', 'upload');

    //Discord.MessageCache.prototype._merge = Discord.original__merge;

    Style.Remove();
    UnlockWindow.Remove();
    NewdbWindow.Remove();

    clearInterval(dbSaveInterval);
}

function TryInit()
{
    if(Init(true) !== 0) return;

    window.setTimeout(TryInit, 100);
};


//window.addEventListener('load', TryInit);
TryInit();

})();
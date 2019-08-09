// ==UserScript==
// @name         SimpleDiscordCrypt
// @namespace    https://gitlab.com/An0/SimpleDiscordCrypt
// @version      1.2.3
// @description  I hope people won't start calling this SDC ^_^
// @author       An0
// @license      LGPLv3 - https://www.gnu.org/licenses/lgpl-3.0.txt
// @downloadURL  https://gitlab.com/An0/SimpleDiscordCrypt/raw/master/SimpleDiscordCrypt.user.js
// @updateURL    https://gitlab.com/An0/SimpleDiscordCrypt/raw/master/SimpleDiscordCrypt.meta.js
// @icon         https://gitlab.com/An0/SimpleDiscordCrypt/raw/master/logo.png
// @match        https://discordapp.com/channels/*
// @match        https://discordapp.com/activity
// @match        https://ptb.discordapp.com/channels/*
// @match        https://ptb.discordapp.com/activity
// @match        https://canary.discordapp.com/channels/*
// @match        https://canary.discordapp.com/activity
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        unsafeWindow
// @grant        GM_xmlhttpRequest
// @connect      cdn.discordapp.com
// @connect      gitlab.com
// ==/UserScript==

// Credits to the original DiscordCrypt

(function() {

'use strict';

const BlacklistUrl = "https://gitlab.com/An0/SimpleDiscordCrypt/raw/master/blacklist.txt";

const SavedLocalStorage = (typeof(localStorage) !== 'undefined') ? localStorage : null;
const FixedCsp = (typeof(CspDisarmed) !== 'undefined') ? CspDisarmed : false;

const BaseColor = "#0fc";
const BaseColorInt = 0x00ffcc;

const htmlEscapeCharacters = { "<": "&lt;", ">": "&gt;", "&": "&amp;" };
function HtmlEscape(string) { return string.replace(/[<>&]/g, x => htmlEscapeCharacters[x]) }

const Style = {
    css: `
/*fixes*/
.title-3qD0b-, .children-19S4PO { overflow: visible !important }
.status-1XNdyw { margin-left: 10px }
/*style*/
.sdc * {
    font-family: Whitney,Helvetica Neue,Helvetica,Arial,sans-serif;
    font-size: 16px;
    font-weight: normal;
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
    position: relative;
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
    background-color: transparent;
}
.sdc-lnkbtn:hover > * { background-image: linear-gradient(0,transparent,transparent 1px,#fff 0,#fff 2px,transparent 0); }
.sdc-rbtn {
    color: #f04747;
    border: solid 1px rgba(240,71,71,.3);
    transition: border-color .17s ease;
    background-color: transparent;
}
.sdc-rbtn:hover { border-color: rgba(240,71,71,.6) }
.sdc-rbtn:disabled {
    color: #8b8181;
    border-color: rgba(130,126,126,.6);
    cursor: default;
}
.sdc-wbtn {
    color: #f6f6f7;
    border: solid 1px rgba(240,240,242,.3);
    transition: border-color .17s ease;
    background-color: transparent;
}
.sdc-wbtn:hover { border-color: rgba(240,240,242,.6) }
.sdc-wbtn:disabled {
    color: #a6a6a7;
    border-color: rgba(126,126,126,.6);
    cursor: default;
}
.sdc-select {
    background: rgba(0,0,0,.1);
    border-radius: 4px;
    position: relative;
    transition: border-color .15s ease;
}
.sdc-select:hover { border-color: #040405; }
.sdc-select input + * {
    margin-right: 17px;
    width: 100%;
    align-items: center;
}
.sdc-select input + *::after {
    content: '';
    border-color: #999 transparent transparent;
    border-style: solid;
    border-width: 5px 5px 2.5px;
    position: absolute;
    right: 10px;
    margin-top: 2px;
}
.sdc-select:hover input + *::after { border-color: #f6f6f7 transparent transparent }
.sdc-select input:checked + *::after {
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
:hover > .sdc-tooltip { visibility: visible }

.sdc-menu {
    position: fixed;
    min-width: 170px;
    z-index: 1005;
    border-radius: 5px;
    background: #282b30;
    box-shadow: 0 0 1px rgba(0,0,0,.82), 0 1px 4px rgba(0,0,0,.1);
}
.sdc-menu a {
    font-size: 13px;
    font-weight: 500;
    line-height: 16px;
    margin: 2px 0;
    padding: 6px 10px;
    overflow: hidden;
    color: #fff;
    opacity: .6;
    border-radius: 5px;

    transition: none;
    cursor: default;
}
.sdc-menu a:hover {
    background: #25282d;
    opacity: 1;
}
.sdc-menu > div {
    border-bottom: solid 1px hsla(0,0%,96%,.08);
    flex-direction: column;
}
.sdc-menu > div:last-child { border: 0 }
.sdc-hidden {
    width: 0;
    height: 0;
    padding: 0;
    border: 0;
    overflow: hidden;
    outline: 0;
    margin: 0;
}
.sdc-scroll {
    display: block;
    overflow-x: hidden;
    overflow-y: auto;
    margin: 0;
    padding: 0 12px 0 20px;
}
.sdc-scroll::-webkit-scrollbar {
    width: 8px;
}
.sdc-scroll::-webkit-scrollbar-thumb {
    background-color: rgba(32,34,37,.6);
    border: 2px solid transparent;
    border-radius: 4px;
    background-clip: padding-box;
}
.sdc-list { flex-direction: column }
.sdc-list > div {
    border: solid 1px rgba(32,34,37,.6);
    border-radius: 5px;
    margin: 4px 0;
}
.sdc-list > div:hover {
    background-color: rgba(32,34,37,.1);
}
.sdc-list > div > div:first-child {
    margin-right: auto;
    padding: 12px 0 8px 20px;
    flex-direction: column;
}
.sdc-list h6 {
    font-weight: 600;
    line-height: 20px;
    word-break: break-all; /*FF*/
    word-break: break-word;
    max-width: 400px;
}
.sdc-list p {
    line-height: 16px;
    font-size: 12px;
    font-weight: 400;
    color: #b9bbbe;
}
.sdc-edit {
    background: url('data:image/svg+xml;utf8,%3Csvg xmlns="http://www.w3.org/2000/svg" fill="%23F6F6F7" viewBox="0 0 36 36"%3E%3Cpath d="M1,35.9L8.2,35l7-9l-5-5l-9,7l-0.9,7.1L3.4,32c-0.2-0.3-0.3-0.6-0.3-1c0-1.1,0.9-2,2-2s2,0.9,2,2s-0.9,2-2,2c-0.4,0-0.7-0.1-1-0.3L1,35.9z"/%3E%3Cpath d="M9.5,18.3l13-13c0,0,0,0,0,0c0,0,0.6-0.6,0.8-0.8l3.4-3.4l0,0c1.2-1.1,3-1.1,4.1,0L35,5.3c1.1,1.1,1.1,3,0,4.1l0,0l0,0c0,0,0,0,0,0l-4.2,4.2c0,0,0,0,0,0l-13,13c-1.1,1.2-3,1.2-4.2,0l-4.2-4.2C8.4,21.3,8.4,19.5,9.5,18.3z"/%3E%3C/svg>');
    background-size: cover;
    width: 20px;
    height: 20px;
    cursor: pointer;
    margin: -2px 0 0 6px;
    opacity: .6;
}
.sdc-edit:hover { opacity: 1 }
.sdc-listbox {
    width: 76px;
    align-items: center;
    justify-content: center;
}
.sdc-listbox::before {
    content: '';
    width: 1px;
    height: 30px;
    background: rgba(32,34,37,.5);
}
.sdc-listbox > * { margin: auto }
.sdc-listcheckbox > label { height: 24px }
.sdc-listcheckbox input + *::after {
    content: '';
    border: solid 1px #62666d;
    border-radius: 3px;
    width: 24px;
    box-sizing: border-box;
    transition: background .17s ease,border-color .17s ease;
}
.sdc-listcheckbox input:enabled + * { cursor: pointer }
.sdc-listcheckbox input:enabled:hover + *::after { border-color: #72767d }
.sdc-listcheckbox input:checked + *::after {
    content: url('data:image/svg+xml,%3Csvg stroke="%23FFF" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg"%3E%3Cpolyline stroke-width="2" fill="none" points="3.5 9.5 7 13 15 5"%3E%3C/polyline%3E%3C/svg%3E');
    border: 0;
    padding: 3px;
    background: #72dac7;
}
.sdc-listcheckbox input:enabled:checked:hover + *::after { background-color: #67c4b3 }
.sdc-listcheckbox input:disabled + *::after {
    background: #72767d;
    border: 0;
    opacity: .5;
}
.sdc-listbox:last-child {
    background: rgba(0,0,0,.1);
    padding: 9px;
}
.sdc-listbox:last-child::before { display: none }
.sdc-list > h5 > p {
    font-size: 10px;
    font-weight: 700;
    color: #dcddde;;
    padding: 0 8px 1px 8px;
    box-sizing: border-box;
    justify-content: center;
}
.sdc-close {
    content: url('data:image/svg+xml;utf8,%3Csvg fill="%23DCDDDE" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M9.5 3.205L8.795 2.5 6 5.295 3.205 2.5l-.705.705L5.295 6 2.5 8.795l.705.705L6 6.705 8.795 9.5l.705-.705L6.705 6"%3E%3C/path%3E%3C/svg%3E');
    width: 18px;
    height: 18px;
    cursor: pointer;
    border-radius: 3px;
    margin: 0;
    padding: 4px;
    position: absolute;
    right: 16px;
    top: 16px;
    opacity: .5;
}
.sdc-close:hover {
    opacity: 1;
    background-color: hsla(210,3%,87%,.05);
}`,
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

        Utils.AttachEventToClass(wrapper, 'SDC_UNBLOCK', 'submit', (e) => {
            e.preventDefault();
            this.Remove();
            passwordCallback(wrapper.getElementsByClassName('SDC_PASSWORD')[0].value);
        });
        Utils.AttachEventToClass(wrapper, 'SDC_NEWDB', 'click', () => {
            this.Remove();
            newdbCallback();
        });
        Utils.AttachEventToClass(wrapper, 'SDC_CANCEL', 'click', () => {
            this.Remove();
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
        <div class="sdc-footer"><button type="button" class="SDC_CANCEL sdc-lnkbtn"><p>Cancel</p></button><button type="button" class="SDC_IMPORT sdc-lnkbtn"><p>Import</p></button><button type="button" class="SDC_SECONDARY sdc-lnkbtn" style="padding-right:22px"><p>Secondary</p></button><button type="submit" class="sdc-btn" style="min-width:96px">Create</button></div>
    </form>
</div>
</div>`,
    Show: function(newdbCallback, importCallback, secondaryCallback, cancelCallback) {
        let wrapper = document.createElement('div');
        wrapper.innerHTML = this.html;

        Utils.AttachEventToClass(wrapper, 'SDC_CREATEDB', 'submit', (e) => {
            e.preventDefault();
            this.Remove();
            newdbCallback(wrapper.getElementsByClassName('SDC_PASSWORD')[0].value);
        });
        Utils.AttachEventToClass(wrapper, 'SDC_IMPORT', 'click', () => {
            importCallback();
        });
        Utils.AttachEventToClass(wrapper, 'SDC_SECONDARY', 'click', () => {
            secondaryCallback();
        });
        Utils.AttachEventToClass(wrapper, 'SDC_CANCEL', 'click', () => {
            this.Remove();
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
const NewPasswordWindow = {
    html: `<div class="sdc">
<div class="SDC_CANCEL sdc-cover"></div>
<div class="sdc-overlay">
    <form class="SDC_CHANGEPASSWORD sdc-window" style="min-width: 480px">
        <div style="margin-top:20px">
            <h4>Change Database Password</h4>
        </div>
        <h5 style="margin-top:20px">Password <p style="margin-left:5px;opacity:.6">(optional)</p></h5>
        <input class="SDC_PASSWORD" style="margin-top:8px;margin-bottom:20px" type="password" name="sdc-password">
        <div class="sdc-footer"><button type="button" class="SDC_CANCEL sdc-lnkbtn" style="min-width:96px"><p>Cancel</p><button type="submit" class="sdc-btn" style="min-width:96px">Change</button></div>
    </form>
</div>
</div>`,
    Show: function(newPasswordCallback, cancelCallback) {
        let wrapper = document.createElement('div');
        wrapper.innerHTML = this.html;

        Utils.AttachEventToClass(wrapper, 'SDC_CHANGEPASSWORD', 'submit', (e) => {
            e.preventDefault();
            this.Remove();
            newPasswordCallback(wrapper.getElementsByClassName('SDC_PASSWORD')[0].value);
        });
        Utils.AttachEventToClass(wrapper, 'SDC_CANCEL', 'click', () => {
            this.Remove();
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
const KeyManagerWindow = {
    html: `<div class="sdc">
<div class="SDC_CLOSE sdc-cover"></div>
<div class="sdc-overlay">
    <div class="sdc-window" style="min-width: 580px">
        <div style="margin:20px">
            <h4>Key Manager</h4>
        </div>
        <a class="SDC_CLOSE sdc-close"></a>
        <div class="sdc-scroll" onscroll="this.style.boxShadow=this.scrollTop?'inset 0 1px 0 0 rgba(24,25,28,.3),inset 0 1px 2px 0 rgba(24,25,28,.3)':null" style="max-height:60vh">
        <div class="SDC_LIST sdc-list">
            <h5><p>Key</p><p style="margin-left:auto;width:76px">Hidden</p><p style="width:94px">Delete</p></h5>

        </div>
        </div>
        <div class="sdc-footer">
            <button type="button" class="SDC_CLOSE sdc-btn" style="min-width:96px">Done</button>
        </div>
    </div>
</div>
</div>`,
    Show: function(keys, setKeyDescriptor, setKeyHidden, deleteKey) {
        let wrapper = document.createElement('div');
        wrapper.innerHTML = this.html;

        Utils.AttachEventToClass(wrapper, 'SDC_CLOSE', 'click', () => {
            this.Remove();
        });

        let list = wrapper.getElementsByClassName('SDC_LIST')[0];
        for(let key of keys) {
            let listItem = document.createElement('div');
            listItem.innerHTML = `<div>
                    <h6 class="SDC_DESCRIPTOR">${HtmlEscape(key.descriptor)} <a class="SDC_EDITDESCRIPTOR sdc-edit"></a></h6>
                    <p>${Utils.FormatTime(key.lastseen)}</p>
                </div>
                <div class="sdc-listbox sdc-listcheckbox"><label><input type="checkbox" class="SDC_SETHIDDEN" style="display:none"${key.hidden?' checked':''}${key.type!=='GROUP'?' disabled':''}><p></p></label></div>
                <div class="sdc-listbox"><button type="button" class="SDC_DELETE sdc-rbtn" style="margin:0 4px"${key.protected?' disabled':''}>Delete</button></div>`;
            const editDescriptor = (e) => {
                let descriptorElement = listItem.getElementsByClassName('SDC_DESCRIPTOR')[0];
                descriptorElement.innerHTML = `<input type="text" class="SDC_DESCRIPTORINPUT" style="width:320px"></input>`;
                const changeBack = () => {
                    descriptorElement.innerHTML = `${HtmlEscape(key.descriptor)} <a class="SDC_EDITDESCRIPTOR sdc-edit"></a>`;
                    Utils.AttachEventToClass(descriptorElement, 'SDC_EDITDESCRIPTOR', 'click', editDescriptor);
                };
                let descriptorInput = descriptorElement.getElementsByClassName('SDC_DESCRIPTORINPUT')[0];
                descriptorInput.value = key.rawDescriptor;
                descriptorInput.onkeydown = function(e) {
                    if(e.keyCode === 13/*ENTER*/) {
                        e.preventDefault();
                        setKeyDescriptor(key, this.value)
                        changeBack();
                    }
                    else if(e.keyCode === 27/*ESC*/)
                        changeBack();
                };
                descriptorInput.focus();
            };
            Utils.AttachEventToClass(listItem, 'SDC_EDITDESCRIPTOR', 'click', editDescriptor);
            Utils.AttachEventToClass(listItem, 'SDC_SETHIDDEN', 'change', function() {
                setKeyHidden(key, this.checked);
            });
            Utils.AttachEventToClass(listItem, 'SDC_DELETE', 'click', () => {
                deleteKey(key);
                list.removeChild(listItem);
            });

            list.appendChild(listItem);
        }

        document.body.appendChild(wrapper);
        this.domElement = wrapper;
    },
    Remove: function() {
        if(document.body.contains(this.domElement))
            document.body.removeChild(this.domElement);
    }
};
const ChannelManagerWindow = {
    html: `<div class="sdc">
<div class="SDC_CLOSE sdc-cover"></div>
<div class="sdc-overlay">
    <div class="sdc-window" style="min-width: 580px">
        <div style="margin:20px">
            <h4>Channel Manager</h4>
        </div>
        <a class="SDC_CLOSE sdc-close"></a>
        <div class="sdc-scroll" onscroll="this.style.boxShadow=this.scrollTop?'inset 0 1px 0 0 rgba(24,25,28,.3),inset 0 1px 2px 0 rgba(24,25,28,.3)':null" style="max-height:60vh">
        <div class="SDC_LIST sdc-list">
            <h5><p>Config</p><p style="margin-left:auto;width:94px">Delete</p></h5>

        </div>
        </div>
        <div class="sdc-footer">
            <button type="button" class="SDC_CLOSE sdc-btn" style="min-width:96px">Done</button>
        </div>
    </div>
</div>
</div>`,
    Show: function(channels, deleteChannel) {
        let wrapper = document.createElement('div');
        wrapper.innerHTML = this.html;

        Utils.AttachEventToClass(wrapper, 'SDC_CLOSE', 'click', () => {
            this.Remove();
        });

        let list = wrapper.getElementsByClassName('SDC_LIST')[0];
        for(let channel of channels) {
            let listItem = document.createElement('div');
            listItem.innerHTML = `<div>
                    <h6 class="SDC_DESCRIPTOR">${HtmlEscape(channel.descriptor)}</h6>
                    <p>${Utils.FormatTime(channel.lastseen)}</p>
                </div>
                <div class="sdc-listbox"><button type="button" class="SDC_DELETE sdc-rbtn" style="margin:0 4px">Delete</button></div>`;
            Utils.AttachEventToClass(listItem, 'SDC_DELETE', 'click', () => {
                deleteChannel(channel);
                list.removeChild(listItem);
            });

            list.appendChild(listItem);
        }

        document.body.appendChild(wrapper);
        this.domElement = wrapper;
    },
    Remove: function() {
        if(document.body.contains(this.domElement))
            document.body.removeChild(this.domElement);
    }
};
const ShareKeyWindow = {
    html: `<div class="sdc">
<div class="SDC_CLOSE sdc-cover"></div>
<div class="sdc-overlay">
    <div class="sdc-window" style="min-width: 580px">
        <div style="margin:20px">
            <h4>Share Keys</h4>
        </div>
        <a class="SDC_CLOSE sdc-close"></a>
        <div class="sdc-scroll" onscroll="this.style.boxShadow=this.scrollTop?'inset 0 1px 0 0 rgba(24,25,28,.3),inset 0 1px 2px 0 rgba(24,25,28,.3)':null" style="max-height:60vh">
        <div class="SDC_LIST sdc-list">
            <h5><p>Key</p><p style="margin-left:auto;width:94px">Share</p></h5>

        </div>
        </div>
        <div class="sdc-footer">
            <button type="button" class="SDC_CLOSE sdc-btn" style="min-width:96px">Done</button>
        </div>
    </div>
</div>
</div>`,
    Show: function(keys, shareKey) {
        let wrapper = document.createElement('div');
        wrapper.innerHTML = this.html;

        Utils.AttachEventToClass(wrapper, 'SDC_CLOSE', 'click', () => {
            this.Remove();
        });

        let list = wrapper.getElementsByClassName('SDC_LIST')[0];
        for(let key of keys) {
            let listItem = document.createElement('div');
            listItem.innerHTML = `<div>
                    <h6 class="SDC_DESCRIPTOR">${HtmlEscape(key.descriptor)}</h6>
                    <p>${Utils.FormatTime(key.lastseen)}</p>
                </div>
                <div class="sdc-listbox"><button type="button" class="SDC_SHARE sdc-wbtn" style="margin:0 4px">Share</button></div>`;
            Utils.AttachEventToClass(listItem, 'SDC_SHARE', 'click', function() {
                shareKey(key);
                this.disabled = true;
            });

            list.appendChild(listItem);
        }

        document.body.appendChild(wrapper);
        this.domElement = wrapper;
    },
    Remove: function() {
        if(document.body.contains(this.domElement))
            document.body.removeChild(this.domElement);
    }
};
const MenuBar = {
    menuBarCss: `.SDC_TOGGLE{opacity:.6;fill:#fff;height:24px;cursor:pointer;margin-left:-5px}.SDC_TOGGLE:hover{opacity:.8}`,
    toggleOnButtonHtml: `<div class="sdc" style="position:relative"><svg class="SDC_TOGGLE" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><path d="M18 0c-4.612 0-8.483 3.126-9.639 7.371l3.855 1.052C12.91 5.876 15.233 4 18 4c3.313 0 6 2.687 6 6v10h4V10c0-5.522-4.477-10-10-10z"/><path d="M31 32c0 2.209-1.791 4-4 4H9c-2.209 0-4-1.791-4-4V20c0-2.209 1.791-4 4-4h18c2.209 0 4 1.791 4 4v12z"/></svg><p class="sdc-tooltip">Encrypt Channel</p></div>`,
    toggleOffButtonHtml: `<div class="sdc" style="position:relative"><svg class="SDC_TOGGLE" style="opacity:1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><path d="M18 3C12.477 3 8 7.477 8 13v10h4V13c0-3.313 2.686-6 6-6s6 2.687 6 6v10h4V13c0-5.523-4.477-10-10-10z"/><path d="M31 32c0 2.209-1.791 4-4 4H9c-2.209 0-4-1.791-4-4V20c0-2.209 1.791-4 4-4h18c2.209 0 4 1.791 4 4v12z"/><p class="sdc-tooltip">Disable Encryption</p></svg>`,
    keySelectHtml: `<div class="sdc sdc-select" style="margin:-3px 0 -2px 5px"><label style="min-width:200px;max-width:300px;height:30px"><input class="SDC_DROPDOWN sdc-hidden" type="checkbox"><p class="SDC_SELECTED" style="justify-content:center;text-align:center"></p></label><div class="SDC_OPTIONS" style="visibility:hidden"></div></div>`,
    toggledOnCss: `.inner-zqa7da{box-shadow:0 0 0 1px ${BaseColor} !important}`,
    menuHtml: `<button type="button" class="SDC_FOCUS sdc-hidden"></button>
<div class="sdc sdc-menu SDC_MENU" style="visibility:hidden">
    <div class="SDC_DMMENU">
        <a class="SDC_KEYART">Visualize Key</a>
        <a class="SDC_KEYEXCHANGE">Start Key Exchange</a>
        <a class="SDC_KEYSHARE">Share Keys</a>
    </div>
    <div class="SDC_GROUPMENU">
        <a class="SDC_NEWKEY">Create Group Key</a>
    </div>
    <div>
        <a class="SDC_KEYMANAGER">Key Manager</a>
        <a class="SDC_CHMANAGER">Channel Manager</a>
    </div>
    <div>
        <a class="SDC_EXPORTDB">Export Database</a>
        <a class="SDC_NEWDBKEY">Change Database Key</a>
        <a class="SDC_NEWDB" style="color:#ff4031">New Database</a>
    </div>
</div>`,
    Show: function(getToggleStatus, toggle, getCurrentKeyDescriptor, getKeys, selectKey, getIsDmChannel, exportDb, exportDbRaw, newDb, newDbKey, keyExchange, groupKey, keyManager, channelManager, keyVisualizer, keyShare) {
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

        this.menuWrapper = document.createElement('div');
        this.menuWrapper.innerHTML = this.menuHtml;
        document.body.appendChild(this.menuWrapper);
        let menu = this.menuWrapper.getElementsByClassName('SDC_MENU')[0];
        let menuFocus = this.menuWrapper.getElementsByClassName('SDC_FOCUS')[0];
        let menuDmGroup = this.menuWrapper.getElementsByClassName('SDC_DMMENU')[0];
        let menuNondmGroup = this.menuWrapper.getElementsByClassName('SDC_GROUPMENU')[0];

        this.toggleOnButton = document.createElement('div');
        this.toggleOnButton.innerHTML = this.toggleOnButtonHtml;
        this.toggleOnButton.onclick = toggle;

        this.toggleOffButton = document.createElement('div');
        this.toggleOffButton.innerHTML = this.toggleOffButtonHtml;
        this.toggleOffButton.onclick = toggle;

        Utils.AttachEventToClass(menu, 'SDC_EXPORTDB', 'mousedown', (e) => e.ctrlKey ? exportDbRaw() : exportDb());
        Utils.AttachEventToClass(menu, 'SDC_NEWDB', 'mousedown', () => newDb());
        Utils.AttachEventToClass(menu, 'SDC_NEWDBKEY', 'mousedown', () => newDbKey());
        Utils.AttachEventToClass(menu, 'SDC_KEYEXCHANGE', 'mousedown', () => keyExchange());
        Utils.AttachEventToClass(menu, 'SDC_NEWKEY', 'mousedown', () => groupKey());
        Utils.AttachEventToClass(menu, 'SDC_KEYMANAGER', 'mousedown', () => keyManager());
        Utils.AttachEventToClass(menu, 'SDC_CHMANAGER', 'mousedown', () => channelManager());
        Utils.AttachEventToClass(menu, 'SDC_KEYART', 'mousedown', () => keyVisualizer());
        Utils.AttachEventToClass(menu, 'SDC_KEYSHARE', 'mousedown', () => keyShare());

        const dropdownOn = () => {
            let keys = getKeys();
            keySelectOptions.innerText = "";

            for(let key of keys) {
                let option = document.createElement('a');
                option.innerText = key.descriptor;
                if(key.selected)
                    option.style.backgroundColor = "rgba(0,0,0,.2)";
                else
                    option.onmousedown = () => selectKey(key);
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

        this.toggleOnButton.oncontextmenu = this.toggleOffButton.oncontextmenu = (e) => {
            e.preventDefault();
            menu.style.left = e.clientX+"px";
            menu.style.top = e.clientY+"px";
            menu.style.visibility = 'visible';
            menuFocus.focus();
        };
        menuFocus.onblur = () => { menu.style.visibility = 'hidden' };

        this.Update = function(isRetry) {
            let titleElement = document.querySelector(`.title-3qD0b- .title-29uC1r, .title-3qD0b- .channelName-qsg_a_`);
            if(titleElement == null) {
                if(!isRetry) this.retries = 0;
                if(this.retries < 10) {
                    this.retries++;
                    this.retryTimeout = setTimeout(() => { this.Update(true) }, this.retries * 400);
                }
                return;
            }
            clearTimeout(this.retryTimeout);

            if(this.mutationObserver != null) this.mutationObserver.disconnect();
            else this.mutationObserver = new MutationObserver((changes) => { for(let change of changes) for(let removed of change.removedNodes) { this.Update(); break; }});
            
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

            if(getIsDmChannel()) {
                menuDmGroup.style.display = null;
                menuNondmGroup.style.display = 'none';
            }
            else {
                menuDmGroup.style.display = 'none';
                menuNondmGroup.style.display = null;
            }
            
            let randomChangesNode = document.getElementsByClassName('base-3dtUhz')[0];
            if(randomChangesNode != null) this.mutationObserver.observe(randomChangesNode, { childList: true, subtree: true });
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
        if(document.body.contains(this.menuWrapper))
            document.body.removeChild(this.menuWrapper);
    }
};
const PopupManager = {
    Inject: function() {
        let wrapper = document.createElement('div');

        document.body.appendChild(wrapper);
        this.domElement = wrapper;
    },
    Update: function() {
        if(!document.body.contains(this.domElement))
            document.body.appendChild(this.domElement);
    },
    New: function(message, okCallback, cancelCallback) {
        let popup = document.createElement('div');
        popup.innerHTML = `<div class="sdc sdc-window" style="width:280px;position:fixed;right:50px;bottom:60px">
    <div style="margin:20px;word-break:break-all;word-break:break-word">
        ${HtmlEscape(message)}
    </div>
    <div class="sdc-footer" style="padding:10px">
        <button type="button" class="SDC_CANCEL sdc-lnkbtn" style="min-width:96px"><p>Cancel</p></button>
        <button type="button" class="SDC_OK sdc-btn" style="min-width:96px">OK</button>
    </div>
</div>
<button type="button" class="SDC_FOCUS sdc-hidden"></button>`;
        Utils.AttachEventToClass(popup, 'SDC_OK', 'click', () => {
            this.domElement.removeChild(popup);
            okCallback();
        });
        Utils.AttachEventToClass(popup, 'SDC_CANCEL', 'click', () => {
            this.domElement.removeChild(popup);
            if(cancelCallback) cancelCallback();
        });
        this.domElement.prepend(popup);
        return popup;
    },
    NewPromise: function(message, timeout) {
        return new Promise((resolve) => {
            if(timeout > 0) {
                let cancelTimeout;
                let popup = this.New(message,
                                     () => { clearTimeout(cancelTimeout); resolve(true); },
                                     () => { clearTimeout(cancelTimeout); resolve(false); }
                                     );

                cancelTimeout = setTimeout(() => { this.domElement.removeChild(popup); resolve(false); }, timeout);
            }
            else {
                let popup = this.New(message, () => resolve(true), () => resolve(false));
                if(typeof timeout === 'object') { timeout.cancel = () => { this.domElement.removeChild(popup); resolve(false); } };
            }
        });
    },
    Remove: function() {
        if(document.body.contains(this.domElement))
            document.body.removeChild(this.domElement);
    }
};
const KeyVisualizerWindow = {
    EmojiHash: function(canvas, hashBuffer) {
var ctx;

function drawEmoji(emoji, x, y, size, rotation) {
    ctx.save();
    ctx.translate(x, y);
    if(rotation) ctx.rotate(rotation * Math.PI / 180);
    ctx.scale(size, size);
    ctx.fillText(emoji, 0, 0);
    ctx.restore();
}
function drawRectangle(color, x, y, width, height, rotation) {
    ctx.save();
    ctx.translate(x, y);
    if(rotation) ctx.rotate(rotation * Math.PI / 180);
    ctx.fillStyle = color;
    ctx.fillRect(-width/2, -height/2, width, height);
    ctx.restore();
}
var uintOffset = 0;
var inUintOffset = 0;
var uints = new DataView(hashBuffer);
function popBits(count) { //max 32
    let bits;
    let newInUintOffset = inUintOffset + count;
    if(newInUintOffset > 31) {
        bits = uints.getUint32(uintOffset) & ~(~0 << (32 - inUintOffset));
        inUintOffset = newInUintOffset - 32;
        uintOffset += 4;
        if(uintOffset === hashBuffer.byteLength) uintOffset = 0;
        if(inUintOffset !== 0) {
            bits = (bits << inUintOffset) | (uints.getUint32(uintOffset) >>> (32 - inUintOffset));
        }
    }
    else {
        bits = (uints.getUint32(uintOffset) >>> (32 - newInUintOffset)) & ~(~0 << count);
        inUintOffset = newInUintOffset;
    }

    return bits;
}

ctx = canvas.getContext('2d');
ctx.textAlign = "center";
ctx.textBaseline = "middle";
ctx.font = "1px sans-serif";
ctx.translate(canvas.width / 2, canvas.height / 2);
let scale = Math.min(canvas.width / 4, canvas.height / 3) / 100 * 4;
ctx.scale(scale, scale);


function drawSky() {
    let color;
    switch(popBits(3)) {
    case 0: //purple
        color = "#a254d3";
    break;
    case 1: //rose
        color = "#f6c4df";
    break;
    case 2: //blue
        color = "#2b7cb3";
    break;
    case 3: //darkblue
        color = "#154167";
    break;
    default: //lightblue
        color = "#9bcfea";
    }

    drawRectangle(color, 0, 0, 1000, 1000);
}

const airObjects = "☀️|🌑|☁️|🌩️|🌨️|🐉|🦇|🦅|🕊️|🐝|🦋|🍃|🚁|✈️|🛩️|🚀|🛸|🛰️|🌜|☄️|🌟|❄️|⚡|✨|🎈|👾|👻".split("|");
function drawAirObject(x, y, size, rotation) {
    if(popBits(1)) return;

    drawEmoji(airObjects[popBits(5) % 27], x, y, size, rotation); //32-27 first 5 have double probability
}
const handEmojis = "👌|🖕|✌|👊|👍|👎|👋|👈|👉|☝|👆|👇|🤞|🖖|🤟|🤙|🖐|✋|✍|💰|💀|💩|💣|🥊|🎨|🎺|📷|🎥|🔦|💼|🔎|📕|✉️|✏️|📏|🔫|🔨|🔧|💉|🚬|🗝️|📞|🎮|🎓|🍆".split("|");
function drawHandEmoji(x, y, size, rotation) {
    drawEmoji(handEmojis[popBits(6) % 45], x, y, size, rotation);
}
const bodyEmojis = "👔|👕|🥋|🎽|🧥|👗|👘|👙|👚".split("|");
const headEmojis = "🤔|😂|😤|😭|😋|🤗|😏|😳|😆|🤨|😎|🙄|😑|😍|😘|🙂|🤩|😶|😣|😮|🤐|😫|😴|😜|🤤|😒|🙃|🤑|☹️|😁|😖|😱|🤯|😬|🤪|😵|😡|🤒|🤢|🤮|🤧|😇|🤠|🤡|🤥|🤣|🤫|🧐|🤓|😈|💩|🤖|👽|💀|👺|👶|👩|👨|👴|👵|🤴|👳|👲|🧔|👱|🎅|🐵|🐶|🐺|🦊|🐱|🦁|🐯|🐴|🦄|🦓|🐮|🐷|🐗|🐭|🐹|🐰|🐻|🐸|🐲|🐔|🎃".split("|");
function drawPerson(x, y, size) {
    ctx.save();
    ctx.translate(x, y);
    let scale = size / 100;
    ctx.scale(scale, scale);

    drawRectangle("#000", 0, -10, 4, 50); //body
    drawRectangle("#000", -9, 26, 4, 30, 35); //legs
    drawRectangle("#000", 9, 26, 4, 30, -35);

    switch(popBits(2)) { //left arm
    case 0: //up
        drawRectangle("#000", -12, -23, 4, 30, -55);
        drawHandEmoji(-26, -34, 15);
    break;
    case 1: //middle
        drawRectangle("#000", -15, -15, 30, 4);
        drawHandEmoji(-30, -18, 15);
    break;
    default: //down
        drawRectangle("#000", -12, -8, 4, 30, 55);
        drawHandEmoji(-26, -4, 15);
    }
    switch(popBits(2)) { //right arm
    case 0: //up
        drawRectangle("#000", 12, -23, 4, 30, 55);
        drawHandEmoji(26, -34, 15);
    break;
    case 1: //middle
        drawRectangle("#000", 15, -15, 30, 4);
        drawHandEmoji(30, -18, 15);
    break;
    default: //down
        drawRectangle("#000", 12, -8, 4, 30, -55);
        drawHandEmoji(26, -4, 15);
    }

    drawEmoji(bodyEmojis[popBits(4) % 9], 0, -5, 28); //chest
    drawEmoji(headEmojis[popBits(12) % 87], 0, -35, 25); //face 4096 % 87 = first 7 have increased chance

    if(popBits(1)) drawEmoji("👟", -13, 35, 15); //left foot
    if(popBits(1)) drawEmoji("👟", 19, 35, 15); //right foot

    ctx.restore();
}
const tableObjects = "🍞|👓|🛍️|💎|🍎|🍇|🍉|🍊|🍋|🍌|🍏|🍐|🍑|🍒|🍓|🥝|🍅|🥥|🥔|🥕|🌽|🌶️|🥒|🥦|🍄|🥜|🥐|🥨|🥞|🧀|🍖|🍗|🥩|🥓|🍔|🍟|🍕|🌭|🥪|🌮|🥚|🍲|🥣|🥗|🍿|🥫|🍱|🍙|🍣|🥡|🍦|🍩|🎂|🥧|🍫|🍮|🍯|🍼|☕|🍷|🍸|🍺|🔪|🏺|🛎️|⏰|⌛|🌂|🎁|🏆|⚽|🎳|🔮|🕹️|🎲|📢|📻|🎧|🎤|☎️|💻|🖨️|📺|🕯️|📦|🔭|⚗️|🔬|⚖️|🥤|📚".split("|");
function drawTableObject(x, y, size, rotation) {
    if(popBits(1)) return;

    drawEmoji(tableObjects[popBits(12) % 91], x, y, size, rotation);
}
function drawTable(x, y, size, rotation) {
    ctx.save();
    ctx.translate(x, y);
    let scale = size / 100;
    ctx.scale(scale, scale);

    drawRectangle("#999", 0, 33, 4, 34);
    drawRectangle("#f00", 0, 14, 70, 4);

    drawTableObject(-25, 2, 20);
    drawTableObject(-3, 2, 20);
    drawTableObject(25, 2, 20);

    ctx.restore();
}
const groundObjects = "🐉|💩|👯|👫|🚶🏻|🏃🏻|💃🏻|🕺🏻|🧘🏻|🕴🏻|🤺|🏇🏻|🏌🏻|⛹🏻|🏋🏻|🚴🏻|🤸🏻|🤼|🤾🏻|🐒|🦍|🐕|🐩|🐈|🐅|🐆|🐎|🦌|🐂|🐄|🐖|🐑|🐐|🐪|🐘|🦏|🐁|🐀|🐇|🐿️|🦔|🦃|🐓|🐧|🐤|🐦|🦆|🦉|🐊|🐢|🦎|🐍|🦕|🦖|🐌|🐛|🐜|🌹|🥀|🌻|🌼|🌷|🌱|🌲|🌳|🌴|🌵|🌾|🍀|⛩️|⛲|🎪|🛢️|🛵|🚲|🛴|🎏|🥅|🗑️|🗿|🏳️‍🌈|🚩|🏁|🏴|🏳️".split("|");
function drawGroundObject(x, y, size, rotation) {
    switch(popBits(2)) {
    case 0:
        drawPerson(x, y, size, rotation);
    break;
    case 1:
        drawTable(x, y, size, rotation);
    break;
    case 2:
        drawEmoji(groundObjects[popBits(8) % 85], x, y, size / 2, rotation);
    break;
    }
}


switch(popBits(2)) {
    case 0: { //park
        drawSky();
        drawRectangle("#5ce64e", 0, 50, 200, 100, 1);
        drawAirObject(-40, -27, 8);
        drawAirObject(-16, -30, 10);
        drawAirObject(17, -28, 9);
        drawAirObject(41, -20, 10);
        drawGroundObject(-37, 20, 30);
        drawGroundObject(-10, 10, 23);
        drawGroundObject(10, 0, 20);
        drawGroundObject(15, 25, 20);
        drawGroundObject(35, 20, 26);
    } break;
    case 1: { //beach
        drawSky();
        drawRectangle("#e5e886", 0, 50, 200, 100);
        drawRectangle("#3cc", 0, 0, 200, 10, -.5);
        drawAirObject(-40, -27, 8);
        drawAirObject(-16, -30, 10);
        drawAirObject(17, -28, 9);
        drawAirObject(41, -20, 10);
        drawGroundObject(-37, 20, 30);
        drawGroundObject(-10, 10, 23);
        drawGroundObject(10, 0, 20);
        drawGroundObject(15, 25, 20);
        drawGroundObject(35, 20, 26);

    } break;
    case 2: { //campfire
        drawSky();
        drawRectangle("#49be3d", 0, 50, 200, 100);
        drawEmoji("🔥", 0, 10, 20);
        drawRectangle("#333", 0, 20, 15, 5);
        drawAirObject(-42, -20, 8);
        drawAirObject(-25, -25, 10);
        drawAirObject(22, -28, 9);
        drawAirObject(41, -20, 10);
        drawGroundObject(-37, 20, 30);
        drawGroundObject(-13, 20, 23);
        drawGroundObject(-35, -5, 20);
        drawGroundObject(15, 25, 20);
        drawGroundObject(35, 20, 26);

    } break;
    case 3: { //mountainslide
        drawSky();
        drawRectangle("#eff", 0, 50, 200, 100, -30);
        drawAirObject(-42, -10, 8);
        drawAirObject(-40, -25, 10);
        drawAirObject(-15, -30, 9);
        drawAirObject(15, -30, 10);
        drawGroundObject(-37, 20, 30);
        drawGroundObject(-10, 10, 23);
        drawGroundObject(20, 0, 20);
        drawGroundObject(15, 25, 20);
        drawGroundObject(35, 20, 26);

    } break;
}

},
    html: `<div class="sdc">
<div class="SDC_CLOSE sdc-cover"></div>
<div class="sdc-overlay">
    <div class="sdc-window">
        <div style="margin:20px">
            <h4>Key Visualizer v1.1</h4>
        </div>
        <a class="SDC_CLOSE sdc-close"></a>
        <canvas class="SDC_ART" width="600" height="450"></canvas>
        <div class="sdc-footer">
            <button type="button" class="SDC_CLOSE sdc-btn" style="min-width:96px">Close</button>
        </div>
    </div>
</div>
</div>`,
    Show: function(buffer) {
        let wrapper = document.createElement('div');
        wrapper.innerHTML = this.html;

        Utils.AttachEventToClass(wrapper, 'SDC_CLOSE', 'click', () => {
            this.Remove();
        });

        let canvas = wrapper.getElementsByClassName('SDC_ART')[0];
        this.EmojiHash(canvas, buffer);

        document.body.appendChild(wrapper);
        this.domElement = wrapper;
    },
    Remove: function() {
        if(document.body.contains(this.domElement))
            document.body.removeChild(this.domElement);
    }
};


var Discord;
var Utils = {
    Log: (message) => { console.log(`%c[SimpleDiscordCrypt] %c${message}`, `color:${BaseColor};font-weight:bold`, "") },
    Warn: (message) => { console.warn(`%c[SimpleDiscordCrypt] %c${message}`, `color:${BaseColor};font-weight:bold`, "") },
    Error: (message) => { console.error(`%c[SimpleDiscordCrypt] %c${message}`, `color:${BaseColor};font-weight:bold`, "") }
};
var DataBase;
var Cache;
var Blacklist;
var Patcher;

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

    Object.assign(Utils, {

        StorageSave:
        (typeof(GM_getValue) !== 'undefined' && typeof(GM_setValue) !== 'undefined') ? (key, value) => new Promise((resolve) => {
            resolve(GM_setValue(key, JSON.stringify(value)));
        })
        : (typeof(chrome) !== 'undefined' && chrome.storage != null) ? (key, value) => new Promise((resolve) => {
            chrome.storage.sync.set({key: value}, resolve);
        })
        : (key, value) => new Promise((resolve) => {
            resolve(SavedLocalStorage.setItem(key, JSON.stringify(value)));
        }),
        StorageLoad:
        (typeof(GM_getValue) !== 'undefined' && typeof(GM_setValue) !== 'undefined') ? (key) => new Promise((resolve) => {
            let jsonValue = GM_getValue(key);
            if(jsonValue == null) resolve(null);
            resolve(JSON.parse(jsonValue));
        })
        : (typeof(chrome) !== 'undefined' && chrome.storage != null) ? (key) => new Promise((resolve) => {
            chrome.storage.sync.get(key, (result) => resolve(result[key]));
        })
        : (key) => new Promise((resolve) => {
            let jsonValue = SavedLocalStorage.getItem(key);
            if(jsonValue == null) resolve(null);
            resolve(JSON.parse(jsonValue));
        }),

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
                method: 'GET',
                url,
                responseType: 'arraybuffer',
                onload: (result) => resolve(result.response),
                onerror: reject
            })
        })
        : (typeof(require) !== 'undefined') ? function(url) { return new Promise ((resolve, reject) => {
            require('https').get(url, (response) => {
                let data = [];
                response.on('data', (chunk) => data.push(chunk));
                response.on('end', () => resolve(this.ConcatBuffers(data)));
            }).on('error', reject);
        })}
        : (url) => new Promise((resolve, reject) => {
            let xhr = new XMLHttpRequest();
            xhr.responseType = 'arraybuffer';
            xhr.onload = () => resolve(xhr.response);
            xhr.onerror = reject;
            xhr.open('GET', url);
            xhr.withCredentials = true;
            xhr.send();
        }),

        DownloadBlob: (filename, blob) => {
            let url = URL.createObjectURL(blob);
            let a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.style = "display:none"; 
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        },

        TryCompress: (buffer) => new Promise((resolve) => {
            let length = buffer.byteLength;
            if(length < 1600) return resolve(buffer);
            let bufferView = new DataView(buffer);
            let pixelCount = Math.ceil(length / 3);
            const maxSafePngWidth = 32767;
            let lines = Math.ceil(pixelCount / maxSafePngWidth);
            let width = Math.ceil(pixelCount / lines);
            let fullPixelCount = lines * width;
            let pixelBytes = new Uint8ClampedArray(fullPixelCount * 4);
            let pixels = new DataView(pixelBytes.buffer);
            let pixelMaxIndex = pixelCount - 1;
            let remainingBytes = length - (pixelMaxIndex * 3);
            let i = pixelMaxIndex;
            while(i--) {
                let pixel = bufferView.getUint32(i * 3, true) | 0xFF000000; //3 bytes per pixel, alpha is 255
                pixels.setUint32(i * 4, pixel, true);
            }
            if(remainingBytes === 3) {
                let pixel = bufferView.getUint16(length - 3, true) | (bufferView.getUint8(length - 1) << 16) | 0xFF000000;
                pixels.setUint32(pixelMaxIndex * 4, pixel, true);
            }
            else if(remainingBytes === 2) {
                let pixel = bufferView.getUint16(length - 2, true) | 0xFF000000;
                pixels.setUint32(pixelMaxIndex * 4, pixel, true);
            }
            else if(remainingBytes === 1) {
                let pixel = bufferView.getUint8(length - 1) | 0xFF000000;
                pixels.setUint32(pixelMaxIndex * 4, pixel, true);
            }
            let canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = lines;
            let ctx = canvas.getContext('2d');
            ctx.putImageData(new ImageData(pixelBytes, width, lines), 0, 0);
            let fileReader = new FileReader();
            fileReader.onload = () => {
                let buffer = fileReader.result;
                let view = new DataView(buffer);
                view.setUint16(0, 0x5DC, false); //signature: 05 DC
                view.setUint32(2, length, true);
                resolve(buffer)
            }
            canvas.toBlob(blob => fileReader.readAsArrayBuffer(blob), 'image/png');
        }),
        TryDecompress: async (buffer) => {
            let bufferView = new DataView(buffer);
            if(buffer.byteLength < 2 || bufferView.getUint16(0, false) !== 0x5DC) return buffer;
            let length = bufferView.getUint32(2, true);
            bufferView.setUint16(0, 0x8950, false);
            bufferView.setUint32(2, 0x4E470D0A, false); //restore original PNG signature

            let bitmap = await createImageBitmap(new Blob([buffer], {type:'image/png'}));
            let canvas = document.createElement('canvas');
            let ctx = canvas.getContext('2d');
            let width = canvas.width = bitmap.width;
            let height = canvas.height = bitmap.height;
            ctx.drawImage(bitmap, 0, 0);
            let pxbuffer = ctx.getImageData(0, 0, width, height).data.buffer;
            let pxbufferView = new DataView(pxbuffer);
            let pixelCount = Math.ceil(length / 3);
            for(let i = 0; i < pixelCount; i++) {
                pxbufferView.setUint32(i * 3, pxbufferView.getUint32(i * 4, true), true);
            }
            return pxbuffer.slice(0, length);
        },

        GetNonce: (window.BigInt != null) ? () => (BigInt(Date.now() - 14200704e5/*DISCORD_EPOCH*/) << BigInt(22)).toString() : () => Date.now().toString(),

        FormatTime: (timestamp) => {
            let timezoneOffset = new Date().getTimezoneOffset() * 60000;
            let dateNow = new Date(Date.now() - timezoneOffset).toISOString().slice(0, 10);
            let datetime = new Date(timestamp - timezoneOffset).toISOString();
            let date = datetime.slice(0, 10);
            let time = datetime.slice(11, 16);
            return `${date === dateNow ? "Today at" : date} ${time}`;
        },

        Intersect: (a, b) => {
            let ai = 0,    bi = 0;
            let alen = a.length, blen = b.length;
            let result = [];
            while(ai < alen && bi < blen) {
                if(a[ai] < b[bi]) ai++;
                else if(a[ai] > b[bi]) bi++;
                else {
                    result.push(a[ai]);
                    ai++;
                    bi++;
                }
            }
            return result;
        },
        
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
        AesEncryptCompressString: async function(key, string) {
            let buffer = await this.TryCompress(this.StringToUtf8Bytes(string).buffer);
            return await this.AesEncrypt(key, buffer);
        },
        AesDecryptDecompressString: async function(key, string) {
            let buffer = await this.TryDecompress(await this.AesDecrypt(key, string));
            return this.Utf8BytesToString(buffer);
        },

        DhGenerateKeys: async () => await crypto.subtle.generateKey({name:'ECDH', namedCurve:'P-521'}, true, ['deriveBits']),
        DhImportPublicKey: async (buffer) => await crypto.subtle.importKey('raw', buffer, {name:'ECDH', namedCurve:'P-521'}, false, []),
        DhImportPrivateKey: async (buffer) => await crypto.subtle.importKey('pkcs8', buffer, {name:'ECDH', namedCurve:'P-521'}, false, ['deriveBits']),
        DhImportPrivateKeyFallback: async function(buffer) { return await crypto.subtle.importKey('jwk', JSON.parse(this.Utf8BytesToString(buffer)), {name:'ECDH', namedCurve:'P-521'}, false, ['deriveBits']) },
        DhExportPublicKey: async (key) => await crypto.subtle.exportKey('raw', key),
        DhExportPrivateKey: async (key) => await crypto.subtle.exportKey('pkcs8', key),
        DhExportPrivateKeyFallback: async function(key) { return this.StringToUtf8Bytes(JSON.stringify(await crypto.subtle.exportKey('jwk', key))) },
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
            }

            return newBuffer;
        },

        PayloadEncode: (buffer) => String.fromCharCode.apply(null, Uint16Array.from(new Uint8Array(buffer), b => b + 0x2800)),
        PayloadDecode: (string) => Uint8Array.from(string, c => c.charCodeAt(0) - 0x2800),

        AttachEventToClass: (rootElement, className, eventName, callback) => {
            for(let element of rootElement.getElementsByClassName(className))
                element.addEventListener(eventName, callback);
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
            let keyHashBase64 = this.BytesToBase64(await this.Sha512_128(keyBytes));
            if(DataBase.keys[keyHashBase64] != null) return keyHashBase64;
            let keyObj = { t: type, d: descriptor, r/*registered*/: Date.now(), l/*lastseen*/: Date.now(), h/*hidden*/: (hidden != null) || ((type > 1) ? 1 : 0) };

            if(DataBase.isEncrypted)
                keyBytes = await this.AesEncrypt(Cache.dbKey, keyBytes);

            keyObj.k = this.BytesToBase64(keyBytes);
            DataBase.keys[keyHashBase64] = keyObj;
            this.SaveDb();
            return keyHashBase64;
        },

        dbChanged: false,
        LoadDb: function(callback, failCallback, reload) { (async () => {
            if(!reload) DataBase = await this.StorageLoad('SimpleDiscordCrypt');
            if(DataBase != null) {
                Cache = { keys: {} };

                if(DataBase.isEncrypted) {
                    const newdbCallback = () => { this.NewDb(callback) };
                    const passwordCallback = async (password) => {
                        if(this.BytesToBase64(await this.Sha512_128str(password + DataBase.dbPasswordSalt)) === DataBase.dbPasswordHash)
                        {
                            Cache.dbKey = await this.AesImportKey(await this.Sha512_256str(password + DataBase.dbKeySalt));
                            if(callback) callback();
                        }
                        else
                            UnlockWindow.Show(passwordCallback, newdbCallback);
                    };

                    UnlockWindow.Show(passwordCallback, newdbCallback, failCallback);
                }
                else {
                    if(callback) callback();
                }
            }
            else {
                this.NewDb(callback, failCallback);
            }
        })()},
        SaveDb: async function() {
            if(!this.dbChanged) return;
            this.dbChanged = false;
            await this.StorageSave('SimpleDiscordCrypt', DataBase);
        },
        saveDbTimeout: null,
        FastSaveDb: function() {
            this.dbChanged = true;
            clearTimeout(this.saveDbTimeout);
            setTimeout(() => { this.SaveDb() }, 10);
        },

        DownloadDb: async function(uncompressed) {
            let buffer = this.StringToUtf8Bytes(JSON.stringify(DataBase)).buffer;
            if(!uncompressed) buffer = await this.TryCompress(buffer);
            this.DownloadBlob(uncompressed ? "SimpleDiscordCrypt.json" : "SimpleDiscordCrypt.dat", new Blob([buffer]));
        },
        fileInput: (() => { //need reference to keep gc away (bug?)
            let fileInput = document.createElement('input');
            fileInput.type = 'file';
            return fileInput;
        })(),
        ImportDb: function(callback, secondary) {
            this.fileInput.accept = ".json,.dat";
            this.fileInput.click();
            this.fileInput.onchange = async () => {
                let buffer = await this.ReadFile(this.fileInput.files[0]);
                DataBase = JSON.parse(this.Utf8BytesToString(await this.TryDecompress(buffer)));
                if(secondary) DataBase.isSecondary = true;
                else delete DataBase.isSecondary;
                this.FastSaveDb();
                this.LoadDb(callback, null, true);
            };
        },

        NewDb: function(callback, cancelCallback) {
            NewdbWindow.Show(async (password) => {
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
                this.FastSaveDb();
                if(callback) callback();
            },
                             () => { this.ImportDb(() => { NewdbWindow.Remove(); if(callback) callback(); }) },
                             () => { this.ImportDb(() => { NewdbWindow.Remove(); if(callback) callback(); }, true) },
                             cancelCallback
                            );
        },
        NewDbPassword: function(callback) { //TODO: notifications
            NewPasswordWindow.Show(async (password) => {
                let newDataBase = Object.assign({}, DataBase);
                let newDbKey = null;
                let oldDbKey = Cache.dbKey;
                newDataBase.isEncrypted = password !== "";
                if(newDataBase.isEncrypted) {
                    let salts = this.GetRandomUints(2);
                    newDataBase.dbPasswordSalt = salts[0];
                    newDataBase.dbKeySalt = salts[1];

                    newDataBase.dbPasswordHash = await this.BytesToBase64(await this.Sha512_128str(password + newDataBase.dbPasswordSalt));
                    newDbKey = await this.AesImportKey(await this.Sha512_256str(password + newDataBase.dbKeySalt));

                    let keys = {};
                    let dhKeyBytes;
                    if(DataBase.isEncrypted) {  //re-encrypt keys
                        for(let [keyHash, oldKey] of Object.entries(DataBase.keys)) {
                            let newKey = Object.assign({}, oldKey);
                            let keyBytes = await this.AesDecrypt(oldDbKey, this.Base64ToBytes(oldKey.k/*key*/));
                            newKey.k = this.BytesToBase64(await this.AesEncrypt(newDbKey, keyBytes));
                            keys[keyHash] = newKey;
                        }
                        dhKeyBytes = await this.AesDecrypt(oldDbKey, this.Base64ToBytes(DataBase.dhPrivateKey));
                    }
                    else {                      //encrypt keys
                        for(let [keyHash, oldKey] of Object.entries(DataBase.keys)) {
                            let newKey = Object.assign({}, oldKey);
                            let keyBytes = this.Base64ToBytes(oldKey.k/*key*/);
                            newKey.k = this.BytesToBase64(await this.AesEncrypt(newDbKey, keyBytes));
                            keys[keyHash] = newKey;
                        }
                        dhKeyBytes = this.Base64ToBytes(DataBase.dhPrivateKey);
                    }
                    newDataBase.dhPrivateKey = this.BytesToBase64(await this.AesEncrypt(newDbKey, dhKeyBytes));
                    newDataBase.keys = keys;
                }
                else if(DataBase.isEncrypted) { //decrypt keys
                    delete newDataBase.dbPasswordSalt;
                    delete newDataBase.dbKeySalt;
                    delete newDataBase.dbPasswordHash;
                    let keys = {};
                    for(let [keyHash, oldKey] of Object.entries(DataBase.keys)) {
                        let newKey = Object.assign({}, oldKey);
                        let keyBytes = await this.AesDecrypt(oldDbKey, this.Base64ToBytes(oldKey.k/*key*/));
                        newKey.k = this.BytesToBase64(keyBytes);
                        keys[keyHash] = newKey;
                    }
                    let dhKeyBytes = await this.AesDecrypt(oldDbKey, this.Base64ToBytes(DataBase.dhPrivateKey));
                    newDataBase.dhPrivateKey = this.BytesToBase64(dhKeyBytes);
                    newDataBase.keys = keys;
                }

                DataBase = newDataBase;
                Cache.dbKey = newDbKey;
                this.FastSaveDb();
                if(callback) callback();
            });
        },
        NewDhKeys: async function() {
            let dhKeys = await this.DhGenerateKeys();
            let dhPrivateKeyBytes;
            let dhPrivateKeyFallback = false;
            try {
                dhPrivateKeyBytes = await this.DhExportPrivateKey(dhKeys.privateKey);
            }
            catch(e) {
                dhPrivateKeyBytes = await this.DhExportPrivateKeyFallback(dhKeys.privateKey);
                dhPrivateKeyFallback = true;
            }
            
            let dhPublicKeyBytes = await this.DhExportPublicKey(dhKeys.publicKey);

            if(DataBase.isEncrypted)
                dhPrivateKeyBytes = await this.AesEncrypt(Cache.dbKey, dhPrivateKeyBytes);

            if(dhPrivateKeyFallback) DataBase.dhPrivateKeyFallback = true;
            else delete DataBase.dhPrivateKeyFallback;
            DataBase.dhPrivateKey = this.BytesToBase64(dhPrivateKeyBytes);
            DataBase.dhPublicKey = this.BytesToBase64(dhPublicKeyBytes);
            this.FastSaveDb();
        },
        ReadDhKey: async function() {
            let dhPrivateKeyBytes = this.Base64ToBytes(DataBase.dhPrivateKey);
            if(DataBase.isEncrypted)
                dhPrivateKeyBytes = await this.AesDecrypt(Cache.dbKey, dhPrivateKeyBytes);
            
            if(DataBase.dhPrivateKeyFallback) {
                let dhPrivateKey = await this.DhImportPrivateKeyFallback(dhPrivateKeyBytes);
                try {
                    dhPrivateKeyBytes = await this.DhExportPrivateKey(dhPrivateKey);
                    if(DataBase.isEncrypted)
                        dhPrivateKeyBytes = await this.AesEncrypt(Cache.dbKey, dhPrivateKeyBytes);
                        
                    delete DataBase.dhPrivateKeyFallback;
                    DataBase.dhPrivateKey = this.BytesToBase64(dhPrivateKeyBytes);
                }
                catch(e) { }
                
                return dhPrivateKey;
            }
            else return await this.DhImportPrivateKey(dhPrivateKeyBytes);
        },
        ChangeKeyDescriptor: function(hash, descriptor) { DataBase.keys[hash].d = descriptor.replace(/[`\r\n]/g, "").substr(0, 250); this.FastSaveDb() },
        ChangeKeyHidden: function(hash, hidden) { DataBase.keys[hash].h = hidden; this.FastSaveDb() },
        DeleteKey: async function(hash) {
            if(hash === DataBase.personalKeyHash) {
                await this.NewPersonalKey();
                return;
            }
            Utils.ReplaceChannelKeys(hash, DataBase.personalKeyHash);
            delete DataBase.keys[hash];
            this.dbChanged = true;
        },
        ReplaceChannelKeys: function(oldHash, newHash) { Object.values(DataBase.channels).forEach(x => { if(x.k === oldHash) x.k = newHash } ); this.FastSaveDb() },
        NewPersonalKey: async function() {
            if(DataBase.personalKeyHash != null) this.ChangeKeyDescriptor(DataBase.personalKeyHash, "#Your old personal key#");
            let newPersonalKeyHash = await this.SaveKey(this.GetRandomBytes(32), 3/*personal*/, "#Your personal key#");
            this.ReplaceChannelKeys(DataBase.personalKeyHash, newPersonalKeyHash);
            DataBase.personalKeyHash = newPersonalKeyHash;
            this.FastSaveDb();
        },

        FormatDescriptor: function(descriptor) {
            return descriptor.replace(/<@(\d{1,20})>/g, (m, x) => {
                let user = Discord.getUser(x);
                if(user != null) x = user.username;
                return x;
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
        DeleteChannelConfig: function(channelId) {
            if(Cache.channelId === channelId) Cache.channelConfig = null;
            delete DataBase.channels[channelId];
            this.dbChanged = true;
        },
        GetCurrentChannelKeyHash: () => {
            return (Cache.channelConfig != null) ? Cache.channelConfig.k : DataBase.personalKeyHash;
        },
        GetCurrentChannelEncrypt: () => {
            return Cache.channelConfig != null && Cache.channelConfig.e && Cache.channelBlacklist !== 1;
        },
        ToggleCurrentChannelEncrypt: function() {
            if(Cache.channelBlacklist === 1) return;

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
                if(hash === oldKeyHash) return;
                //if(DataBase.keys[oldKeyHash].t/*type*/ === 2/*conversation*/) delete DataBase.keys[oldKeyHash];
                Cache.channelConfig.k = hash;
                this.dbChanged = true;
            }
        },
        GetCurrentChannelIsDm: () => Discord.getChannel(Cache.channelId).type === 1,
        GetCurrentDmUserId: () => Discord.getChannel(Cache.channelId).recipients[0],
        RefreshCache: () => {
            Cache.channelId = Discord.getChannelId();
            Cache.channelConfig = DataBase.channels[Cache.channelId];
            if(Cache.channelConfig != null) Cache.channelConfig.l = Date.now();
            if(Blacklist != null) {
                let channel = Discord.getChannel(Cache.channelId);
                if(channel == null) return false;
                let guildId = channel.guild_id;
                Cache.channelBlacklist = (guildId == null) ? null : Blacklist[guildId];
            }
            return true;
        },

        SendSystemMessage: function(channelId, sysmsg) {
            Discord.enqueue({
                type: 'send',
                message: {
                    channelId: channelId,
                    nonce: this.GetNonce(),
                    content: "",
                    embed: {
                        color: BaseColorInt,
                        author: {
                            name: "-----SYSTEM MESSAGE-----",
                            icon_url: "https://i.imgur.com/pFuRfDE.png",
                            url: "https://gitlab.com/An0/SimpleDiscordCrypt"
                        },
                        description: sysmsg,
                        footer: {
                            text: "SimpleDiscordCrypt",
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
            let key = await this.GetKeyByHash(keyHash);
            let personalKey = await this.GetKeyBytesByHash(DataBase.personalKeyHash);
            let personalKeyPayload = this.PayloadEncode(await this.AesEncrypt(key, personalKey));

            this.SendSystemMessage(channelId, `*type*: \`PERSONAL KEY\`\n*key*: \`${keyHashPayload}\`\n*personalKey*: \`${personalKeyPayload}\``);

            delete channelConfig.w;
            this.dbChanged = true;
        },
        messageDeleteListeners: {},
        AddMessageDeleteListener: function(messageId, listener) {
            let listeners = this.messageDeleteListeners[messageId];
            if(listeners == null) this.messageDeleteListeners[messageId] = [listener];
            else listeners.push(listener);
        },
        RemoveMessageDeleteListener: function(messageId, listener) {
            let listeners = this.messageDeleteListeners[messageId];
            if(listeners == null) return;
            let index = listeners.indexOf(listener);
            if(index === -1) return;
            if(listeners.length === 1) { delete this.messageDeleteListeners[messageId]; return; }
            listeners.splice(index, 1);
        },
        MessageDeleteEvent: function(messageId) {
            let listeners = this.messageDeleteListeners[messageId];
            if(listeners == null) return;
            for(let listener of listeners) listener();
        },
        MessageDeleteBulkEvent: function(messageIdList) {
            let listenerIds = Object.keys(this.messageDeleteListeners);
            if(listenerIds.length === 0) return;
            let foundIds = this.Intersect(messageIdList.sort(), listenerIds.sort());
            for(let messageId of foundIds) this.MessageDeleteEvent();
        },
        keyShareListeners: {},
        AddKeyShareListener: function(keyHash, listener) {
            let listeners = this.keyShareListeners[keyHash];
            if(listeners == null) this.keyShareListeners[keyHash] = [listener];
            else listeners.push(listener);
        },
        RemoveKeyShareListener: function(keyHash, listener) {
            let listeners = this.keyShareListeners[keyHash];
            if(listeners == null) return;
            let index = listeners.indexOf(listener);
            if(index === -1) return;
            if(listeners.length === 1) { delete this.keyShareListeners[keyHash]; return; }
            listeners.splice(index, 1);
        },
        KeyShareEvent: function(keyHash) {
            let listeners = this.keyShareListeners[keyHash];
            if(listeners == null) return;
            for(let listener of listeners) listener();
        },
        ongoingKeyExchanges: {},
        InitKeyExchange: async function(user, autoOnMessage, autoOnKey) {
            let userId = user.id;
            let currentUserId = Discord.getCurrentUser().id;
            if(userId === currentUserId) return;

            let channelId = Discord.getDMFromUserId(userId);
            let channelConfig;
            if(autoOnMessage) {
                channelConfig = this.GetChannelConfig(channelId);
                if(channelConfig != null && (channelConfig.s/*systemMessageTime*/ > 0 || channelConfig.w/*waitingForSystemMessage*/))
                    return;

                if(/friend/i.test(DataBase.autoKeyExchange) && !Discord.isFriend(userId)) {
                    if(this.ongoingKeyExchanges[userId]) return;
                    this.ongoingKeyExchanges[userId] = true;
                    if(user.username == null) user = Discord.getUser(userId);
                    let popupOverride = {};
                    let popup = PopupManager.NewPromise(`Would you like to initiate key exchange with ${user.username}#${user.discriminator}?`, popupOverride);
                    const autoCancel = () => { delete this.ongoingKeyExchanges[userId]; popupOverride.cancel(); };
                    this.AddMessageDeleteListener(autoOnMessage, autoCancel);
                    this.AddKeyShareListener(autoOnKey, autoCancel);
                    let force = await popup;
                    this.RemoveMessageDeleteListener(autoOnMessage, autoCancel);
                    this.AddKeyShareListener(autoOnKey, autoCancel);
                    if(!force) return;
                }
            }
            delete this.ongoingKeyExchanges[userId]; //this way once cancelled you either have to add them as friend or restart the plugin

            keyExchangeWhitelist[userId] = true;

            if(channelId == null) {
                channelId = await Discord.ensurePrivateChannel(currentUserId, userId);
            }

            let dhPublicKeyPayload = this.PayloadEncode(this.Base64ToBytes(DataBase.dhPublicKey));

            this.SendSystemMessage(channelId, `*type*: \`DH KEY\`\n*dhKey*: \`${dhPublicKeyPayload}\``);
            channelConfig = channelConfig || this.GetOrCreateChannelConfig(channelId);
            channelConfig.w = 1;
            this.dbChanged = true;
        },
        ongoingKeyRequests: {},
        RequestKey: async function(keyHash, user, autoOnMessage) {
            let userId = user.id;
            if(DataBase.keys[keyHash] != null) return;

            let channelId = Discord.getDMFromUserId(userId);
            if(channelId == null) return;

            let channelConfig;
            let requestId = keyHash + userId;
            if(autoOnMessage) {
                channelConfig = this.GetChannelConfig(channelId);
                if(channelConfig != null && channelConfig.w/*waitingForSystemMessage*/)
                    return;

                if(/friend/i.test(DataBase.autoKeyExchange) && !Discord.isFriend(userId)) {
                    if(this.ongoingKeyRequests[requestId]) return;
                    if(this.ongoingKeyExchanges[userId]) return;
                    this.ongoingKeyRequests[requestId] = true;
                    if(user.username == null) user = Discord.getUser(userId);
                    let popupOverride = {};
                    let popup = PopupManager.NewPromise(`Would you like to request key from ${user.username}#${user.discriminator}`, popupOverride);
                    const autoCancel = () => { delete this.ongoingKeyRequests[requestId]; popupOverride.cancel(); };
                    this.AddMessageDeleteListener(autoOnMessage, autoCancel);
                    this.AddKeyShareListener(keyHash, autoCancel);
                    let force = await popup;
                    this.RemoveMessageDeleteListener(autoOnMessage, autoCancel);
                    this.RemoveKeyShareListener(keyHash, autoCancel);
                    if(!force) return;
                }
            }
            delete this.ongoingKeyRequests[requestId];

            keyExchangeWhitelist[userId] = true;

            let requestedKeyPayload = this.PayloadEncode(this.Base64ToBytes(keyHash));

            this.SendSystemMessage(channelId, `*type*: \`KEY REQUEST\`\n*requestedKey*: \`${requestedKeyPayload}\``);
            channelConfig = channelConfig || this.GetOrCreateChannelConfig(channelId);
            channelConfig.w = 1;
            this.dbChanged = true;
        },
        ShareKey: async function(keyHash, channelId, nonForced, user) {
            let keyObj = DataBase.keys[keyHash];
            if(keyObj == null) {
                this.SendSystemMessage(channelId, `*type*: \`KEY SHARE\`\n*status*: \`NOT FOUND\``);
                return;
            }
            if(nonForced != null && (nonForced || keyObj.h/*hidden*/)) {
                if(user.username == null) user = Discord.getUser(user.id);
                if(!await PopupManager.NewPromise(`Would you like to share key "${Utils.FormatDescriptor(keyObj.d)}" with ${user.username}#${user.discriminator}`)) {
                    this.SendSystemMessage(channelId, `*type*: \`KEY SHARE\`\n*status*: \`DENIED\``);
                    return;
                }
            }

            let sharedKeyBase64 = keyObj.k;
            let sharedKeyBytes = this.Base64ToBytes(sharedKeyBase64);
            if(DataBase.isEncrypted)
                sharedKeyBytes = await this.AesDecrypt(Cache.dbKey, sharedKeyBytes);

            let channelConfig = this.GetOrCreateChannelConfig(channelId);
            let key = await this.GetKeyByHash(channelConfig.k);
            let keyHashPayload = this.PayloadEncode(this.Base64ToBytes(channelConfig.k));

            let sharedKeyPayload = this.PayloadEncode(await Utils.AesEncrypt(key, sharedKeyBytes));

            if(keyHash === DataBase.personalKeyHash) {
                let keyDescriptor = `<@${Discord.getCurrentUser().id}>'s personal key`;
                this.SendSystemMessage(channelId, `*type*: \`KEY SHARE\`\n*status*: \`OK\`\n*key*: \`${keyHashPayload}\`\n*sharedKey*: \`${sharedKeyPayload}\`\n*keyType*: \`PERSONAL\`\n*keyDescriptor*: \`${keyDescriptor}\``);
            }
            else {
                const keyTypes = { 1:'GROUP', 2:'CONVERSATION', 3:'PERSONAL' };
                let keyType = keyTypes[keyObj.t];
                let keyDescriptor = keyObj.d;
                let sharedChannels = [];
                for(let [id, config] of Object.entries(DataBase.channels)) {
                    if(config.k === keyHash) {
                        let channel = Discord.getChannel(id);
                        if(channel == null || channel.type === 1/*DM*/) continue;

                        if(sharedChannels.push(id) === 20) break;
                    }
                }
                let sharedChannelsJson = JSON.stringify(sharedChannels);

                this.SendSystemMessage(channelId, `*type*: \`KEY SHARE\`\n*status*: \`OK\`\n*key*: \`${keyHashPayload}\`\n*sharedKey*: \`${sharedKeyPayload}\`\n*keyType*: \`${keyType}\`\n*keyDescriptor*: \`${keyDescriptor}\`\n*sharedChannels*: \`${sharedChannelsJson}\``);
            }

            delete channelConfig.w;
            this.dbChanged = true;
        },
        UpdateMessageContent: (message) => {
            if(message.edited_timestamp == null) message.edited_timestamp = message.timestamp;
            Discord.dispatch({type: 'MESSAGE_UPDATE', message});
        }
    });
//Discord.window.SdcUtils = Utils;
//Discord.window.SdcDiscord = Discord;

    if(!window.crypto || !crypto.subtle) { Utils.Error("Crypto API not found."); return -1; }

    Discord.window.SdcDownloadUrl = (filename, url) => {
        let a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style = "display:none"; 
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };
    Discord.window.SdcDecryptDl = async (filename, keyHash, url) => {
        let encryptedFileBuffer = await Utils.DownloadFile(url);
        let fileBuffer = await Utils.AesDecrypt(await Utils.GetKeyByHash(keyHash), encryptedFileBuffer);
        Utils.DownloadBlob(filename, new File([fileBuffer], filename));
    };
    Discord.window.SdcClearKeys = (filterFunc) => {
        const typeLookup = [null, 'GROUP', 'CONVERSATION', 'PERSONAL'];
        for(let [hash, keyObj] of Object.entries(DataBase.keys)) {
            if(filterFunc({ type: typeLookup[keyObj.t], lastseen: keyObj.l, descriptor: Utils.FormatDescriptor(keyObj.d), hidden: !!keyObj.h, registered: keyObj.r }))
                Utils.DeleteKey(hash);
        }
    };
    Discord.window.SdcClearChannels = (filterFunc) => {
        for(let [hash, channelObj] of Object.entries(DataBase.channels)) {
            if(filterFunc({ lastseen: channelObj.l, descriptor: Utils.FormatDescriptor(channelObj.d), encrypted: !!channelObj.e }))
                Utils.DeleteChannelConfig(hash);
        }
    };
    
    
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

    LockMessages(true);
    Utils.LoadDb(() => { Load(); UnlockMessages(); }, UnlockMessages);

    return 1;
}


async function handleMessage(event) {
    return await processMessage(event.message);
}
async function handleMessages(event) {
    for(let message of event.messages.slice()) //in case they reverse the array
        await processMessage(message);
}
async function handleSearch(event) {
    for(let group of event.messages)
        for(let message of group)
            await processMessage(message);
}

const messageRegex = /^([⠀-⣿]{16,}) `(?:SimpleDiscordCrypt|𝘚𝘪𝘮𝘱𝘭𝘦𝘋𝘪𝘴𝘤𝘰𝘳𝘥𝘊𝘳𝘺𝘱𝘵)`$/;
const unknownKeyMessage = "```fix\n-----ENCRYPTED MESSAGE WITH UNKNOWN KEY-----\n```";
const invalidMessage = "```diff\n-⁣----ENCRYPTED MESSAGE WITH UNKNOWN FORMAT-----\n```"; //invisible separator after the first '-'
async function processMessage(message) {

    let match = messageRegex.exec(message.content);
    if(match != null) { //simple messsage
        return await decryptMessage(message, match[1]);
    }

    return await processEmbeds(message);
}

var mediaTypes = { 'png': 'img', 'jpg': 'img', 'jpeg': 'img', 'gif': 'img', 'webp': 'img' };
if(FixedCsp) mediaTypes['webm'] = mediaTypes['mp4'] = 'video';
const extensionRegex = /\.([^.]+)$/;
var downloadLocked = false;
var downloadLocks = [];
async function decryptAttachment(key, keyHash, message, attachment) {
    let encryptedFilename = Utils.Base64urlToBytes(attachment.filename);
    let filename;
    try {
        filename = await Utils.AesDecryptString(key, encryptedFilename);
    }
    catch(e) {
        filename = "file";
    }

    attachment.filename = filename;
    //attachment.size = fileBuffer.byteLength;
    let encryptedUrl = attachment.url;

    let match = extensionRegex.exec(filename);
    let mediaType;
    if(match != null) mediaType = mediaTypes[match[1].toLowerCase()];
    if(mediaType == null) {
        attachment.url = `javascript:SdcDecryptDl(${JSON.stringify(filename)},'${keyHash}','${encryptedUrl}')`;
        delete attachment.proxy_url;
        message.attachments.push(attachment);
        return;
    }

    let spoiler = filename.startsWith('SPOILER_');
    
    let placeholder = (spoiler && mediaType === 'img') ? {
        type: 'rich',
        thumbnail: {
            url: "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==",
            width: 1,
            height: 80
        }
    } : {
        type: 'image',
        thumbnail: {
            url: "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==",
            width: 1,
            height: 300
        }
    };
    message.embeds.push(placeholder);

    (async () => {
        if(downloadLocked) {
            await (new Promise((resolve) => downloadLocks.unshift(resolve)));
        }
        else downloadLocked = true;

        let encryptedFileBuffer;
        try {
            encryptedFileBuffer = await Utils.DownloadFile(encryptedUrl);
        }
        finally {
            if(downloadLocks.length !== 0) downloadLocks.pop()();
            else downloadLocked = false;
        }

        let fileBuffer = await Utils.AesDecrypt(await Utils.GetKeyByHash(keyHash), encryptedFileBuffer);
        let blob = new File([fileBuffer], filename);
        let bloburl = `${URL.createObjectURL(new File([fileBuffer], filename))}#${filename}`;
        let url;
        let downloadUrl = `javascript:SdcDownloadUrl(${JSON.stringify(filename)},'${bloburl}')`;

        let width;
        let height;
        if(FixedCsp) {
            url = bloburl;
            let tmpMedia = document.createElement(mediaType);
            if(mediaType === 'video') {
                await (new Promise((resolve) => {
                    tmpMedia.onloadeddata = () => { tmpMedia.ontimeupdate = resolve; tmpMedia.currentTime = 0; };
                    tmpMedia.src = url;
                }));
                width = tmpMedia.videoWidth;
                height = tmpMedia.videoHeight;
                let canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                let ctx = canvas.getContext('2d');
                if(spoiler) ctx.filter = "blur(50px)";
                ctx.drawImage(tmpMedia, 0, 0);

                Object.assign(placeholder, {
                    type: 'video',
                    //color: BaseColorInt,
                    url: downloadUrl,
                    title: "Download",
                    thumbnail: { url: URL.createObjectURL(await new Promise((resolve) => canvas.toBlob(resolve))) + "#", width, height },
                    video: { url: downloadUrl, proxy_url: url, width, height }
                });
            }
            else {
                await (new Promise((resolve) => {
                    tmpMedia.onload = resolve;
                    tmpMedia.src = url;
                }));
                width = tmpMedia.width;
                height = tmpMedia.height;

                Object.assign(placeholder, {
                    type: spoiler ? 'rich' : 'image',
                    url: downloadUrl,
                    thumbnail: {
                        url: downloadUrl,
                        proxy_url: url,
                        width,
                        height
                    }
                });
            }
        }
        else {
            let id = Utils.BytesToBase64(Utils.GetRandomBytes(16));
            url = `https://media.discordapp.net/attachments/479272118538862592/479272171944804377/keylogo.png#${id}`;
            let bitmap = await createImageBitmap(blob);
            width = bitmap.width;
            height = bitmap.height;

            Patcher.Images[id] = blob;

            Object.assign(placeholder, {
                type: spoiler ? 'rich' : 'image',
                url: downloadUrl,
                thumbnail: {
                    url: downloadUrl,
                    proxy_url: url,
                    width,
                    height
                }
            });
        }

        Discord.dispatch({type: 'MESSAGE_UPDATE', message});

        if(message.channel_id !== Cache.channelId) return;
        let messageContainer = document.querySelector(`.scroller[class^="messages"]`);
        if(messageContainer != null) {
            if(messageContainer.scrollTop + 1 >= (messageContainer.scrollHeight - messageContainer.clientHeight)) return; //scrolled to bottom

            let displayHeight = height;
            if(!spoiler) {
                if(width > 400 || height > 300) { //image will be resized
                    if(width / 400 > height / 300) { //scale by with
                        displayHeight = Math.round(height / (width / 400));
                    }
                    else { //scale by height
                        displayHeight = 300;
                    }
                }
                if(displayHeight !== 300) messageContainer.scrollTop += 300 - displayHeight;
            }
            else {
                if(width > 80 || height > 80) { //image will be resized
                    if(width > height) {
                        displayHeight = Math.round(height / (width / 80));
                    }
                    else {
                        displayHeight = 80;
                    }
                }
                if(displayHeight !== 80) messageContainer.scrollTop += 80 - displayHeight;
            }

        }
    })();
}

function createYoutubeEmbed(id) {
    return {
        type: 'video',
        url: `https://youtube.com/watch?v=${id}`,
        thumbnail: { url: `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`, width: 1280, height: 720 },
        video: { url: `https://youtube.com/embed/${id}`, width: 1280, height: 720 }
    }
}
const youtubeRegex = /[?&]v=([\w-]+)/;
function embedYoutube(message, url, queryString) {
    let match = youtubeRegex.exec(queryString);
    if(match != null) message.embeds.push(createYoutubeEmbed(match[1]));
}
const youtuRegex = /^[\w-]+/;
function embedYoutu(message, url, queryString) {
    let match = youtuRegex.exec(queryString);
    if(match != null) message.embeds.push(createYoutubeEmbed(match[0]));
}
const imageRegex = /\.(?:png|jpe?g|gif|webp)$/i;
function embedImage(message, url, queryString) {
    if(!imageRegex.test(queryString)) return;

    let tmpimg = document.createElement('img');
    tmpimg.onload = () => {
        message.embeds.push({
            type: 'image',
            url,
            thumbnail: {
                url,
                width: tmpimg.width,
                height: tmpimg.height
            }
        });
        Discord.dispatch({type: 'MESSAGE_UPDATE', message});
    };
    tmpimg.src = url;
}
function embedEncrypted(message, url, queryString) {
    message.embeds.push({
        type: 'video',
        url,
        thumbnail: { url: "https://media.discordapp.net/attachments/449522590978146304/465783850144890890/key128.png", width: 128, height: 128 },
        video: { url, width: 400, height: 300 }
    });
}
function embedMega(message, url, queryString) {
    if(queryString.startsWith("embed"))
        embedEncrypted(message, url, queryString);
}
const linkEmbedders = {
    "www.youtube.com": embedYoutube,
    "youtu.be": embedYoutu,
    "cdn.discordapp.com": embedImage,
    "media.discordapp.net": embedImage,
    "i.imgur.com": embedImage,
    "i.redd.it": embedImage,
    "share.riseup.net": embedEncrypted,
    "mega.nz": embedMega
};
let urlRegex = /https?:\/\/((?:[^\s\/?\.#]+\.)+(?:[^\s\/?\.#]+))\/([^\s<>'"]+)/g
function postProcessMessage(message, content) {
    let currentUser = Discord.getCurrentUser();
    if(content.includes(`<@${currentUser.id}>`) || content.includes(`<@!${currentUser.id}>`))
        message.mentions = [currentUser];

    let url;
    while ((url = urlRegex.exec(content)) != null) {
        let linkEmbedder = linkEmbedders[url[1]];
        if(linkEmbedder != null) linkEmbedder(message, url[0], url[2]);
    }
    urlRegex.lastIndex = 0;
}

let keywaitingMessages = {};
async function decryptWaitingMessages(keyHash) {
    let waitingMessages = keywaitingMessages[keyHash];
    if(waitingMessages == null) return;
    for(let [message, payload, originalRef] of waitingMessages) {
        decryptMessage(Object.assign(originalRef, message), payload).then(() => Utils.UpdateMessageContent(originalRef));
    }
    delete keywaitingMessages[keyHash];
}

async function decryptMessage(message, payload) {
    let payloadBuffer = Utils.PayloadDecode(payload).buffer;
    let keyHashBytes = payloadBuffer.slice(0, 16);
    let keyHashBase64 = Utils.BytesToBase64(keyHashBytes);
    let key = await Utils.GetKeyByHash(keyHashBase64);

    if(key == null) {
        let messageDeleted = false;
        if(!DataBase.isSecondary) {
            if(message.author != null) Utils.InitKeyExchange(message.author, message.id, keyHashBase64);

            let onMessageDelete;
            let messageDeleteException = new Promise((resolve) => {
                onMessageDelete = () => { messageDeleted = true; resolve(); };
                Utils.AddMessageDeleteListener(message.id, onMessageDelete);
            });

            for(let i = 1; i <= 5; i++) {
                await Promise.race([Utils.Sleep(i * 200), messageDeleteException]);
                if(messageDeleted) break;

                key = await Utils.GetKeyByHash(keyHashBase64);
                if(key != null) break;

                if(message.author != null) Utils.RequestKey(keyHashBase64, message.author, message.id);
            }
            
            Utils.RemoveMessageDeleteListener(message.id, onMessageDelete);
        }
        if(key == null) {
            if(!messageDeleted) {
                let waitingMessages = keywaitingMessages[keyHashBase64];
                if(waitingMessages == null) keywaitingMessages[keyHashBase64] = waitingMessages = [];
                waitingMessages.push([Object.assign({}, message), payload, message]);
            }
            message.content = unknownKeyMessage;
            message.embeds = [];
            message.attachments = [];
            return messageDeleted;
        }
    }

    message.embeds = []; //remove embeds in case of edit and in case of the payload is from the embed

    if(payloadBuffer.byteLength === 16) {
        message.content = "<:ENC:465534298662109185>⁣"; //invisible separator at the end to make the emoji smaller
    }
    else {
        let content;
        try {
            let encryptedMessage = payloadBuffer.slice(16);
            content = await Utils.AesDecryptDecompressString(key, encryptedMessage);
        }
        catch(e) {
            message.content = invalidMessage;
            message.attachments = [];
            return false;
        }
        message.content = "<:ENC:465534298662109185>" + content;
        //message.content = content.replace(/^/gm, "<:ENC:465534298662109185>"); //bad for code blocks
        postProcessMessage(message, content);
    }

    if(message.attachments != null && message.attachments.length !== 0) {
        let attachments = message.attachments;
        message.attachments = [];
        for(let attachment of attachments) {
            try {
                await decryptAttachment(key, keyHashBase64, message, attachment);
            }
            catch(e) {
                attachment.filename = "-----ENCRYPTED FILE FAILED TO DECRYPT-----";
            }
        }
    }
    return false;
}

function getSystemMessageProperty(propertyName, sysmsg) {
    let match = new RegExp(`\\*${propertyName}\\*:\\s*\`(.*?)\``, "i").exec(sysmsg);
    return (match == null) ? null : match[1];
}


const unknownKeySystemMessage = "```fix\n-----SYSTEM MESSAGE WITH UNKNOWN KEY-----\n```";
const invalidSystemMessage = "```diff\n-⁣----SYSTEM MESSAGE WITH UNKNOWN FORMAT-----\n```";
const blockedSystemMessage = "```fix\n-----SYSTEM MESSAGE BLOCKED-----\n```";
var keyExchangeWhitelist = {};
async function processSystemMessage(message, sysmsg) {
    let channel = Discord.getChannel(message.channel_id);
    if(channel.type !== 1/*DM*/) return false;

    message.embeds = [];
    let timestamp = new Date(message.timestamp).getTime();
    let channelConfig = Utils.GetOrCreateChannelConfig(message.channel_id);
    let oldMessage = true;
    if(channelConfig.s/*systemMessageTime*/ == null || timestamp > channelConfig.s) {
        channelConfig.s = timestamp;
        Utils.dbChanged = true;
        oldMessage = false;
    }

    let messageType = getSystemMessageProperty('type', sysmsg);
    let userId;
    if(message.author == null) oldMessage = true;
    else {
        userId = message.author.id;
        if(userId === Discord.getCurrentUser().id) oldMessage = true;
    }

    if(DataBase.isSecondary && !keyExchangeWhitelist[userId]) oldMessage = true;

    let nonForced = true;
    if(!oldMessage) {
        message.content = blockedSystemMessage;
        if(/friend/i.test(DataBase.autoKeyExchange) && !Discord.isFriend(userId)) {
            if(messageType === 'DH KEY' || messageType === 'DH RESPONSE' || messageType === 'PERSONAL KEY' || messageType === 'KEY SHARE') {
                if(!keyExchangeWhitelist[userId]) {
                    //let user = Discord.getUser(userId);
                    if(!await PopupManager.NewPromise(`Would you like to accept key exchange from ${message.author.username}#${message.author.discriminator}`)) return false;
                    keyExchangeWhitelist[userId] = true;
                }
            }
        }
        else nonForced = false;
    }

    switch(messageType) {
        case 'DH KEY': {
            message.content = "💻 H-hi I would like to know you better";
            if(oldMessage) return false;

            let dhKeyPayload = getSystemMessageProperty('dhKey', sysmsg);
            if(dhKeyPayload == null) break;
            try {
                let dhRemoteKeyBytes = Utils.PayloadDecode(dhKeyPayload);
                let dhRemoteKey = await Utils.DhImportPublicKey(dhRemoteKeyBytes);

                let dhPrivateKey = await Utils.ReadDhKey();

                let sharedSecret = await Utils.DhGetSecret(dhPrivateKey, dhRemoteKey);
                let keyHash = await Utils.SaveKey(sharedSecret, 2/*conversation*/, `DM key with <@${message.author.id}>`);
                channelConfig.k/*keyHash*/ = keyHash;
                if(message.channel_id === Cache.channelId) {
                    Cache.channelConfig = channelConfig; //in case it's a new config
                    MenuBar.Update();
                }

                let dhPublicKeyPayload = Utils.PayloadEncode(Utils.Base64ToBytes(DataBase.dhPublicKey));

                let key = await Utils.AesImportKey(sharedSecret);

                let encryptedPersonalKey = await Utils.AesEncrypt(key, await Utils.GetKeyBytesByHash(DataBase.personalKeyHash));
                let personalKeyPayload = Utils.PayloadEncode(encryptedPersonalKey);

                Utils.SendSystemMessage(message.channel_id, `*type*: \`DH RESPONSE\`\n*dhKey*: \`${dhPublicKeyPayload}\`\n*personalKey*: \`${personalKeyPayload}\``);

                channelConfig.w = 1; //waitingForSystemMessage
                Utils.dbChanged = true;
                decryptWaitingMessages(keyHash);
            }
            catch(e) { break }
        } return true;
        case 'DH RESPONSE': {
            message.content = "💻 I like you :3, you can have my number";
            if(oldMessage) return false;

            let dhKeyPayload = getSystemMessageProperty('dhKey', sysmsg);
            if(dhKeyPayload == null) break;
            let remotePersonalKeyPayload = getSystemMessageProperty('personalKey', sysmsg);
            if(remotePersonalKeyPayload == null) break;
            try {
                let dhRemoteKeyBytes = Utils.PayloadDecode(dhKeyPayload);
                let dhRemoteKey = await Utils.DhImportPublicKey(dhRemoteKeyBytes);

                let dhPrivateKey = await Utils.ReadDhKey();

                let sharedSecret = await Utils.DhGetSecret(dhPrivateKey, dhRemoteKey);
                let keyHash = await Utils.SaveKey(sharedSecret, 2/*conversation*/, `DM key with <@${message.author.id}>`);
                channelConfig.k/*keyHash*/ = keyHash;
                Utils.dbChanged = true;
                if(message.channel_id === Cache.channelId) {
                    Cache.channelConfig = channelConfig;
                    MenuBar.Update();
                }

                let key = await Utils.AesImportKey(sharedSecret);

                let remotePersonalKey = await Utils.AesDecrypt(key, Utils.PayloadDecode(remotePersonalKeyPayload));
                if(remotePersonalKey.byteLength !== 32) break;
                let remotePersonalKeyHash = await Utils.SaveKey(remotePersonalKey, 3/*personal*/, `<@${message.author.id}>'s personal key`);

                await Utils.SendPersonalKey(message.channel_id);
                
                decryptWaitingMessages(keyHash);
                decryptWaitingMessages(remotePersonalKeyHash);
            }
            catch(e) { break }
        } return true;
        case 'PERSONAL KEY': {
            message.content = "💻 Here is my number, now we can talk any time!!";
            if(oldMessage) return false;

            let keyHashPayload = getSystemMessageProperty('key', sysmsg);
            if(keyHashPayload == null) break;
            let remotePersonalKeyPayload = getSystemMessageProperty('personalKey', sysmsg);
            if(remotePersonalKeyPayload == null) break;
            try {
                let keyHash = Utils.BytesToBase64(Utils.PayloadDecode(keyHashPayload));
                let key = await Utils.GetKeyByHash(keyHash);
                if(key == null) {
                    message.content = unknownKeySystemMessage;
                    return true;
                }

                let remotePersonalKey = await Utils.AesDecrypt(key, Utils.PayloadDecode(remotePersonalKeyPayload));
                if(remotePersonalKey.byteLength !== 32) break;
                let remotePersonalKeyHash = await Utils.SaveKey(remotePersonalKey, 3/*personal*/, `<@${message.author.id}>'s personal key`);

                delete channelConfig.w; //waitingForSystemMessage
                Utils.dbChanged = true;
                delete keyExchangeWhitelist[userId];
                decryptWaitingMessages(remotePersonalKeyHash);
            }
            catch(e) { break }
        } return true;
        case 'KEY REQUEST': {
            message.content = "💻 Hey, can you tell me what this means?";
            if(oldMessage) return false;

            let requestedKeyPayload = getSystemMessageProperty('requestedKey', sysmsg);
            if(requestedKeyPayload == null) break;
            try {
                let keyHash = Utils.BytesToBase64(Utils.PayloadDecode(requestedKeyPayload));

                Utils.ShareKey(keyHash, message.channel_id, nonForced, message.author); //no need to wait
            }
            catch(e) { break }
        } return true;
        case 'KEY SHARE': {
            let status = getSystemMessageProperty('status', sysmsg);
            const statusMsgs = {
                'OK': "💻 There you go, take good care of it!",
                'DENIED': "💻 That's a secret!!!",
                'NOT FOUND': "💻 Huh? I don't know"
            };
            let statusMsg = statusMsgs[status];
            if(statusMsg == null) break;
            message.content = statusMsg;
            if(oldMessage || status !== 'OK') return false;

            let keyHashPayload = getSystemMessageProperty('key', sysmsg);
            if(keyHashPayload == null) break;
            let sharedKeyPayload = getSystemMessageProperty('sharedKey', sysmsg);
            if(sharedKeyPayload == null) break;
            let keyTypeName = getSystemMessageProperty('keyType', sysmsg);
            if(keyTypeName == null) break;
            let keyDescriptor = getSystemMessageProperty('keyDescriptor', sysmsg);
            if(keyDescriptor == null) break;
            try {
                let keyHash = Utils.BytesToBase64(Utils.PayloadDecode(keyHashPayload));
                let key = await Utils.GetKeyByHash(keyHash);
                if(key == null) {
                    message.content = unknownKeySystemMessage;
                    return true;
                }

                let sharedKey = await Utils.AesDecrypt(key, Utils.PayloadDecode(sharedKeyPayload));
                if(sharedKey.byteLength !== 32) break;
                const keyTypeNames = { 'GROUP':1, 'CONVERSATION':2, 'PERSONAL':3 }; //let's get personal :3
                let keyType = keyTypeNames[keyTypeName];
                if(keyType == null) break;

                let sharedKeyHash = await Utils.SaveKey(sharedKey, keyType, keyDescriptor);
                Utils.KeyShareEvent(sharedKeyHash);

                delete channelConfig.w; //waitingForSystemMessage
                Utils.dbChanged = true;
                delete keyExchangeWhitelist[userId];

                let sharedChannelsJson = getSystemMessageProperty('sharedChannels', sysmsg);
                if(sharedChannelsJson == null) return true;
                let sharedChannels = JSON.parse(sharedChannelsJson);
                for(let channelId of sharedChannels) {
                    if(DataBase.channels[channelId] != null) continue;
                    let sharedChannelConfig = Utils.NewChannelConfig(channelId, sharedKeyHash);
                    if(channelId === Cache.channelId) {
                        Cache.channelConfig = sharedChannelConfig;
                        MenuBar.Update();
                    }
                }
                decryptWaitingMessages(sharedKeyHash);
            }
            catch(e) { break }
        } return true;
        default:
            message.content = invalidSystemMessage;
            return false;
    }
    message.content = invalidSystemMessage;
    return true;
}

const descriptionRegex = /^[⠀-⣿]{16,}$/;
async function processEmbeds(message) {
    if(message.embeds.length !== 1) return;
    let embed = message.embeds[0];
    if(embed.footer == null || (embed.footer.text !== "SimpleDiscordCrypt" && embed.footer.text !== "𝘚𝘪𝘮𝘱𝘭𝘦𝘋𝘪𝘴𝘤𝘰𝘳𝘥𝘊𝘳𝘺𝘱𝘵")) return;

    if(embed.author == null) return;

    if(embed.author.name === "-----ENCRYPTED MESSAGE-----") {
        if(!descriptionRegex.test(embed.description)) return;
        return await decryptMessage(message, embed.description);
    }
    else if(embed.author.name === "-----SYSTEM MESSAGE-----") {
        processSystemMessage(message, embed.description).then((delayed) => { if(delayed) Utils.UpdateMessageContent(message); } );
    }
}

/*async function handleMessageUpdate(event) {
    if(event.message.edited_timestamp != null) return;

    await processEmbeds(event.message);
}*/

async function handleChannelSelect(event) {
    if(Blacklist != null) {
        let guildId = event.guildId;
        Cache.channelBlacklist = (guildId == null) ? null : Blacklist[guildId];
    }
    let channelId = event.channelId;
    if(channelId != null) {
        Cache.channelId = channelId;
        Cache.channelConfig = Utils.GetChannelConfig(channelId);

        setTimeout(() => { MenuBar.Update() }, 0);
        setTimeout(() => { PopupManager.Update() }, 0);
        //Update after event is processed by Discord
    }
}

async function handleDelete(event) {
    Utils.MessageDeleteEvent(event.id);
}
async function handleDeletes(event) {
    Utils.MessageDeleteBulkEvent(event.ids);
}


const prefixRegex = /^(?::?ENC(?::|\b)|<:ENC:\d{1,20}>)\s*/;
const noencprefixRegex = /^(?::?NOENC:?|<:NOENC:\d{1,20}>)\s*/; //not really expecting an emoji
async function handleSend(channelId, message, forceSimple) {
    let channelConfig = Utils.GetChannelConfig(channelId);
    let content = message.content;
    let prefixMatch = prefixRegex.exec(content);
    if(channelConfig == null) {
        if(prefixMatch != null) {
            if(Cache.channelBlacklist !== 1)
                channelConfig = Utils.NewChannelConfig(channelId);
        }
        else return null;
    }
    if(prefixMatch != null) content = content.substring(prefixMatch[0].length);
    else if(!channelConfig.e) return null;

    if(Cache.channelBlacklist === 1) {
        if(prefixMatch != null) message.content = content;
        return null;
    }

    let noencprefixMatch = noencprefixRegex.exec(content);
    if(noencprefixMatch != null) {
        message.content = content.substring(noencprefixMatch[0].length);
        return null;
    }


    let key = await Utils.GetKeyByHash(channelConfig.k);
    let keyHashBytes = Utils.Base64ToBytes(channelConfig.k);
    let messageBytes;
    if(content !== "")
    {
        let encryptedMessage = await Utils.AesEncryptCompressString(key, content);
        messageBytes = Utils.ConcatBuffers([keyHashBytes, encryptedMessage]);
    }
    else messageBytes = keyHashBytes;

    let payload = Utils.PayloadEncode(messageBytes);

    let channel = Discord.getChannel(channelId);
    if(forceSimple || Cache.channelBlacklist === 2 || (channel.type === 0 && !Discord.can(0x4000/*EMBED_LINKS*/, Discord.getCurrentUser(), channel))) {
       message.content = payload + " `SimpleDiscordCrypt`";
    }
    else {
        message.content = "";
        message.embed = {
            color: BaseColorInt,
            author: {
                name: "-----ENCRYPTED MESSAGE-----",
                icon_url: "https://i.imgur.com/pFuRfDE.png",
                url: "http://gitlab.com/An0/SimpleDiscordCrypt"
            },
            description: payload,
            footer: {
                text: "SimpleDiscordCrypt",
                icon_url: "https://i.imgur.com/zWXtTpX.png",
            }
        };
    }
    return key;
}

const filenameLimit = 47;
const filenameRegex = /^(.*?)((?:\.[^.]*)?)$/;
async function handleUpload(channelId, file, message, spoiler) {
    let key = await handleSend(channelId, message, true);
    if(key == null) return arguments;

    let filename = file.name;
    if(spoiler) {
        arguments[3] = false;
        if(!filename.startsWith('SPOILER_')) filename = 'SPOILER_' + filename;
    }
    let filenameParts = filenameRegex.exec(filename);
    let filenameMax = filenameLimit - filenameParts[2].length;
    filename = filenameParts[1].substr(0, filenameMax) + filenameParts[2];

    try {
        let encryptedFilename;
        let filenameBytes = Utils.StringToUtf8Bytes(filename);
        if(filenameBytes.byteLength > filenameLimit) filenameBytes = Utils.StringToUtf8Bytes("file" + filenameParts[2]);
        do {
            encryptedFilename = Utils.BytesToBase64url(await Utils.AesEncrypt(key, filenameBytes));
        } while(encryptedFilename.startsWith('_') || encryptedFilename.endsWith('_')); //this character is trimmed by discord (the solution assumes that the encryption looks fully random)
        let fileBuffer = await Utils.ReadFile(file);
        let encryptedBuffer = await Utils.AesEncrypt(key, fileBuffer);
        arguments[1] = new File([encryptedBuffer], encryptedFilename);
    }
    catch(e) {
        arguments[1] = null;
    }
    return arguments;
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
    'MESSAGE_UPDATE': handleMessage,
    'MESSAGE_DELETE': handleDelete,
    'MESSAGE_DELETE_BULK': handleDeletes
}

var messageLocks = [];
var UnlockMessages;
function LockMessages(initial) {
    let messageDispatcher = Discord.modules.MessageDispatcher;
    let dispatchHook = function(event){(async () => {
        if(event.type === 'LOAD_MESSAGES_SUCCESS' || event.type === 'MESSAGE_CREATE' || event.type === 'MESSAGE_UPDATE') {
            //if(initial && event.type === 'LOAD_MESSAGES_SUCCESS')
            //    event.messages.reverse(); //initial load has the messages reversed for some reason //(seems like not anymore)

            await new Promise((resolve) => { messageLocks.push(resolve) });

            messageDispatcher.dispatch.apply(this, arguments);
        }

        Discord.original_dispatch.apply(this, arguments);
    })()};
    messageDispatcher.dispatch = dispatchHook;

    UnlockMessages = () => {
        if(messageDispatcher.dispatch === dispatchHook)
            messageDispatcher.dispatch = Discord.original_dispatch;
        for(let unlockMessage of messageLocks)
            unlockMessage();
        messageLocks = [];
    }
}

async function LoadBlacklist() {
    let blacklistString = Utils.Utf8BytesToString(await Utils.DownloadFile(BlacklistUrl));
    let blacklistRegex = /^\s*(\d{1,20})(E?)/gm;
    Blacklist = {};
    let record;
    while ((record = blacklistRegex.exec(blacklistString)) != null) {
        Blacklist[record[1]] = (record[2] === 'E') ? 2 : 1;
    }

    for(let i = 1;; i++) {
        if(await Utils.RefreshCache() || i === 10) break;
        await Utils.Sleep(i * 200);
    }

    if(Cache.channelBlacklist === 1) MenuBar.Update();
}

var dbSaveInterval;
function Load()
{
    let modules = Discord.modules;

    Utils.RefreshCache();

    modules.MessageQueue.enqueue = function(packet){(async () => {

        await handleSend(packet.message.channelId, packet.message, packet.type === 'edit');

        Discord.original_enqueue.apply(this, arguments);
    })()};

    modules.MessageDispatcher.dispatch = function(event){(async () => {
        let handler = eventHandlers[event.type];
        if(handler) {
            let suppress = await handler(event);
            if(suppress) return;
        }

        Discord.original_dispatch.apply(this, arguments);
    })()};

    modules.FileUploader.upload = function(){(async () => {

        let argumentsOverride = await handleUpload.apply(null, arguments);

        Discord.original_upload.apply(this, argumentsOverride);
    })()};

    /*modules.MessageCache.prototype._merge = function(messages) {
        console.log(messages);

        messages.forEach((message) => {
            if(message.state !== "SENT") return;
            //message.contentParsed = null;
        });

        Discord.original__merge.apply(this, arguments);
    };*/

    MenuBar.Show(() => Utils.GetCurrentChannelEncrypt(),
                 () => { Utils.ToggleCurrentChannelEncrypt(); MenuBar.Update(); },
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
                 (key) => { Utils.SetCurrentChannelKey(key.hash); MenuBar.Update(); },
                 () => Utils.GetCurrentChannelIsDm(),
                 () => Utils.DownloadDb(),
                 () => Utils.DownloadDb(true),
                 () => Utils.NewDb(() => { Utils.RefreshCache(); MenuBar.Update(); }),
                 () => Utils.NewDbPassword(),
                 () => Utils.InitKeyExchange({id:Utils.GetCurrentDmUserId()}),
                 async () => { Utils.SetCurrentChannelKey(await Utils.SaveKey(Utils.GetRandomBytes(32), 1/*group*/, `Group <#${Cache.channelId}>`)); MenuBar.Update(); },
                 () => {
        let personalKeyHash = DataBase.personalKeyHash;
        let personalKey = DataBase.keys[personalKeyHash];
        let keys = [{hash: personalKeyHash,
                     rawDescriptor: personalKey.d,
                     descriptor: Utils.FormatDescriptor(personalKey.d),
                     lastseen: personalKey.l,
                     hidden: personalKey.h,
                     type: 'PERSONAL',
                     protected: true}];
        const keyTypes = { 1:'GROUP', 2:'CONVERSATION', 3:'PERSONAL' };
        Object.entries(DataBase.keys).sort(([,a], [,b]) => b.l - a.l).forEach(([hash, keyObj]) => {
            if(hash !== personalKeyHash) keys.push({ hash, rawDescriptor: keyObj.d, lastseen: keyObj.l, descriptor: Utils.FormatDescriptor(keyObj.d), hidden: keyObj.h, type: keyTypes[keyObj.t] })
        });
        KeyManagerWindow.Show(keys,
                              (key, rawDescriptor) => {
            Utils.ChangeKeyDescriptor(key.hash, rawDescriptor);
            key.rawDescriptor = rawDescriptor;
            key.descriptor = Utils.FormatDescriptor(rawDescriptor);
            MenuBar.Update();
        },
                             (key, hidden) => {
            Utils.ChangeKeyHidden(key.hash, hidden);
            key.hidden = hidden;
        },
                              (key) => { Utils.DeleteKey(key.hash); MenuBar.Update(); }
                             );
    },
                 () =>
        ChannelManagerWindow.Show(Object.entries(DataBase.channels)
                                  .sort(([,a], [,b]) => b.l - a.l)
                                  .map(([id, channel]) => ({id, descriptor: Utils.FormatDescriptor(channel.d), lastseen: channel.l })),
                                 (channel) => { Utils.DeleteChannelConfig(channel.id); if(channel.id === Cache.channelId) MenuBar.Update(); }
                                  ),
                 () => KeyVisualizerWindow.Show(Utils.Base64ToBytes(Utils.GetCurrentChannelKeyHash()).buffer),
                 () => {
        let personalKeyHash = DataBase.personalKeyHash;
        let personalKey = DataBase.keys[personalKeyHash];
        let keys = [{hash: personalKeyHash, descriptor: Utils.FormatDescriptor(personalKey.d), lastseen: personalKey.l}];
        keys = keys.concat(Object.entries(DataBase.keys)
            .filter(([,x]) => x.t/*type*/ === 1/*group*/)
            .sort(([,a], [,b]) => b.l - a.l)
            .map(([hash, keyObj]) => ({ hash, lastseen: keyObj.l, descriptor: Utils.FormatDescriptor(keyObj.d) })));

        ShareKeyWindow.Show(keys, (key) => Utils.ShareKey(key.hash, Cache.channelId));
    }
                );

    PopupManager.Inject();

    if(!FixedCsp) {
        const imgsrcIdRegex = /#([^?]+)/;
        const tryReplaceImage = async (img) => {
            let srcmatch = imgsrcIdRegex.exec(img.src);
            if(srcmatch == null) return;
            let blob = Patcher.Images[srcmatch[1]];
            if(blob == null) return;
            let bitmap = await createImageBitmap(blob);
            let width = bitmap.width;
            let height = bitmap.height;
            let canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            let ctx = canvas.getContext('2d');
            ctx.drawImage(bitmap, 0, 0);
            canvas.style.cssText = img.style.cssText;
            img.replaceWith(canvas);
        };
        const scriptLink = function(event) {
            event.preventDefault();
            return new Function(this.href.substr(11)).apply(this);
        };
        Patcher = {
            observer: new MutationObserver((mutations) => {
                for(let mutation of mutations) {
                    if(mutation.type === 'attributes') {
                        let tagName = mutation.target.tagName;
                        if(tagName === 'IMG') {
                            if(mutation.attributeName !== 'src') continue;
                            let img = mutation.target;
                            tryReplaceImage(img);
                        }
                        else if(tagName === 'A') {
                            if(!mutation.target.href.startsWith("javascript:")) continue;
                            mutation.target.addEventListener('auxclick', scriptLink);
                        }
                    }
                    else {
                        let addedNode = mutation.addedNodes[0];
                        if(addedNode == null || addedNode.getElementsByTagName == null) continue;

                        for(let img of addedNode.getElementsByTagName('img')) {
                            tryReplaceImage(img);
                        }

                        for(let a of addedNode.getElementsByTagName('a')) {
                            if(!a.href.startsWith("javascript:")) continue;
                            a.addEventListener('auxclick', scriptLink);
                        }
                    }
                }
            }),
            Images: []
        };
        Patcher.observer.observe(document.documentElement, { attributes: true, childList: true, subtree: true });
    }

    dbSaveInterval = setInterval(() => { Utils.SaveDb() }, 10000);

    Utils.Log("loaded");

    LoadBlacklist();
}

function Unload()
{
    const restoreFunction = (moduleName, functionName) => { let module = Discord.modules[moduleName]; module[functionName] = module[`original_${functionName}`]; };

    restoreFunction('MessageQueue', 'enqueue');
    restoreFunction('MessageDispatcher', 'dispatch');
    restoreFunction('FileUploader', 'upload');

    //Discord.MessageCache.prototype._merge = Discord.original__merge;

    if(Patcher != null) Patcher.observer.disconnect();

    Style.Remove();
    UnlockWindow.Remove();
    NewdbWindow.Remove();
    NewPasswordWindow.Remove();
    KeyManagerWindow.Remove();
    ChannelManagerWindow.Remove();
    MenuBar.Remove();
    PopupManager.Remove();

    clearInterval(dbSaveInterval);
}

function TryInit()
{
    if(Init(true) !== 0) return;

    window.setTimeout(TryInit, 100);
};


Utils.Log("injected");

//window.addEventListener('load', TryInit);
TryInit();

})();
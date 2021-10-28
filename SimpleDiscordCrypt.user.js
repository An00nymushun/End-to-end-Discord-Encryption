// ==UserScript==
// @name         SimpleDiscordCrypt
// @namespace    https://gitlab.com/An0/SimpleDiscordCrypt
// @version      1.4.2.2
// @description  I hope people won't start calling this SDC ^_^
// @author       An0
// @license      LGPLv3 - https://www.gnu.org/licenses/lgpl-3.0.txt
// @downloadURL  https://gitlab.com/An0/SimpleDiscordCrypt/raw/master/SimpleDiscordCrypt.user.js
// @updateURL    https://gitlab.com/An0/SimpleDiscordCrypt/raw/master/SimpleDiscordCrypt.meta.js
// @icon         https://gitlab.com/An0/SimpleDiscordCrypt/raw/master/logo.png
// @match        https://*.discord.com/channels/*
// @match        https://*.discord.com/activity
// @match        https://*.discord.com/login*
// @match        https://*.discord.com/app
// @match        https://*.discord.com/library
// @match        https://*.discord.com/store
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        unsafeWindow
// @grant        GM_xmlhttpRequest
// @connect      cdn.discordapp.com
// @connect      gitlab.com
// ==/UserScript==

// Credits for inspiration to the original DiscordCrypt

(function() {

'use strict';

const BlacklistUrl = "https://gitlab.com/An0/SimpleDiscordCrypt/raw/master/blacklist.txt";

const SavedLocalStorage = (typeof(localStorage) !== 'undefined') ? localStorage : null;
const FixedCsp = (typeof(CspDisarmed) !== 'undefined') ? CspDisarmed : false;

const BaseColor = "#0fc";
const BaseColorInt = 0x00ffcc;

const InactiveChannelTime = 7*24*60*60*1000; //1 week
const IgnoreDiffKeyAge = 7*24*60*60*1000;
const DiffKeyTrigger = 10;

const HeaderBarSelector = `.title-3qD0b-`;
const HeaderBarChildrenSelector = `.children-19S4PO`;
const HeaderBarStatusSelector = `.status-1XNdyw`;
const HeaderBarChannelNameSelector = `.title-3qD0b- .title-29uC1r, .title-3qD0b- .channelName-qsg_a_`;
const BackdropSelector = `div[class*="backdrop"]`;
const ModalClass = 'layer-2KE1M9';
const ImageWrapperImgSelector = `.imageWrapper-2p5ogY > img`;
const ModalImgSelector = `.${ModalClass} ${ImageWrapperImgSelector}`;
const MessageScrollerSelector = `.scroller-2LSbBU`;
const ChatInputSelector = `.scrollableContainer-2NUZem`;
const MessageImgSelector = `.message-2qnXI6 img`;
const ChatImageSelector = `${MessageScrollerSelector} .imageZoom-1n-ADA img`;

const htmlEscapeDiv = document.createElement('div');
function HtmlEscape(string) { htmlEscapeDiv.textContent = string; return htmlEscapeDiv.innerHTML; }

const Style = {
    css: `
/*fixes*/
${HeaderBarSelector}, ${HeaderBarChildrenSelector} { overflow: visible !important }
${HeaderBarStatusSelector} { margin-left: 10px }
${HeaderBarChildrenSelector} { mask-image: none !important; -webkit-mask-image: none !important }
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
    z-index: 1000;
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
    align-items: center;
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
    box-sizing: content-box;
}
.sdc-select > div {
    background: #303237;
    position: absolute;
    top: 100%;
    width: 100%;
    margin: -.8px;
    margin-top: -2px;
    border-radius: 0 0 4px 4px;
    box-shadow: 0 1px 5px rgba(0,0,0,.3);
    z-index: 1;
}
.sdc-select > label,.sdc-select > div > * {
    height: 38px;
    padding: 0 10px;
    align-items: center;
    overflow: hidden;
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
    opacity: 0;
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
.sdc-list {
    flex-direction: column;
    min-height: 100px;
}
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
}
.sdc-zoom::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}
.sdc-zoom::-webkit-scrollbar, .sdc-zoom::-webkit-scrollbar-corner {
    background: #36393f;
}
.sdc-zoom::-webkit-scrollbar-thumb {
    background: #72dac7;
}

/*for light theme*/
.theme-light .SDC_TOGGLE { fill: #4f5660 }
.theme-light .SDC_SELECTED { color: #4f5660 }
`,
    Inject: function() {
        let style = document.createElement('style');
        style.innerHTML = this.css;
        document.head.appendChild(style);
        this.domElement = style;
    },
    Remove: function() {
        if(this.domElement) this.domElement.remove();
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
        if(this.domElement) this.domElement.remove();
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
        if(this.domElement) this.domElement.remove();
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
        if(this.domElement) this.domElement.remove();
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
            if(key.trusted) listItem.getElementsByClassName('SDC_DESCRIPTOR')[0].style.color = BaseColor;
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
                    if(e.key === 'Enter') {
                        e.preventDefault();
                        setKeyDescriptor(key, this.value)
                        changeBack();
                    }
                    else if(e.key === 'Escape')
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
        if(this.domElement) this.domElement.remove();
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
        if(this.domElement) this.domElement.remove();
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
        if(this.domElement) this.domElement.remove();
    }
};
const MenuBar = {
    menuBarCss: `.SDC_TOGGLE{opacity:.6;fill:#fff;height:24px;cursor:pointer;margin-left:-5px}.SDC_TOGGLE:hover{opacity:.8}`,
    toggleOnButtonHtml: `<div class="sdc" style="position:relative"><svg class="SDC_TOGGLE" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><path d="M18 0c-4.612 0-8.483 3.126-9.639 7.371l3.855 1.052C12.91 5.876 15.233 4 18 4c3.313 0 6 2.687 6 6v10h4V10c0-5.522-4.477-10-10-10z"/><path d="M31 32c0 2.209-1.791 4-4 4H9c-2.209 0-4-1.791-4-4V20c0-2.209 1.791-4 4-4h18c2.209 0 4 1.791 4 4v12z"/></svg><p class="sdc-tooltip">Encrypt Channel</p></div>`,
    toggleOffButtonHtml: `<div class="sdc" style="position:relative"><svg class="SDC_TOGGLE" style="opacity:1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><path d="M18 3C12.477 3 8 7.477 8 13v10h4V13c0-3.313 2.686-6 6-6s6 2.687 6 6v10h4V13c0-5.523-4.477-10-10-10z"/><path d="M31 32c0 2.209-1.791 4-4 4H9c-2.209 0-4-1.791-4-4V20c0-2.209 1.791-4 4-4h18c2.209 0 4 1.791 4 4v12z"/><p class="sdc-tooltip">Disable Encryption</p></svg>`,
    keySelectHtml: `<div class="sdc sdc-select" style="margin:-3px 0 -2px 5px"><label style="min-width:200px;max-width:300px;height:30px"><input class="SDC_DROPDOWN sdc-hidden" type="checkbox"><p class="SDC_SELECTED" style="justify-content:center;text-align:center"></p></label><div class="SDC_OPTIONS" style="visibility:hidden"></div></div>`,
    toggledOnCss: `${ChatInputSelector}{box-shadow:0 0 0 1px ${BaseColor} !important}`,
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
    Show: function(getToggleStatus, toggle, getCurrentKeyInfo, getKeys, selectKey, getIsDmChannel, exportDb, exportDbRaw, newDb, newDbKey, keyExchange, groupKey, keyManager, channelManager, keyVisualizer, keyShare) {
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
        keySelectDropdown.onblur = () => { setTimeout(() => { //:active in FF is only valid after the event
            if(!keySelectDropdown.matches(':active')) {
                keySelectDropdown.checked = false;
                dropdownOff()
            }
        }, 0)};

        this.toggleOnButton.oncontextmenu = this.toggleOffButton.oncontextmenu = (e) => {
            e.preventDefault();
            menu.style.left = e.clientX+"px";
            menu.style.top = e.clientY+"px";
            menu.style.visibility = 'visible';
            menuFocus.focus();
        };
        menuFocus.onblur = () => { menu.style.visibility = 'hidden' };

        this.Update = function(isRetry) {
            let titleElement = document.querySelector(HeaderBarChannelNameSelector);
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
            else this.mutationObserver = new MutationObserver((changes) => { for(let change of changes) for(let removed of change.removedNodes) if(removed === this.keySelect || removed.contains(this.keySelect)) { this.Update(); return; }});

            let styleEnabled = document.head.contains(this.toggledOnStyle);
            let keySelectEnabled = document.body.contains(this.keySelect);
            let toggleOnEnabled = document.body.contains(this.toggleOnButton);
            let toggleOffEnabled = document.body.contains(this.toggleOffButton);
            let toggledOn = getToggleStatus();

            let keyInfo = getCurrentKeyInfo();
            keySelectSelected.innerText = keyInfo[0/*descriptor*/];
            keySelectSelected.style.color = keyInfo[1/*trusted*/] ? BaseColor : null;

            if(!keySelectEnabled) titleElement.insertAdjacentElement('afterend', this.keySelect);

            if(toggledOn) {
                if(!styleEnabled) document.head.appendChild(this.toggledOnStyle);
                if(toggleOnEnabled) this.toggleOnButton.remove();
                if(!toggleOffEnabled) titleElement.insertAdjacentElement('afterend', this.toggleOffButton);
            }
            else {
                if(styleEnabled) document.head.removeChild(this.toggledOnStyle);
                if(toggleOffEnabled) this.toggleOffButton.remove();
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
        if(this.mutationObserver) this.mutationObserver.disconnect();
        if(this.toggledOnStyle) this.toggledOnStyle.remove();
        if(this.menuBarStyle) this.menuBarStyle.remove();
        if(this.keySelect) this.keySelect.remove();
        if(this.toggleOnButton) this.toggleOnButton.remove();
        if(this.toggleOffButton) this.toggleOffButton.remove();
        if(this.menuWrapper) this.menuWrapper.remove();
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
    New: function(message, okCallback, cancelCallback, ontop) {
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
            popup.remove();
            okCallback();
        });
        Utils.AttachEventToClass(popup, 'SDC_CANCEL', 'click', () => {
            popup.remove();
            if(cancelCallback) cancelCallback();
        });
        if(ontop) this.domElement.appendChild(popup);
        else this.domElement.prepend(popup);
        return popup;
    },
    NewPromise: function(message, ontop, timeout) {
        return new Promise((resolve) => {
            if(timeout > 0) {
                let cancelTimeout;
                let popup = this.New(message,
                                     () => { clearTimeout(cancelTimeout); resolve(true); },
                                     () => { clearTimeout(cancelTimeout); resolve(false); },
                                     ontop);

                cancelTimeout = setTimeout(() => { popup.remove(); resolve(false); }, timeout);
            }
            else {
                let popup = this.New(message, () => resolve(true), () => resolve(false), ontop);
                if(typeof timeout === 'object') { timeout.cancel = () => { popup.remove(); resolve(false); } };
            }
        });
    },
    Remove: function() {
        if(this.domElement) this.domElement.remove();
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
            <button type="button" class="SDC_KEYTRUST sdc-wbtn" style="margin-right:10px">Toggle Key Trusted</button>
            <button type="button" class="SDC_CLOSE sdc-btn" style="min-width:96px">Close</button>
        </div>
    </div>
</div>
</div>`,
    Show: function(buffer, toggleTrustedCallback) {
        let wrapper = document.createElement('div');
        wrapper.innerHTML = this.html;

        Utils.AttachEventToClass(wrapper, 'SDC_CLOSE', 'click', () => {
            this.Remove();
        });

        Utils.AttachEventToClass(wrapper, 'SDC_KEYTRUST', 'click', () => {
            this.Remove();
            toggleTrustedCallback();
        });

        let canvas = wrapper.getElementsByClassName('SDC_ART')[0];
        this.EmojiHash(canvas, buffer);

        document.body.appendChild(wrapper);
        this.domElement = wrapper;
    },
    Remove: function() {
        if(this.domElement) this.domElement.remove();
    }
};

var Discord;
var Utils = {
    Log: (message) => { console.log(`%c[SimpleDiscordCrypt] %c${message}`, `color:${BaseColor};font-weight:bold`, "") },
    Warn: (message) => { console.warn(`%c[SimpleDiscordCrypt] %c${message}`, `color:${BaseColor};font-weight:bold`, "") },
    Error: (message) => { console.error(`%c[SimpleDiscordCrypt] %c${message}`, `color:${BaseColor};font-weight:bold`, "") },
    Webpack: function() {
        if(this.cachedWebpack) return this.cachedWebpack;

        let webpackExports;

        if(typeof BdApi !== "undefined" && BdApi?.findModuleByProps && BdApi?.findModule) {
            return this.cachedWebpack = { findModule: BdApi.findModule, findModuleByUniqueProperties: (props) => BdApi.findModuleByProps.apply(null, props) };
        }
        else if(Discord.window.webpackChunkdiscord_app != null) {
            const ids = ['__extra_id__'];
            Discord.window.webpackChunkdiscord_app.push([
                ids,
                {},
                (req) => {
                    webpackExports = req;
                    ids.length = 0;
                }
            ]);
        }
        else if(Discord.window.webpackJsonp != null) {
            webpackExports = typeof(Discord.window.webpackJsonp) === 'function' ?
            Discord.window.webpackJsonp(
                [],
                { '__extra_id__': (module, _export_, req) => { _export_.default = req } },
                [ '__extra_id__' ]
            ).default :
            Discord.window.webpackJsonp.push([
                [],
                { '__extra_id__': (_module_, exports, req) => { _module_.exports = req } },
                [ [ '__extra_id__' ] ]
            ]);

            delete webpackExports.m['__extra_id__'];
            delete webpackExports.c['__extra_id__'];
        }
        else return null;

        const findModule = (filter) => {
            for(let i in webpackExports.c) {
                if(webpackExports.c.hasOwnProperty(i)) {
                    let m = webpackExports.c[i].exports;

                    if(!m) continue;

                    if(m.__esModule && m.default) m = m.default;

                    if(filter(m)) return m;
                }
            }

            return null;
        };

        const findModuleByUniqueProperties = (propNames) => findModule(module => propNames.every(prop => module[prop] !== undefined));

        return this.cachedWebpack = { findModule, findModuleByUniqueProperties };
    }
};
var DataBase;
var Cache;
var Blacklist;
var Patcher;
var KeyRotators;
var ImageZoom;
var ResolveInitPromise;
var InitPromise = new Promise(resolve => { ResolveInitPromise = resolve });

function Init(final)
{
    Discord = { window: (typeof(unsafeWindow) !== 'undefined') ? unsafeWindow : window };

    const webpackUtil = Utils.Webpack();
    if(webpackUtil == null) { if(final) Utils.Error("Webpack not found."); return 0; }

    const { findModule, findModuleByUniqueProperties } = webpackUtil;

    let modules = {};

    modules.MessageQueue = findModuleByUniqueProperties([ 'enqueue', 'handleSend', 'handleEdit' ]);
    if(modules.MessageQueue == null) { if(final) Utils.Error("MessageQueue not found."); return 0; }

    modules.MessageDispatcher = findModuleByUniqueProperties( [ 'dispatch', 'maybeDispatch', 'dirtyDispatch' ]);
    if(modules.MessageDispatcher == null) { if(final) Utils.Error("MessageDispatcher not found."); return 0; }

    modules.UserCache = findModuleByUniqueProperties( [ 'getUser', 'getUsers', 'getCurrentUser' ]);
    if(modules.UserCache == null) { if(final) Utils.Error("UserCache not found."); return 0; }

    modules.ChannelCache = findModuleByUniqueProperties( [ 'getChannel', 'getMutableGuildChannels', 'getDMFromUserId' ]);
    if(modules.ChannelCache == null) { if(final) Utils.Error("ChannelCache not found."); return 0; }

    modules.SelectedChannelStore = findModuleByUniqueProperties( [ 'getChannelId', 'getVoiceChannelId', 'getLastSelectedChannelId' ]);
    if(modules.SelectedChannelStore == null) { if(final) Utils.Error("SelectedChannelStore not found."); return 0; }

    modules.GuildCache = findModuleByUniqueProperties( [ 'getGuild', 'getGuilds' ]);
    if(modules.GuildCache == null) { if(final) Utils.Error("GuildCache not found."); return 0; }

    modules.FileUploader = findModuleByUniqueProperties( [ 'upload', 'cancel', 'instantBatchUpload' ]);
    if(modules.FileUploader == null) { if(final) Utils.Error("FileUploader not found."); return 0; }

    modules.PermissionEvaluator = findModuleByUniqueProperties( [ 'can', 'computePermissions', 'canEveryone' ]);
    if(modules.PermissionEvaluator == null) { if(final) Utils.Error("PermissionEvaluator not found."); return 0; }

    modules.RelationshipStore = findModuleByUniqueProperties( [ 'isFriend', 'isBlocked', 'getFriendIDs' ]);
    if(modules.RelationshipStore == null) { if(final) Utils.Error("RelationshipStore not found."); return 0; }

    modules.PrivateChannelManager = findModuleByUniqueProperties( [ 'openPrivateChannel', 'ensurePrivateChannel', 'closePrivateChannel' ]);
    if(modules.PrivateChannelManager == null) { if(final) Utils.Error("PrivateChannelManager not found."); return 0; }

    modules.DiscordConstants = findModuleByUniqueProperties( [ 'SpotifyEndpoints' ]);
    modules.Premium = findModuleByUniqueProperties( [ 'canUseEmojisEverywhere' ]);

    Discord.modules = modules;

    let nodeHttps;
    let nodeHttpsOptions;
    if(typeof(require) !== 'undefined') {
        nodeHttps = require('https');
        nodeHttpsOptions = { agent: new nodeHttps.Agent({ keepAlive: true }), timeout: 120000 };
    }

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
        : (nodeHttps != null) ? function(url) { return new Promise((resolve, reject) => {
            nodeHttps.get(url, nodeHttpsOptions, (response) => {
                let data = [];
                response.on('data', (chunk) => data.push(chunk));
                response.on('end', () => resolve(this.ConcatBuffers(data)));
                response.on('aborted', reject);
            }).on('error', reject).on('timeout', function() { this.abort() });
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
        GetKeyByHash: async function(hashBase64, out) {
            let keyObj = DataBase.keys[hashBase64];
            if(keyObj == null) return null;
            if(out != null) out[0] = keyObj;
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
            let keyObj = { t: type, d: descriptor, r/*registered*/: Date.now(), l/*lastseen*/: Date.now(), h/*hidden*/: (hidden || (type > 1)) ? 1 : 0 };

            if(DataBase.isEncrypted)
                keyBytes = await this.AesEncrypt(Cache.dbKey, keyBytes);

            keyObj.k = this.BytesToBase64(keyBytes);
            DataBase.keys[keyHashBase64] = keyObj;
            this.FastSaveDb();
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
            if(this.saveDbTimeout != null) clearTimeout(this.saveDbTimeout);
            this.saveDbTimeout = setTimeout(() => { this.saveDbTimeout = null; this.SaveDb(); }, 10);
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
            this.ReplaceChannelKeys(hash, DataBase.personalKeyHash);
            delete DataBase.keys[hash];
            if(DataBase.trustedKeys != null && DataBase.trustedKeys[hash]) {
                if(DataBase.trustedKeys.length === 1) delete DataBase.trustedKeys;
                else delete DataBase.trustedKeys[hash];
            }
            this.dbChanged = true;
        },
        ReplaceChannelKeys: function(oldHash, newHash) { Object.values(DataBase.channels).forEach(x => { if(x.k === oldHash) x.k = newHash } ); this.FastSaveDb() },
        NewPersonalKey: async function() {
            if(DataBase.personalKeyHash != null) this.ChangeKeyDescriptor(DataBase.personalKeyHash, "Old personal key");
            let newPersonalKeyHash = await this.SaveKey(this.GetRandomBytes(32), 3/*personal*/, "#Your personal key#");
            this.ReplaceChannelKeys(DataBase.personalKeyHash, newPersonalKeyHash);
            DataBase.personalKeyHash = newPersonalKeyHash;
            this.FastSaveDb();
        },
        ToggleKeyTrusted: function(hash) {
            let keyObj = DataBase.keys[hash];
            if(keyObj.t/*type*/ === 3/*personal*/) return;
            let trustedKeys = DataBase.trustedKeys;
            if(trustedKeys == null) DataBase.trustedKeys = trustedKeys = { hash: 1 };
            else {
                if(DataBase.trustedKeys[hash]) {
                    if(DataBase.trustedKeys.length === 1) delete DataBase.trustedKeys;
                    else delete DataBase.trustedKeys[hash];
                }
                else DataBase.trustedKeys[hash] = 1;
            }
            this.dbChanged = true;
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
                if(channel != null && channel.type === 1) channelConfig.d = `DM with <@${channel.recipients[0]}>`;
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
        SetCurrentChannelKey: async function(hash) {
            if(Cache.channelConfig == null)
                Cache.channelConfig = this.NewChannelConfig(Cache.channelId, hash, null, false);
            else {
                let oldKeyHash = Cache.channelConfig.k;
                if(hash === oldKeyHash) return;
                if(DataBase.keys[oldKeyHash].t/*type*/ === 2/*conversation*/) {
                    if(await PopupManager.NewPromise(`The plugin prevented you from switching key in a secured DM, hit cancel if you want to do it anyway`, true)) return;
                }
                Cache.channelConfig.k = hash;
                this.dbChanged = true;
            }
        },
        SetChannelKey: function(channelId, hash) {
            let channelConfig = this.GetOrCreateChannelConfig(channelId);
            let oldKeyHash = channelConfig.k;
            if(hash === oldKeyHash) return;
            channelConfig.k = hash;
            this.dbChanged = true;
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
                type: 0/*send*/,
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
                            text: "𝘚𝘪𝘮𝘱𝘭𝘦𝘋𝘪𝘴𝘤𝘰𝘳𝘥𝘊𝘳𝘺𝘱𝘵",
                            icon_url: "https://i.imgur.com/zWXtTpX.png",
                        }
                    }
                }
            }, () => { /*TODO*/ });
        },
        SendPersonalKey: async function(channelId) {
            let channelConfig = this.GetChannelConfig(channelId);
            if(channelConfig == null) return;
            let keyHash = channelConfig.k;
            if(keyHash === DataBase.personalKeyHash) return;

            let keyHashPayload = this.PayloadEncode(this.Base64ToBytes(keyHash));
            let key = await this.GetKeyByHash(keyHash);
            let personalKey = await this.GetKeyBytesByHash(DataBase.personalKeyHash);
            let personalKeyPayload = this.PayloadEncode(await this.AesEncrypt(key, personalKey));

            this.SendSystemMessage(channelId, `*type*: \`PERSONAL KEY\`\n*key*: \`${keyHashPayload}\`\n*personalKey*: \`${personalKeyPayload}\``);

            delete channelConfig.w;
            this.dbChanged = true;
        },
        AddListener: (listenerMap, key, listener) => {
            let listeners = listenerMap[key];
            if(listeners == null) listenerMap[key] = [listener];
            else listeners.push(listener);
        },
        RemoveListener: (listenerMap, key, listener) => {
            let listeners = listenerMap[key];
            if(listeners == null) return;
            let index = listeners.indexOf(listener);
            if(index === -1) return;
            if(listeners.length === 1) { delete listenerMap[key]; return; }
            listeners.splice(index, 1);
        },
        ListenerEvent: (listenerMap, key) => {
            let listeners = listenerMap[key];
            if(listeners == null) return;
            for(let listener of listeners) listener();
        },
        ListenerBulkEvent: function(listenerMap, keyList) {
            let listenerKeys = Object.keys(listenerMap);
            if(listenerKeys.length === 0) return;
            let foundKeys = this.Intersect(keyList.sort(), listenerKeys.sort());
            for(let key of foundKeys) for(let listener of listenerMap[key]) listener();
        },
        messageDeleteListeners: {},
        AddMessageDeleteListener: function(messageId, listener) { this.AddListener(this.messageDeleteListeners, messageId, listener) },
        RemoveMessageDeleteListener: function(messageId, listener) { this.RemoveListener(this.messageDeleteListeners, messageId, listener) },
        MessageDeleteEvent: function(messageId) { this.ListenerEvent(this.messageDeleteListeners, messageId) },
        MessageDeleteBulkEvent: function(messageIdList) { this.ListenerBulkEvent(this.messageDeleteListeners, messageIdList) },
        keyShareListeners: {},
        AddKeyShareListener: function(keyHash, listener) { this.AddListener(this.keyShareListeners, keyHash, listener) },
        RemoveKeyShareListener: function(keyHash, listener) { this.RemoveListener(this.keyShareListeners, keyHash, listener) },
        KeyShareEvent: function(keyHash) { this.ListenerEvent(this.keyShareListeners, keyHash) },
        keyExchangeListeners: {},
        AddKeyExchangeListener: function(userId, listener) { this.AddListener(this.keyExchangeListeners, userId, listener) },
        RemoveKeyExchangeListener: function(userId, listener) { this.RemoveListener(this.keyExchangeListeners, userId, listener) },
        KeyExchangeEvent: function(userId) { this.ListenerEvent(this.keyExchangeListeners, userId) },
        channelSelectListeners: {},
        AddChannelSelectListener: function(channelId, listener) { this.AddListener(this.channelSelectListeners, channelId, listener) },
        RemoveChannelSelectListener: function(channelId, listener) { this.RemoveListener(this.channelSelectListeners, channelId, listener) },
        ChannelSelectEvent: function(channelId) { this.ListenerEvent(this.channelSelectListeners, channelId) },
        ongoingKeyExchanges: {},
        InitKeyExchange: async function(user, autoOnMessage, autoOnKey) {
            let userId = user.id;
            let currentUserId = Discord.getCurrentUser().id;
            if(userId === currentUserId) return 0;

            let channelId = Discord.getDMFromUserId(userId);
            let channelConfig;
            if(autoOnMessage) {
                channelConfig = this.GetChannelConfig(channelId);
                if(channelConfig != null && (channelConfig.s/*systemMessageTime*/ > 0 || channelConfig.w/*waitingForSystemMessage*/))
                    return 2;

                if(/friend/i.test(DataBase.autoKeyExchange) && !Discord.isFriend(userId)) {
                    if(this.ongoingKeyExchanges[userId]) return 0;
                    this.ongoingKeyExchanges[userId] = true;
                    if(user.username == null) user = Discord.getUser(userId);
                    let popupOverride = {};
                    let popup = PopupManager.NewPromise(`Would you like to initiate key exchange with ${user.username}#${user.discriminator}`, false, popupOverride);
                    const autoCancel = () => { delete this.ongoingKeyExchanges[userId]; popupOverride.cancel(); };
                    this.AddMessageDeleteListener(autoOnMessage, autoCancel);
                    this.AddKeyShareListener(autoOnKey, autoCancel);
                    let force = await popup;
                    this.RemoveMessageDeleteListener(autoOnMessage, autoCancel);
                    this.RemoveKeyShareListener(autoOnKey, autoCancel);
                    if(!force) return 0;
                }
            }
            delete this.ongoingKeyExchanges[userId]; //this way once canceled you either have to add them as friend or restart the plugin

            keyExchangeWhitelist[userId] = true;

            if(channelId == null) {
                channelId = await Discord.ensurePrivateChannel(userId);
            }

            let dhPublicKeyPayload = this.PayloadEncode(this.Base64ToBytes(DataBase.dhPublicKey));

            this.SendSystemMessage(channelId, `*type*: \`DH KEY\`\n*dhKey*: \`${dhPublicKeyPayload}\``);
            channelConfig = channelConfig || this.GetOrCreateChannelConfig(channelId);
            channelConfig.w = 1;
            this.dbChanged = true;
            return 1;
        },
        ongoingKeyRequests: {},
        RequestKey: async function(keyHash, user, autoOnMessage) {
            let userId = user.id;
            if(DataBase.keys[keyHash] != null) return false;

            let channelId = Discord.getDMFromUserId(userId);
            if(channelId == null) return false;

            let channelConfig;
            let requestId = keyHash + userId;
            if(autoOnMessage) {
                channelConfig = this.GetChannelConfig(channelId);
                if(channelConfig != null && channelConfig.w/*waitingForSystemMessage*/)
                    return false;

                if(/friend/i.test(DataBase.autoKeyExchange) && !Discord.isFriend(userId)) {
                    if(this.ongoingKeyRequests[requestId]) return false;
                    if(this.ongoingKeyExchanges[userId]) return false;
                    if(channelConfig == null || DataBase.trustedKeys == null || !DataBase.trustedKeys[channelConfig.k/*keyHash*/]) {
                        this.ongoingKeyRequests[requestId] = true;
                        if(user.username == null) user = Discord.getUser(userId);
                        let popupOverride = {};
                        let popup = PopupManager.NewPromise(`Would you like to request key from ${user.username}#${user.discriminator}`, true, popupOverride);
                        const autoCancel = () => { delete this.ongoingKeyRequests[requestId]; popupOverride.cancel(); };
                        this.AddMessageDeleteListener(autoOnMessage, autoCancel);
                        this.AddKeyShareListener(keyHash, autoCancel);
                        let force = await popup;
                        this.RemoveMessageDeleteListener(autoOnMessage, autoCancel);
                        this.RemoveKeyShareListener(keyHash, autoCancel);
                        if(!force) return false;
                    }
                }
            }
            delete this.ongoingKeyRequests[requestId];

            keyExchangeWhitelist[userId] = true;

            let requestedKeyPayload = this.PayloadEncode(this.Base64ToBytes(keyHash));

            this.SendSystemMessage(channelId, `*type*: \`KEY REQUEST\`\n*requestedKey*: \`${requestedKeyPayload}\``);
            channelConfig = channelConfig || this.GetOrCreateChannelConfig(channelId);
            channelConfig.w = 1;
            this.dbChanged = true;
            return true;
        },
        ongoingKeyExchangesWithRequest: {},
        InitKeyExchangeAndRequestKey: async function(keyHash, user, autoOnMessage) {
            let requestId = keyHash + user.id;
            let ongoing = this.ongoingKeyExchangesWithRequest[requestId];
            if(ongoing && autoOnMessage) return false;
            let initKeyExchangeStatus = await this.InitKeyExchange(user, autoOnMessage, keyHash);
            if(initKeyExchangeStatus === 0) return false;
            if(ongoing) return false;
            this.ongoingKeyExchangesWithRequest[requestId] = true;
            let promiseResolve;
            if(initKeyExchangeStatus === 1) {
                await new Promise((resolve) => { promiseResolve = resolve; this.AddKeyExchangeListener(user.id, resolve); });
                this.RemoveKeyExchangeListener(user.id, promiseResolve);
            }
            if(await this.RequestKey(keyHash, user, (initKeyExchangeStatus === 1) ? null : autoOnMessage)) {
                await new Promise((resolve) => { promiseResolve = resolve; this.AddKeyShareListener(keyHash, resolve); });
                this.RemoveKeyShareListener(keyHash, promiseResolve);
            }
            delete this.ongoingKeyExchangesWithRequest[requestId];
            return true;
        },
        ShareKey: async function(keyHash, channelId, nonForced, user) {
            let keyObj = DataBase.keys[keyHash];
            if(keyObj == null) {
                this.SendSystemMessage(channelId, `*type*: \`KEY SHARE\`\n*status*: \`NOT FOUND\``);
                return;
            }
            let channelConfig;
            if(nonForced != null && (nonForced || keyObj.h/*hidden*/)) {
                channelConfig = DataBase.channels[channelId];
                if(channelConfig == null || DataBase.trustedKeys == null || !DataBase.trustedKeys[channelConfig.k/*keyHash*/]) {
                    if(user.username == null) user = Discord.getUser(user.id);
                    if(!await PopupManager.NewPromise(`Would you like to share key "${Utils.FormatDescriptor(keyObj.d)}" with ${user.username}#${user.discriminator}`, true)) {
                        this.SendSystemMessage(channelId, `*type*: \`KEY SHARE\`\n*status*: \`DENIED\``);
                        return;
                    }
                }
            }

            let sharedKeyBase64 = keyObj.k;
            let sharedKeyBytes = this.Base64ToBytes(sharedKeyBase64);
            if(DataBase.isEncrypted)
                sharedKeyBytes = await this.AesDecrypt(Cache.dbKey, sharedKeyBytes);

            if(channelConfig == null) channelConfig = this.GetOrCreateChannelConfig(channelId);
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
                let systemMessage = `*type*: \`KEY SHARE\`\n*status*: \`OK\`\n*key*: \`${keyHashPayload}\`\n*sharedKey*: \`${sharedKeyPayload}\`\n*keyType*: \`${keyType}\`\n*keyDescriptor*: \`${keyDescriptor}\``;
                if(keyObj.t === 1/*group*/) {
                    if(keyObj.h/*hidden*/) systemMessage += `\n*keyHidden*: \`YES\``;
                    let sharedChannels = [];
                    for(let [id, config] of Object.entries(DataBase.channels)) {
                        if(config.k === keyHash) {
                            let channel = Discord.getChannel(id);
                            if(channel == null || channel.type === 1/*DM*/) continue;

                            if(sharedChannels.push(id) === 20) break;
                        }
                    }
                    systemMessage += `\n*sharedChannels*: \`${JSON.stringify(sharedChannels)}\``;
                }

                this.SendSystemMessage(channelId, systemMessage);
            }

            delete channelConfig.w;
            this.dbChanged = true;
        },
        KeyRotationTimeout: function(keyHash, keyRotator, timeFromNow) {
            return setTimeout(async () => {
                delete DataBase.keyRotators[keyHash]; delete KeyRotators[keyHash];
                let now = Date.now();
                let rotationCtr = Math.floor((now - keyRotator.start) / keyRotator.interval);
                let oldKey = DataBase.keys[keyHash];
                if(oldKey == null) { this.dbChanged = true; return; }
                let dhPrivateKeyBytes = this.Base64ToBytes(DataBase.dhPrivateKey);
                if(DataBase.isEncrypted) dhPrivateKeyBytes = await this.AesDecrypt(Cache.dbKey, dhPrivateKeyBytes);
                let seed = this.Base64ToBytes(keyRotator.seed);
                let newName = /^(.*?)(?: +\d+)?$/.exec(oldKey.d/*descriptor*/)[1] + ' ' + rotationCtr;
                let seedEdit = new DataView(seed.buffer);
                seedEdit.setUint32(0, seedEdit.getUint32(0, true) ^ rotationCtr, true);
                let newKeyHash = await this.SaveKey(await this.Sha512_256(this.ConcatBuffers([seed, dhPrivateKeyBytes])), 1/*group*/, newName, oldKey.h/*hidden*/);
                DataBase.keyRotators[newKeyHash] = keyRotator;
                oldKey.d/*descriptor*/ = "Rotated " + oldKey.d;
                this.dbChanged = true;
                this.ReplaceChannelKeys(keyHash, newKeyHash);
                if(Cache.channelConfig != null && Cache.channelConfig.k/*keyHash*/ === newKeyHash) MenuBar.Update();
                this.StartKeyRotation(newKeyHash, keyRotator);
            }, timeFromNow);
        },
        StartKeyRotation: function(keyHash, keyRotator) {
            let now = Date.now();
            let timeFromNow = keyRotator.start > now ? (keyRotator.start - now) : Math.ceil((1 - (now - keyRotator.start) / keyRotator.interval % 1) * keyRotator.interval);
            KeyRotators[keyHash] = this.KeyRotationTimeout(keyHash, keyRotator, timeFromNow);
        },
        StopKeyRotation: (keyHash) => clearTimeout(KeyRotators[keyHash]),
        UpdateMessageContent: (message) => {
            if(message.edited_timestamp == null) {
                message.edited_timestamp = message.timestamp;
                Discord.dispatch({type: 'MESSAGE_UPDATE', message});
                message.edited_timestamp = null; //in case the message is still loading when updated
            }
            else Discord.dispatch({type: 'MESSAGE_UPDATE', message});
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
    Discord.window.SdcSetPingOn = (regexStr) => {
        if(!regexStr) {
            if(Cache.pingOn == null) return;
            Cache.pingOn = null;
            delete DataBase.pingOn;
        }
        else {
            regexStr = regexStr.toString();
            let fullRegex = /^\/(.*)\/([imsu]{0,4})$/.exec(regexStr);
            Cache.pingOn = fullRegex ? new RegExp(fullRegex[1], fullRegex[2]) : new RegExp(regexStr);
            DataBase.pingOn = regexStr;
        }
        Utils.dbChanged = true;
    };
    Discord.window.SdcSetKeyRotation = (days, start) => {
        days = Number(days);
        if(start != null) {
            start = Date.parse(start);
            if(!start) { Utils.Error("Invalid start time"); return; }
        }
        let channelConfig = Cache.channelConfig;
        if(channelConfig == null) { Utils.Error("There is no key selected in this channel"); return; }
        let keyHash = channelConfig.k/*keyHash*/;
        let keyRotator;
        if(DataBase.keyRotators != null) keyRotator = DataBase.keyRotators[keyHash];
        if(days > 0) {
            const day = 24*60*60*1000;
            let interval = days * day;
            if(start == null) {
                let now = Date.now();
                start = now - now % interval + interval;
                if(start < now + day) start += interval;
            }
            if(keyRotator == null) {
                let keyType = DataBase.keys[keyHash].t/*type*/;
                if(keyType === 3/*personal*/) { Utils.Error("You cannot add key rotation to your personal key"); return; }
                if(keyType === 2/*conversation*/) { Utils.Error("You cannot use key rotation for key exchanges"); return; }
                if(DataBase.keyRotators == null) DataBase.keyRotators = {};
                DataBase.keyRotators[keyHash] = { interval, start, seed: keyHash };
            }
            else {
                interval = day * days;
                if(keyRotator.start < Date.now()) Utils.Warn("Plase note that the numbering has been reset, you might want to change the key's name");
                keyRotator.interval = interval;
                keyRotator.start = start;
                Utils.StopKeyRotation(keyHash);
                Utils.StartKeyRotation(keyHash, keyRotator);
            }
            if(DataBase.dhPrivateKeyFallback) Utils.Warn("You are using the plugin in compatibility mode, make sure to remove all key rotation if you import the database into other devices");
            Utils.Log("Key rotation will start on " + new Date(start));
        }
        else {
            if(keyRotator == null) { Utils.Error("There is no key rotation on the current key"); return; }
            if(DataBase.keyRotators.length === 1) delete DataBase.keyRotators;
            else delete DataBase.keyRotators[keyHash];
            Utils.StopKeyRotation(keyHash);
            delete KeyRotators[keyHash];
            Utils.Log("Key rotation stopped");
        }
        Utils.dbChanged = true;
    };


    const mirrorFunction = (moduleName, functionName) => {
        let module = modules[moduleName];
        let mirroredName = `original_${functionName}`;
        let originalFunction = module[functionName];
        Discord[mirroredName] = originalFunction;
        Discord[functionName] = function() { return originalFunction.apply(module, arguments) };
    };
    const hookFunction = (moduleName, functionName) => {
        let detourName = `detour_${functionName}`;
        Discord[detourName] = Discord[functionName];
        modules[moduleName][functionName] = function() { return Discord[detourName].apply(this, arguments) };
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

    hookFunction('MessageQueue', 'enqueue');
    hookFunction('MessageDispatcher', 'dispatch');
    hookFunction('FileUploader', 'upload');

    if(modules.DiscordConstants != null && modules.DiscordConstants.SpotifyEndpoints != null) {
        let spotify = modules.DiscordConstants.SpotifyEndpoints;
        if(Object.isFrozen(spotify)) modules.DiscordConstants.SpotifyEndpoints = spotify = Object.assign({}, spotify);
        modules.SpotifyEndpoints = spotify;
        mirrorFunction('SpotifyEndpoints', 'EMBED');
        hookFunction('SpotifyEndpoints', 'EMBED');
    }
    if(modules.Premium != null && modules.Premium.canUseEmojisEverywhere != null) {
        mirrorFunction('Premium', 'canUseEmojisEverywhere');
        hookFunction('Premium', 'canUseEmojisEverywhere');
        if(modules.Premium.canUseAnimatedEmojis != null) {
            mirrorFunction('Premium', 'canUseAnimatedEmojis');
            hookFunction('Premium', 'canUseAnimatedEmojis');
        }
    }

    Style.Inject();

    LockMessages(true);
    Utils.LoadDb(() => { Load(); UnlockMessages(true); ResolveInitPromise({ Load, Unload }) }, UnlockMessages);

    //convenience feature
    ImageZoom = {};
    const isDesktopDc = navigator.userAgent.includes('discord');
    let closeModal = () => { document.querySelector(BackdropSelector).click() };
    let zoom = function(event) {
        this.removeEventListener('click', zoom);
        let url;
        if(this.src != null) url = this.src.split('?', 1)[0];
        let parent = this.parentElement;
        parent.addEventListener('click', closeModal);
        parent.classList.add('sdc-zoom');
        let p = parent.parentElement;
        /*for(let child of p.childNodes) {
            if(child !== parent) child.remove();
        }*/
        p.parentElement.style = "position: fixed; left: 0; top: 0";
        /*while(true) {
            p = p.parentElement;
            if(p == null || p.classList.contains(ModalClass)) break;
            //p.style.transform = null;
            p.style.backgroundColor = "transparent";
        }*/
        parent.style = "width: 100vw; height: 100vh; display: flex; overflow: auto; outline: 0";
        this.style = "position: relative; max-width: 100%; height: auto; user-select: none; -moz-user-select: none";
        let loading = false;
        if(url != null && url.length !== this.src.length && !url.startsWith('blob:')) {
            let loadStart = Date.now();
            const onLoad = () => {
                let duration;
                if(Date.now() - loadStart < 200) duration = 100;
                else duration = 100 + Math.log(this.naturalWidth / this.width) * 400;
                const onTransitionEnd = () => {
                    parent.style.justifyContent = null; parent.style.alignItems = null; this.style.margin = 'auto';
                    parent.scroll((this.width - parent.clientWidth) / 2, (this.height - parent.clientHeight) / 2);
                    this.removeEventListener('transitionend', onTransitionEnd);
                    this.style.transitionDuration = null;
                };
                this.addEventListener('transitionend', onTransitionEnd);
                this.style.transitionDuration = duration+'ms';
                this.style.minWidth = ((this.naturalWidth > parent.clientWidth * 2) ? parent.clientWidth * 2 : this.naturalWidth) + 'px';
                this.removeEventListener('load', onLoad);
                loading = false;
            };
            this.addEventListener('load', onLoad);
            parent.style.justifyContent = 'center';
            parent.style.alignItems = 'center';
            this.style.minWidth = ((this.naturalWidth > parent.clientWidth * 2) ? parent.clientWidth * 2 : this.naturalWidth) + 'px';
            loading = true;
            this.src = url; //img.src can be sync in FF
        }
        else {
            this.style.margin = 'auto';
            this.style.minWidth = ((this.naturalWidth > parent.clientWidth * 2) ? parent.clientWidth * 2 : this.naturalWidth) + 'px';
            parent.scroll((this.width - parent.clientWidth) / 2, (this.height - parent.clientHeight) / 2);
        }
        this.draggable = false;
        let dragDelta;
        let oldX, oldY;
        let clickRemoved;
        const drag = (event) => {
            let deltaX = oldX - event.clientX, deltaY = oldY - event.clientY;
            oldX = event.clientX; oldY = event.clientY;
            parent.scrollBy(deltaX, deltaY);
            if(clickRemoved) return;
            dragDelta += Math.sqrt(deltaX*deltaX + deltaY*deltaY);
            if(dragDelta > 10/*px*/) { parent.removeEventListener('click', closeModal); clickRemoved = true; }
        };
        const stopDrag = () => {
            let w = Discord.window;
            w.removeEventListener('mousemove', drag);
            w.removeEventListener('mouseup', stopDrag);
            w.removeEventListener('blur', stopDrag);
            if(clickRemoved) setTimeout(() => parent.addEventListener('click', closeModal), 100);
        };
        this.addEventListener('mousedown', (event) => {
            if(event.button !== 0/*Left click*/) return;
            dragDelta = 0; clickRemoved = false;
            oldX = event.clientX; oldY = event.clientY;
            let w = Discord.window;
            w.addEventListener('mousemove', drag);
            w.addEventListener('mouseup', stopDrag);
            w.addEventListener('blur', stopDrag);
        });
        this.addEventListener('dragstart', (event) => { event.preventDefault() });
        parent.tabIndex = 0;
        parent.focus();
        let loadAdded = false;
        parent.addEventListener('keydown', (event) => {
            if(loading || event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
            let images = document.querySelectorAll(ChatImageSelector);
            let count = images.length;
            for(let i = 0; i < count; i++) if(images[i].src.startsWith(url)) {
                let image = (event.key === 'ArrowLeft') ? images[i-1] : images[i+1];
                if(image != null && !image.src.startsWith('data:')) { //still loading
                    url = image.src.split('?', 1)[0];
                    if(!loadAdded) {
                        this.addEventListener('load', () => {
                            this.style.minWidth = ((this.naturalWidth > parent.clientWidth * 2) ? parent.clientWidth * 2 : this.naturalWidth) + 'px';
                            parent.scroll((this.width - parent.clientWidth) / 2, (this.height - parent.clientHeight) / 2);
                            loading = false;
                        });
                        loadAdded = true;
                    }
                    loading = true;
                    this.src = url;
                    image.scrollIntoView(/*event.key !== 'ArrowLeft'*/); //loading more images can cause some to be skipped if they are still loading
                }
                break;
            }
            event.preventDefault();
        }, true);
        if(isDesktopDc) this.addEventListener('contextmenu', (event) => {
            if(!loading && this.src) {
                let noqueryUrl = this.src.split('?', 1)[0];
                Discord.window.SdcDownloadUrl(noqueryUrl.split(/[\/#]/).pop(), noqueryUrl);
            }
            event.preventDefault();
        });

        event.stopPropagation();
    }
    ImageZoom.zoom = zoom;
    ImageZoom.observer = new MutationObserver((changes) => {
        for(let change of changes) for(let added of change.addedNodes)
            if(added.tagName === 'IMG') {
                if(added.matches(ModalImgSelector)) {
                    added.addEventListener('click', zoom);
                }
                return;
            }
            else if(added.classList != null && added.classList.contains(ModalClass)) {
                let img = added.querySelector(ImageWrapperImgSelector);
                if(img != null) {
                    img.addEventListener('click', zoom);
                }
                return;
            }
    });
    return 1;
}


async function handleMessage(event) {
    if(!await processMessage(event.message))
        Discord.original_dispatch.apply(this, arguments);
}
async function handleMessages(event) {
    for(let message of event.messages.slice()) //in case they reverse the array
        await processMessage(message);

    Discord.original_dispatch.apply(this, arguments);
}
async function handleSearch(event) {
    for(let group of event.messages)
        for(let message of group)
            await processMessage(message);

    Discord.original_dispatch.apply(this, arguments);
}
async function handleUpdate(event) {
    let message = event.message;
    if(message.content == null && message.embeds != null && message.embeds.length === 1) {
        let embed = message.embeds[0];
        if(embed.footer != null && (embed.footer.text === "SimpleDiscordCrypt" || embed.footer.text === "𝘚𝘪𝘮𝘱𝘭𝘦𝘋𝘪𝘴𝘤𝘰𝘳𝘥𝘊𝘳𝘺𝘱𝘵")) {
            return; //ignore embed-only updates
        }
    }

    if(!await processMessage(message))
        Discord.original_dispatch.apply(this, arguments);
}

const messageRegex = /^([⠀-⣿]{16,}) `(?:SimpleDiscordCrypt|𝘚𝘪𝘮𝘱𝘭𝘦𝘋𝘪𝘴𝘤𝘰𝘳𝘥𝘊𝘳𝘺𝘱𝘵)`$/;
const unknownKeyMessage = "```fix\n-----ENCRYPTED MESSAGE WITH UNKNOWN KEY-----\n```";
const invalidMessage = "```diff\n-⁣----ENCRYPTED MESSAGE WITH UNKNOWN FORMAT-----\n```"; //invisible separator after the first '-'
async function processMessage(message, ignoreAttachments) {
    let result;
    let match = messageRegex.exec(message.content);
    if(match != null) { //simple messsage
        result = await decryptMessage(message, match[1], ignoreAttachments);
    }
    else {
        result = await processEmbeds(message, ignoreAttachments);
    }

    if((Cache.pingOn != null) && Cache.pingOn.test(message.content)) message.mentions = [Discord.getCurrentUser()];

    return result;
}

function scrollChat(by) {
    let messageContainer = document.querySelector(MessageScrollerSelector);
    if(messageContainer == null) return;
    if(messageContainer.scrollTop + 1 >= (messageContainer.scrollHeight - messageContainer.clientHeight)) return; //scrolled to bottom
    messageContainer.scrollTop += by;
}

var mediaTypes = { 'png': 'img', 'jpg': 'img', 'jpeg': 'img', 'gif': 'img', 'webp': 'img', 'webm': 'video', 'mp4': 'video', 'jpe': 'img', 'jfif': 'img', 'mov': 'video' };
const extensionRegex = /\.([^.]+)$/;
var downloadLocked = false;
var downloadLocks = [];
async function decryptAttachment(key, keyHash, message, attachment, channelConfig) {
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
    let placeholder;
    let isVideo = false;
    if(mediaType === 'img') {
        placeholder = spoiler ? {
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
    }
    else {
        isVideo = true;
        placeholder = {
            type: 'image',
            title: "Loading...",
            thumbnail: {
                url: "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==",
                width: 400,
                height: 300
            }
        }
    }
    message.embeds.push(placeholder);

    const downloadAndProcess = async () => {
        if(downloadLocked) {
            await (new Promise((resolve) => downloadLocks.push([message.channel_id, resolve])));
        }
        else downloadLocked = true;

        let encryptedFileBuffer;
        try {
            encryptedFileBuffer = await Utils.DownloadFile(encryptedUrl);
        }
        catch(e) { Utils.Error('File download faled'); return; }
        finally {
            if(downloadLocks.length !== 0) {
                let unlockNext;
                let importantDlIndex = downloadLocks.findIndex(([channelId]) => (channelId === Cache.channelId));
                unlockNext = (importantDlIndex > 0) ? downloadLocks.splice(importantDlIndex, 1)[0][1] : downloadLocks.shift()[1];
                unlockNext();
            }
            else downloadLocked = false;
        }

        let fileBuffer = await Utils.AesDecrypt(await Utils.GetKeyByHash(keyHash), encryptedFileBuffer);
        let blob = new File([fileBuffer], filename);
        let bloburl = `${URL.createObjectURL(new File([fileBuffer], filename))}#${filename}`;
        let url;
        let downloadUrl = `javascript:SdcDownloadUrl(${JSON.stringify(filename)},${JSON.stringify(bloburl)})`;

        let width;
        let height;
        if(FixedCsp || isVideo) {
            url = bloburl;
            let tmpMedia = document.createElement(mediaType);
            if(isVideo) {
                await (new Promise((resolve) => {
                    tmpMedia.onloadeddata = () => { tmpMedia.ontimeupdate = resolve; tmpMedia.currentTime = 0; };
                    tmpMedia.src = url;
                }));
                width = tmpMedia.videoWidth;
                height = tmpMedia.videoHeight;
                let canvas = document.createElement('canvas');
                let ctx = canvas.getContext('2d');

                let coverImageUrl;
                if(FixedCsp) {
                    canvas.width = width;
                    canvas.height = height;
                    if(spoiler) ctx.filter = "blur(50px)";
                    ctx.drawImage(tmpMedia, 0, 0);
                    coverImageUrl = URL.createObjectURL(await new Promise((resolve) => canvas.toBlob(resolve))) + '#';
                }
                else {
                    let posterWidth = width;
                    let posterHeight = height;
                    if(width > 800 || height > 600) {
                        if(width / 800 > height / 600) {
                            posterWidth = 800;
                            posterHeight = Math.round(height / (width / 800));
                        }
                        else {
                            posterWidth = Math.round(width / (height / 600));
                            posterHeight = 600;
                        }
                    }
                    canvas.width = posterWidth;
                    canvas.height = posterHeight;
                    if(spoiler) ctx.filter = "blur(50px)";
                    ctx.drawImage(tmpMedia, 0, 0, posterWidth, posterHeight);
                    coverImageUrl = canvas.toDataURL('image/webp', 0.6);
                }

                Object.assign(placeholder, {
                    type: 'video',
                    //color: BaseColorInt,
                    url: "/#" + downloadUrl, //ugly hack because Discord now filters urls here
                    title: "Download",
                    thumbnail: { url: coverImageUrl, width, height }, //for some reason chromium seems to replace the cover image sadly
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
            let id = Patcher.FreeImageId++;
            url = `https://media.discordapp.net/attachments/479272118538862592/479272171944804377/keylogo.png#${id}`;
            let bitmap = await createImageBitmap(blob); //resets image rotation it seems
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

        /*if(message.channel_id !== Cache.channelId) return;

        let displayHeight = height;
        if(!spoiler || mediaType === 'video') {
            if(width > 400 || height > 300) { //image will be resized
                if(width / 400 > height / 300) { //scale by with
                    displayHeight = Math.round(height / (width / 400));
                }
                else { //scale by height
                    displayHeight = 300;
                }
            }
            if(displayHeight !== 300) scrollChat(300 - displayHeight);
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
            if(displayHeight !== 80) scrollChat(80 - displayHeight);
        }*/
    };
    if(message.channel_id === Cache.channelId || (channelConfig != null && channelConfig.l/*lastseen*/ > Date.now() - InactiveChannelTime)) downloadAndProcess();
    else {
        let onChannelOpen = () => { downloadAndProcess(); Utils.RemoveChannelSelectListener(message.channel_id, onChannelOpen); };
        Utils.AddChannelSelectListener(message.channel_id, onChannelOpen);
    }
}

const starttimeRegex = /(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/;
function createYoutubeEmbed(id, timequery) {
    let embedUrl = `https://youtube.com/embed/${id}`;
    if(timequery != null) {
        let time = timequery.split('=')[1];
        let timeMatch = starttimeRegex.exec(time);
        let t = 0;
        if(timeMatch[1] !== undefined) t += timeMatch[1] * 3600;
        if(timeMatch[2] !== undefined) t += timeMatch[2] * 60;
        if(timeMatch[3] !== undefined) t += parseInt(timeMatch[3]);
        if(t !== 0) time = t;
        embedUrl += "?start=" + time;
    }
    return {
        type: 'video',
        url: `https://youtube.com/watch?v=${id}`,
        thumbnail: { url: `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`, width: 1280, height: 720 },
        video: { url: embedUrl, width: 1280, height: 720 }
    }
}
const youtubeRegex = /[?&]v=([\w-]+).*?(&(?:t|start)=[\dhms]+)?/;
function embedYoutube(message, url, queryString) {
    let match = youtubeRegex.exec(queryString);
    if(match != null) message.embeds.push(createYoutubeEmbed(match[1], match[2]));
}
const youtuRegex = /^([\w-]+).*?(\?(?:t|start)=[\dhms]+)?/;
function embedYoutu(message, url, queryString) {
    let match = youtuRegex.exec(queryString);
    if(match != null) message.embeds.push(createYoutubeEmbed(match[1], match[2]));
}
const imageRegex = /^[^?]*\.(?:png|jpe?g|gif|webp)(?:$|\?)/i;
function embedImage(message, url, queryString) {
    if(!imageRegex.test(queryString)) return;

    let placeholder = {
        type: 'image',
        url,
        thumbnail: {
            url: "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==",
            width: 1,
            height: 300
        }
    };
    message.embeds.push(placeholder);
    let tmpimg = document.createElement('img');
    tmpimg.onload = () => {
        let width = tmpimg.width;
        let height = tmpimg.height;
        placeholder.thumbnail = { url, width, height };
        Discord.dispatch({type: 'MESSAGE_UPDATE', message});

        /*if(message.channel_id === Cache.channelId) {
            let displayHeight = height;
            if(width > 400 || height > 300) {
                if(width / 400 > height / 300) {
                    displayHeight = Math.round(height / (width / 400));
                }
                else {
                    displayHeight = 300;
                }
            }
            if(displayHeight !== 300) scrollChat(300 - displayHeight);
        }*/
    };
    tmpimg.src = url;
}
var EmbedFrames = [];
function embedEncrypted(message, url, queryString) {
    if(Discord.detour_EMBED != null) {
        let embedFrameId = EmbedFrames.push(url) - 1;
        message.embeds.push({
            type: 'link',
            provider: {url: null, name: "Spotify"},
            url: "https://open.spotify.com/playlist//" + embedFrameId
        });
    }
    else {
        message.embeds.push({
            type: 'video',
            url,
            thumbnail: { url: "https://media.discordapp.net/attachments/449522590978146304/465783850144890890/key128.png", width: 128, height: 128 },
            video: { url, width: 400, height: 300 }
        });
    }
}
function embedMega(message, url, queryString) {
    if(!queryString.startsWith("embed")) {
		if(queryString.startsWith("file"))
            queryString = queryString.substr(4);
        url = "https://mega.nz/embed" + queryString;
    }
    embedEncrypted(message, url, null);
}
const validSoundcloudRegex = /^[^\/]+\/[^\/?]+(\?|$)/;
function embedSoundcloud(message, url, queryString) {
    if(validSoundcloudRegex.test(queryString))
        embedEncrypted(message, "https://w.soundcloud.com/player/?visual=true&url=" + encodeURIComponent(url), null);
}
const linkEmbedders = {
    "www.youtube.com": embedYoutube,
    "youtu.be": embedYoutu,
    "cdn.discordapp.com": embedImage,
    "media.discordapp.net": embedImage,
    "i.imgur.com": embedImage
};
if(FixedCsp) Object.assign(linkEmbedders, {
    "i.redd.it": embedImage,
    "soundcloud.com": embedSoundcloud,
    "share.riseup.net": embedEncrypted,
    "mega.nz": embedMega
});

const MENTION_EVERYONE_CHECK = 0x20000n;
const everyoneRegex = /(?<!https?:\/\/[^\s]*)@(?:everyone|here)/;
const roleMentionRegex = /<@&(\d{16,20})>/g;
const urlRegex = /(?:<https?:\/\/(?:[^\s\/?\.#]+\.)+(?:[^\s\/?\.#]+)\/[^\s<>'"]+>|https?:\/\/((?:[^\s\/?\.#]+\.)+(?:[^\s\/?\.#]+))\/([^\s<>'"]+))/g;
function postProcessMessage(message, content) {
    let currentUser = Discord.getCurrentUser();
    if(content.includes(`<@${currentUser.id}>`) || content.includes(`<@!${currentUser.id}>`)) {
        message.mentions = [currentUser];
    }
    else if(message.author != null) {
        let guildId = message.guild_id;
        let channel;
        if(guildId == null) {
            channel = Discord.getChannel(message.channel_id);
            guildId = channel.guild_id;
        }
        if(guildId != null) {
            let canMentionEveryone;
            if(everyoneRegex.test(content)) {
                if(channel == null) channel = Discord.getChannel(message.channel_id);
                message.mention_everyone = canMentionEveryone = Discord.can(MENTION_EVERYONE_CHECK, message.author, channel);
            }

            let mentionRoles = [...content.matchAll(roleMentionRegex)].map(x => x[1]);
            if(mentionRoles.length !== 0) {
                if(canMentionEveryone == null) {
                    if(channel == null) channel = Discord.getChannel(message.channel_id);
                    canMentionEveryone = Discord.can(MENTION_EVERYONE_CHECK, message.author, channel);
                }
                if(!canMentionEveryone) {
                    let guild = Discord.getGuild(guildId);
                    mentionRoles = mentionRoles.filter(x => guild.roles[x] && guild.roles[x].mentionable);
                }
                message.mention_roles = mentionRoles;
            }
        }
    }

    let url;
    while((url = urlRegex.exec(content)) != null && url[1] != null) {
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

let keyChangeWatchers = {};
async function decryptMessage(message, payload, ignoreAttachments) {
    if(message.referenced_message != null)
        await processMessage(message.referenced_message, true);

    let payloadBuffer = Utils.PayloadDecode(payload).buffer;
    let keyHashBytes = payloadBuffer.slice(0, 16);
    let keyHashBase64 = Utils.BytesToBase64(keyHashBytes);
    let keyObjRef = [];
    let key = await Utils.GetKeyByHash(keyHashBase64, keyObjRef);

    if(key == null) {
        let messageDeleted = false;
        if(!DataBase.isSecondary && message.author != null) {
            let keyExchangeConcluded = false;
            let keyExchange = Utils.InitKeyExchangeAndRequestKey(keyHashBase64, message.author, message.id);

            let onMessageDelete;
            let messageDeleteException = new Promise((resolve) => {
                onMessageDelete = () => { messageDeleted = true; resolve(); };
                Utils.AddMessageDeleteListener(message.id, onMessageDelete);
            });

            for(let i = 1; i <= 5; i++) {
                await Promise.race([keyExchange, Utils.Sleep(i * 200), messageDeleteException]);
                if(messageDeleted) break;

                key = await Utils.GetKeyByHash(keyHashBase64);
                if(key != null || keyExchangeConcluded) break;
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

    let channelId = message.channel_id;
    let channelConfig = (channelId === Cache.channelId) ? Cache.channelConfig : DataBase.channels[channelId]; //don't bump lastseen
    let keyObj = keyObjRef[0];
    let myKey;
    let differentKey = false;
    let differentKeyDescriptor;
    let differentKeyDesc;
    let notPersonalKey = (keyObj.t/*type*/ !== 3/*personal*/);
    if(channelConfig == null) {
        differentKey = notPersonalKey;
    }
    else if(keyHashBase64 !== channelConfig.k/*key*/) {
        if(notPersonalKey) differentKey = true;
        else {
            myKey = DataBase.keys[channelConfig.k];
            if(myKey.t/*type*/ !== 3/*personal*/) differentKey = true;
        }
    }
    if(differentKey) {
        differentKeyDescriptor = Utils.FormatDescriptor(keyObj.d/*descriptor*/);
        differentKeyDesc = differentKeyDescriptor.replace(/ /g, '_').replace(/\W/g, "");
    }
    let timestamp = new Date(message.timestamp).getTime();
    if(differentKey && notPersonalKey && channelConfig != null) {
        if(timestamp > Date.now() - IgnoreDiffKeyAge) {
            let keyChangeWatcher = keyChangeWatchers[channelId];
            if(keyChangeWatcher == null) keyChangeWatchers[channelId] = { different: 1, sameKeyTime: 0 };
            else if(timestamp > keyChangeWatcher.sameKeyTime && ++keyChangeWatcher.different === DiffKeyTrigger && KeyRotators[channelConfig.k] == null) {
                if(myKey == null) myKey = DataBase.keys[channelConfig.k];
                if(myKey.t/*type*/ !== 2/*conversation*/) (async () => {
                    let popupOverride = {};
                    let popup = PopupManager.NewPromise(`Would you like to set key to "${differentKeyDescriptor}" in "${Utils.FormatDescriptor(channelConfig.d)}"`, true, popupOverride);
                    const autoCancel = () => { keyChangeWatcher.different = 0; popupOverride.cancel(); };
                    Utils.AddMessageDeleteListener(message.id, autoCancel);
                    let changeKey = await popup;
                    Utils.RemoveMessageDeleteListener(message.id, autoCancel);
                    if(changeKey) {
                        if(channelId === Cache.channelId) { await Utils.SetCurrentChannelKey(keyHashBase64); MenuBar.Update(); }
                        else Utils.SetChannelKey(channelId, keyHashBase64);
                    }
                })();
            }
        }
    }
    else if(timestamp > Date.now() - IgnoreDiffKeyAge) {
        let keyChangeWatcher = keyChangeWatchers[channelId];
        if(keyChangeWatcher == null) keyChangeWatchers[channelId] = { different: 0, sameKeyTime: timestamp };
        else if(keyChangeWatcher.sameKeyTime < timestamp) { keyChangeWatcher.different = 0; keyChangeWatcher.sameKeyTime = timestamp; }
    }


    message.embeds = []; //remove embeds in case of edit and in case of the payload is from the embed

    if(payloadBuffer.byteLength === 16) {
        if(!differentKey) message.content = "<:ENC:465534298662109185>⁣"; //invisible separator at the end to make the emoji smaller
        else message.content = `<:ENC_${differentKeyDesc}:611264394747183115>⁣`;
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
        if(!differentKey) message.content = "<:ENC:465534298662109185>" + content;
        else message.content = `<:ENC_${differentKeyDesc}:611264394747183115>` + content;
        //message.content = content.replace(/^/gm, "<:ENC:465534298662109185>"); //bad for code blocks
        postProcessMessage(message, content);
    }

    if(message.attachments != null && message.attachments.length !== 0 && !ignoreAttachments) {
        let attachments = message.attachments;
        message.attachments = [];
        for(let attachment of attachments) {
            try {
                await decryptAttachment(key, keyHashBase64, message, attachment, channelConfig);
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

    if(DataBase.isSecondary && !keyExchangeWhitelist[userId] &&
       (messageType !== 'KEY SHARE' || DataBase.trustedKeys == null || !DataBase.trustedKeys[channelConfig.s])) oldMessage = true; //check the sender key later

    let nonForced = true;
    if(!oldMessage) {
        message.content = blockedSystemMessage;
        if(/friend/i.test(DataBase.autoKeyExchange) && !Discord.isFriend(userId)) {
            if(messageType === 'DH KEY' || messageType === 'DH RESPONSE' || messageType === 'PERSONAL KEY' || messageType === 'KEY SHARE') {
                if(!keyExchangeWhitelist[userId]) {
                    //let user = Discord.getUser(userId);
                    if(!await PopupManager.NewPromise(`Would you like to accept key exchange from ${message.author.username}#${message.author.discriminator}`, true)) return false;
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
                Utils.KeyShareEvent(keyHash);
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
                Utils.KeyShareEvent(keyHash);
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
                Utils.KeyShareEvent(remotePersonalKeyHash);

                await Utils.SendPersonalKey(message.channel_id);

                Utils.KeyExchangeEvent(userId);

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
                Utils.KeyShareEvent(remotePersonalKeyHash);

                delete channelConfig.w; //waitingForSystemMessage
                Utils.dbChanged = true;
                delete keyExchangeWhitelist[userId];

                Utils.KeyExchangeEvent(userId);

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

                if(keyType !== 1/*group*/) keyDescriptor += ` by <@${userId}>`;

                let keyHidden = (getSystemMessageProperty('keyHidden', sysmsg) === 'YES');

                let sharedKeyHash = await Utils.SaveKey(sharedKey, keyType, keyDescriptor, keyHidden);
                Utils.KeyShareEvent(sharedKeyHash);

                delete channelConfig.w; //waitingForSystemMessage
                Utils.dbChanged = true;
                delete keyExchangeWhitelist[userId];

                if(keyType === 1/*group*/) {
                    let sharedChannelsJson = getSystemMessageProperty('sharedChannels', sysmsg);
                    if(sharedChannelsJson != null) {
                        let trustedKey = (DataBase.trustedKeys != null && DataBase.trustedKeys[keyHash]);
                        let sharedChannels = JSON.parse(sharedChannelsJson);
                        for(let channelId of sharedChannels) {
                            let channelConfig = DataBase.channels[channelId];
                            if(channelConfig == null) {
                                let sharedChannelConfig = Utils.NewChannelConfig(channelId, sharedKeyHash);
                                if(channelId === Cache.channelId) {
                                    Cache.channelConfig = sharedChannelConfig;
                                    MenuBar.Update();
                                }
                            }
                            else if(trustedKey) {
                                let currentKey = DataBase.keys[channelConfig.k/*keyHash*/];
                                if(currentKey.t/*type*/ !== 1/*group*/) continue;
                                channelConfig.k/*keyHash*/ = sharedKeyHash;
                                Utils.dbChanged = true;
                                if(channelId === Cache.channelId) MenuBar.Update();
                            }
                        }
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
async function processEmbeds(message, ignoreAttachments) {
    if(message.embeds == null || message.embeds.length !== 1) return;
    let embed = message.embeds[0];
    if(embed.footer == null || (embed.footer.text !== "SimpleDiscordCrypt" && embed.footer.text !== "𝘚𝘪𝘮𝘱𝘭𝘦𝘋𝘪𝘴𝘤𝘰𝘳𝘥𝘊𝘳𝘺𝘱𝘵")) return;

    if(embed.author == null) return;

    if(embed.author.name === "-----ENCRYPTED MESSAGE-----") {
        if(!descriptionRegex.test(embed.description)) return;
        return await decryptMessage(message, embed.description, ignoreAttachments);
    }
    else if(embed.author.name === "-----SYSTEM MESSAGE-----") {
        processSystemMessage(message, embed.description).then((delayed) => { if(delayed) Utils.UpdateMessageContent(message); } );
    }
}

function handleChannelSelect(event) {
    if(Blacklist != null) {
        let guildId = event.guildId;
        Cache.channelBlacklist = (guildId == null) ? null : Blacklist[guildId];
    }
    let channelId = event.channelId;
    if(channelId != null) {
        Cache.channelId = channelId;
        Cache.channelConfig = Utils.GetChannelConfig(channelId);

        Utils.ChannelSelectEvent(channelId);

        setTimeout(() => { MenuBar.Update() }, 0);
        setTimeout(() => { PopupManager.Update() }, 0);
        //Update after event is processed by Discord
    }

    Discord.original_dispatch.apply(this, arguments);
}

function handleDelete(event) {
    Utils.MessageDeleteEvent(event.id);
    Discord.original_dispatch.apply(this, arguments);
}
function handleDeletes(event) {
    Utils.MessageDeleteBulkEvent(event.ids);
    Discord.original_dispatch.apply(this, arguments);
}

const EMBED_LINKS_CHECK = 0x4000n;
const prefixRegex = /^(?::?ENC(?:(?:_\w*)?:|\b)|<:ENC:\d{1,20}>)\s*/;
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
    if(forceSimple || Cache.channelBlacklist === 2 || (channel.type === 0 && !Discord.can(EMBED_LINKS_CHECK, Discord.getCurrentUser(), channel))) {
       message.content = payload + " `𝘚𝘪𝘮𝘱𝘭𝘦𝘋𝘪𝘴𝘤𝘰𝘳𝘥𝘊𝘳𝘺𝘱𝘵`";
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
                text: "𝘚𝘪𝘮𝘱𝘭𝘦𝘋𝘪𝘴𝘤𝘰𝘳𝘥𝘊𝘳𝘺𝘱𝘵",
                icon_url: "https://i.imgur.com/zWXtTpX.png",
            }
        };
    }
    return key;
}

const filenameLimit = 47;
const filenameRegex = /^(.*?)((?:\.[^.]*)?)$/;
async function handleUpload(channelId, file, draftType, message, spoiler, filename) {
    let key = await handleSend(channelId, message, true);
    if(key == null) return arguments;

    if(spoiler) {
        arguments[4] = false;
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
        arguments[5] = encryptedFilename;
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
    'MESSAGE_UPDATE': handleUpdate,
    'MESSAGE_DELETE': handleDelete,
    'MESSAGE_DELETE_BULK': handleDeletes
}

var messageLocks = [];
var UnlockMessages;
function LockMessages(initial) {
    Discord.detour_dispatch = function(event){(async () => {
        if(event.type === 'LOAD_MESSAGES_SUCCESS' || event.type === 'MESSAGE_CREATE' || event.type === 'MESSAGE_UPDATE') {

            await new Promise((resolve) => { messageLocks.push(resolve) });

            return Discord.detour_dispatch.apply(this, arguments);
        }

        Discord.original_dispatch.apply(this, arguments);
    })()};

    UnlockMessages = (lifted) => {
        if(!lifted) Discord.detour_dispatch = Discord.dispatch;
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
    while((record = blacklistRegex.exec(blacklistString)) != null) {
        Blacklist[record[1]] = (record[2] === 'E') ? 2 : 1;
    }

    for(let i = 1;; i++) {
        if(await Utils.RefreshCache() || i === 10) break;
        await Utils.Sleep(i * 200);
    }

    if(Cache.channelBlacklist === 1) MenuBar.Update();
}

function HandleDispatch(event) {
    let handler = eventHandlers[event.type];
    if(handler !== undefined) {
        return handler.apply(this, arguments);
    }

    Discord.original_dispatch.apply(this, arguments);
}

var dbSaveInterval;
function Load()
{
    let modules = Discord.modules;

    Utils.RefreshCache();

    Discord.detour_enqueue = function(packet){(async () => {

        await handleSend(packet.message.channelId, packet.message, packet.type === 1/*edit*/);

        Discord.original_enqueue.apply(this, arguments);
    })()};

    Discord.detour_dispatch = HandleDispatch;

    Discord.detour_upload = function(){(async () => {

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

    if(Discord.detour_EMBED != null) Discord.detour_EMBED = function(path, t) {

        if(path.startsWith("/playlist//")) return EmbedFrames[path.substr(11)];

        return Discord.original_EMBED.apply(this, arguments);
    };

    if(Discord.detour_canUseEmojisEverywhere != null) Discord.detour_canUseEmojisEverywhere = function() {
        return !!Utils.GetCurrentChannelEncrypt() || Discord.original_canUseEmojisEverywhere.apply(this, arguments);
    };
    if(Discord.detour_canUseAnimatedEmojis != null) Discord.detour_canUseAnimatedEmojis = function() {
        return !!Utils.GetCurrentChannelEncrypt() || Discord.original_canUseAnimatedEmojis.apply(this, arguments);
    };

    MenuBar.Show(() => Utils.GetCurrentChannelEncrypt(),
                 () => { Utils.ToggleCurrentChannelEncrypt(); MenuBar.Update(); },
                 () => {
        let currentKeyHash = Utils.GetCurrentChannelKeyHash();
        return [Utils.FormatDescriptor(DataBase.keys[currentKeyHash].d), (DataBase.trustedKeys != null && DataBase.trustedKeys[currentKeyHash])];
    },
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
                 async (key) => { await Utils.SetCurrentChannelKey(key.hash); MenuBar.Update(); },
                 () => Utils.GetCurrentChannelIsDm(),
                 () => Utils.DownloadDb(),
                 () => Utils.DownloadDb(true),
                 () => Utils.NewDb(() => { Utils.RefreshCache(); MenuBar.Update(); }),
                 () => Utils.NewDbPassword(),
                 () => Utils.InitKeyExchange({id:Utils.GetCurrentDmUserId()}),
                 async () => { await Utils.SetCurrentChannelKey(await Utils.SaveKey(Utils.GetRandomBytes(32), 1/*group*/, `Group <#${Cache.channelId}>`)); MenuBar.Update(); },
                 () => {
        let personalKeyHash = DataBase.personalKeyHash;
        let personalKey = DataBase.keys[personalKeyHash];
        let keys = [{hash: personalKeyHash,
                     rawDescriptor: personalKey.d,
                     descriptor: Utils.FormatDescriptor(personalKey.d),
                     lastseen: personalKey.l,
                     hidden: personalKey.h,
                     type: 'PERSONAL',
                     trusted: (DataBase.trustedKeys != null && DataBase.trustedKeys[personalKeyHash]),
                     protected: true}];
        const keyTypes = { 1:'GROUP', 2:'CONVERSATION', 3:'PERSONAL' };
        Object.entries(DataBase.keys).sort(([,a], [,b]) => b.l - a.l).forEach(([hash, keyObj]) => {
            if(hash !== personalKeyHash) keys.push({ hash, rawDescriptor: keyObj.d, lastseen: keyObj.l, descriptor: Utils.FormatDescriptor(keyObj.d), hidden: keyObj.h, type: keyTypes[keyObj.t], trusted: (DataBase.trustedKeys != null && DataBase.trustedKeys[hash]) })
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
                 () => {
        let keyHash = Utils.GetCurrentChannelKeyHash();
        KeyVisualizerWindow.Show(Utils.Base64ToBytes(keyHash).buffer, () => { Utils.ToggleKeyTrusted(keyHash); MenuBar.Update(); });
    },
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

    const executeCall = (event, caller, code) => {
        let match = /^\s*([^\s(]+)\s*\((.*)\)$/s.exec(code);
        if(match != null) {
            event.preventDefault();
            let method = match[1];
            let params = JSON.parse(`[${match[2].replace(/'/g, '"')}]`);
            Discord.window[method].apply(this, params);
        }
    };
    const scriptLink = function(event) {
        return executeCall(event, this, this.attributes.href.value.substr(11));
    };
    const fakeScriptLink = function(event) {
        return executeCall(event, this, this.attributes.href.value.substr(13));
    };
    const tryReplaceLink = (a) => {
        let href = a.attributes.href;
        if(href === undefined) return;
        href = href.value;
        if(href.startsWith("/#javascript:")) {
            a.addEventListener('click', fakeScriptLink);
            a.addEventListener('auxclick', fakeScriptLink);
        }
        else if(href.startsWith("javascript:")) {
            a.addEventListener(href.startsWith("javascript:SdcDecryptDl(") ? 'click' : 'auxclick', scriptLink);
        }
    }
    //const isFirefox = navigator.userAgent.includes('Firefox');
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
            if(img.matches(ModalImgSelector)) canvas.addEventListener('click', ImageZoom.zoom);
            else if(img.matches(MessageImgSelector) && (width > 800 || height > 600)) {
                if(width / 800 > height / 600) { height = Math.round(height / (width / 800)); width = 800; }
                else { width = Math.round(width / (height / 600)); height = 600; }
            }
            canvas.width = width;
            canvas.height = height;
            let ctx = canvas.getContext('2d');
            ctx.drawImage(bitmap, 0, 0, width, height);
            canvas.style.cssText = img.style.cssText;
            img.replaceWith(canvas);
        };
        Patcher = {
            observer: new MutationObserver((mutations) => {
                for(let mutation of mutations) {
                    if(mutation.type === 'attributes') {
                        let tagName = mutation.target.tagName;
                        if(tagName === 'IMG') {
                            if(mutation.attributeName !== 'src') continue;
                            tryReplaceImage(mutation.target);
                        }
                        else if(tagName === 'A') {
                            tryReplaceLink(mutation.target);
                        }
                    }
                    else {
                        for(let addedNode of mutation.addedNodes) {
                            if(addedNode.tagName === 'IMG') { tryReplaceImage(addedNode); return; }

                            if(addedNode.getElementsByTagName == null) continue;

                            for(let img of addedNode.getElementsByTagName('img')) {
                                tryReplaceImage(img);
                            }

                            for(let a of addedNode.getElementsByTagName('a')) {
                                tryReplaceLink(a);
                            }
                        }
                    }
                }
            }),
            Images: [],
            FreeImageId: 0
        };
    }
    else {
        Patcher = {
            observer: new MutationObserver((mutations) => {
                for(let mutation of mutations) {
                    if(mutation.type === 'attributes') {
                        if(mutation.target.tagName === 'A') {
                            tryReplaceLink(mutation.target);
                        }
                    }
                    else {
                        for(let addedNode of mutation.addedNodes) {
                            if(addedNode.getElementsByTagName == null) continue;
                            for(let a of addedNode.getElementsByTagName('a')) {
                                tryReplaceLink(a);
                            }
                        }
                    }
                }
            })
        };
    }
    Patcher.observer.observe(document.documentElement, { attributes: true, childList: true, subtree: true });

    dbSaveInterval = setInterval(() => { Utils.SaveDb() }, 10000);

    KeyRotators = {};
    if(DataBase.keyRotators != null) {
        for(let [keyHash, keyRotator] of Object.entries(DataBase.keyRotators))
            Utils.StartKeyRotation(keyHash, keyRotator);
    }

    let appDiv = document.getElementById('app-mount');
    if(appDiv != null) ImageZoom.observer.observe(appDiv, { childList: true, subtree: true });

    if(DataBase.pingOn) {
        let fullRegex = /^\/(.*)\/([imsu]{0,4})$/.exec(DataBase.pingOn);
        Cache.pingOn = fullRegex ? new RegExp(fullRegex[1], fullRegex[2]) : new RegExp(DataBase.pingOn);
    }

    Utils.Log("loaded");

    LoadBlacklist();
}

function Unload()
{
    const restoreFunction = (moduleName, functionName) => { Discord[`detour_${functionName}`] = Discord[`original_${functionName}`]; };

    restoreFunction('MessageQueue', 'enqueue');
    restoreFunction('MessageDispatcher', 'dispatch');
    restoreFunction('FileUploader', 'upload');
    if(Discord.detour_EMBED != null) restoreFunction('SpotifyEndpoints', 'EMBED');
    if(Discord.detour_canUseEmojisEverywhere != null) restoreFunction('Premium', 'canUseEmojisEverywhere');
    if(Discord.detour_canUseAnimatedEmojis != null) restoreFunction('Premium', 'canUseAnimatedEmojis');

    if(Patcher != null) Patcher.observer.disconnect();

    Style.Remove();
    UnlockWindow.Remove();
    NewdbWindow.Remove();
    NewPasswordWindow.Remove();
    KeyManagerWindow.Remove();
    ChannelManagerWindow.Remove();
    ShareKeyWindow.Remove();
    MenuBar.Remove();
    PopupManager.Remove();
    KeyVisualizerWindow.Remove();

    clearInterval(dbSaveInterval);

    ImageZoom.observer.disconnect();

    Utils.Log("unloaded");
}

var InitTries = 200;
function TryInit()
{
    let final = --InitTries === 0;
    if(Init(final) !== 0 || final) return;

    window.setTimeout(TryInit, 100);
};


Utils.Log("injected");

TryInit();

return InitPromise;
})();

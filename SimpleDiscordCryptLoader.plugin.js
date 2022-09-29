/**
 * @name SimpleDiscordCryptLoader
 * @version 1.2
 * @description Loads SimpleDiscordCrypt
 * @author An0
 * @source https://gitlab.com/An0/SimpleDiscordCrypt
 */

/*@cc_on
@if (@_jscript)
    var shell = WScript.CreateObject("WScript.Shell");
    var fs = new ActiveXObject("Scripting.FileSystemObject");
    var pathPlugins = shell.ExpandEnvironmentStrings("%APPDATA%\\BetterDiscord\\plugins");
    var pathSelf = WScript.ScriptFullName;
    shell.Popup("It looks like you've mistakenly tried to run me directly. \\n(Don't do that!)", 0, "I'm a plugin for BetterDiscord", 0x30);
    if (fs.GetParentFolderName(pathSelf) === fs.GetAbsolutePathName(pathPlugins)) {
        shell.Popup("I'm in the correct folder already.", 0, "I'm already installed", 0x40);
    } else if (!fs.FolderExists(pathPlugins)) {
        shell.Popup("I can't find the BetterDiscord plugins folder.\\nAre you sure it's even installed?", 0, "Can't install myself", 0x10);
    } else if (shell.Popup("Should I copy myself to BetterDiscord's plugins folder for you?", 0, "Do you need some help?", 0x34) === 6) {
        fs.CopyFile(pathSelf, fs.BuildPath(pathPlugins, fs.GetFileName(pathSelf)), true);
        // Show the user where to put plugins in the future
        shell.Exec("explorer " + pathPlugins);
        shell.Popup("I'm installed!", 0, "Successfully installed", 0x40);
    }
    WScript.Quit();
@else @*/


var SimpleDiscordCryptLoader = (() => {

'use strict';

let localStorage;
let iframe;
const CspDisarmed = true;
let Initialized = false;
let Loaded = false;

var InitPromise;

function Start() {
    if(!Initialized) {
        iframe = document.createElement('iframe');
        iframe.style.display = 'none';

        iframe.onload = () => {
            iframe.contentDocument.body.innerHTML = "<iframe/>";
            localStorage = Object.getOwnPropertyDescriptor(iframe.contentDocument.body.children[0].__proto__, 'contentWindow').get.apply(iframe).localStorage;

            require('https').get("https://gitlab.com/An0/SimpleDiscordCrypt/raw/master/SimpleDiscordCrypt.user.js", (response) => {
                let data = [];
                response.on('data', (chunk) => data.push(chunk));
                response.on('end', () => eval(typeof data[0] === 'string' ? data.join("") : Buffer.concat(data).toString()));
            });
        };
        document.body.appendChild(iframe);

        Initialized = true;
    }
    else if(!Loaded && InitPromise) {
        InitPromise.then(({Load}) => {
            Load();
            Loaded = true;
        });
    }
}

function Stop() {
    if(!Initialized) return;

    if(Loaded && InitPromise) {
        InitPromise.then(({Unload}) => {
            Unload();
            Loaded = false;
        });
    }
}

return function() { return {
    start: Start,
    stop: Stop
}};

})();

module.exports = SimpleDiscordCryptLoader;

/*@end @*/

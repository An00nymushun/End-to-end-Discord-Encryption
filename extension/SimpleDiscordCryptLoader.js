let script = document.createElement('script');
script.textContent = `window.localStorageBackup = window.localStorage`;
(document.head||document.documentElement).appendChild(script);
script.remove();


const makeRequest = (data, responseCallback) => {
	try {
		chrome.runtime.sendMessage(data, (result) => {
			if(result.bloburl !== undefined) {
				fetch(result.bloburl).then((response) => response.arrayBuffer()).then((response) => {
					responseCallback({ response });
					URL.revokeObjectURL(result.bloburl);
				});
			}
			else responseCallback(result);
		});
	} catch { location.reload() } //extension unloaded/reloaded
};

window.addEventListener('message', (event) => {
	if(event.source !== window && event.data.type !== 'XMLHttpRequest' || event.ports[0] == null) return;
	
	makeRequest(event.data, (result) => { event.ports[0].postMessage(result) });
});

chrome.runtime.sendMessage({ type: 'XMLHttpRequest', request: { url: "https://gitlab.com/An0/SimpleDiscordCrypt/raw/master/SimpleDiscordCrypt.user.js" } }, (result) => { //or chrome.runtime.getURL("SimpleDiscordCrypt.user.js")
	let script = document.createElement('script');
	script.textContent = `
(()=>{
const GM_xmlhttpRequest = (requestObject) => {
	let onload = requestObject.onload;
	let onerror = requestObject.onerror;
	delete requestObject.onload;
	delete requestObject.onerror;
	let channel = new MessageChannel();
	channel.port1.onmessage = (event) => {
		let response = event.data;
		if(response == null) {
			if(onerror) onerror();
		}
		else onload(event.data);
	}
	window.postMessage({ type: 'XMLHttpRequest', request: requestObject }, "*", [channel.port2]);
};
const localStorage = window.localStorageBackup;
const CspDisarmed = true;
${result.response}})()`;
	(document.head||document.documentElement).appendChild(script);
	script.remove();
});
let script = document.createElement('script');
script.textContent = `window.localStorageBackup = window.localStorage`;
(document.head||document.documentElement).appendChild(script);
script.remove();

window.addEventListener('message', (event) => {
	if (event.source !== window && event.data.type !== 'XMLHttpRequest' || event.ports[0] == null) return;
	
	let data = event.data.request;
	
	let xhr = new XMLHttpRequest();
	if(data.responseType) xhr.responseType = data.responseType;
	
	xhr.onload = () => event.ports[0].postMessage({	response: xhr.response });
	xhr.onerror = () => event.ports[0].postMessage(null);
	
	xhr.open(data.method || 'GET', data.url);
	xhr.withCredentials = true;
	xhr.send();
});

fetch("https://gitlab.com/An0/SimpleDiscordCrypt/raw/master/SimpleDiscordCrypt.user.js").then((response) => response.text()).then((code) => {
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
${code}})()`;
	(document.head||document.documentElement).appendChild(script);
	script.remove();
});
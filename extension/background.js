const onHeadersReceived = (details) => {
	let header = details.responseHeaders.find(x => x.name.toLowerCase() === 'content-security-policy');
	if(header != null) {
		header.value = "";
		return { responseHeaders: details.responseHeaders };
	}
};

const filter = {
	urls: ["https://discord.com/*","https://ptb.discord.com/*","https://canary.discord.com/*"],
	types: ["main_frame"]
};

chrome.webRequest.onHeadersReceived.addListener(onHeadersReceived, filter, ["blocking", "responseHeaders"]);

chrome.runtime.onMessage.addListener((data, sender, sendResponse) => {
	if(data.type !== 'XMLHttpRequest') return;
	
	let request = data.request;
	
	let xhr = new XMLHttpRequest();
	if(request.responseType) xhr.responseType = request.responseType;
	
	xhr.onload = () => { sendResponse((xhr.responseType === 'arraybuffer') ? { bloburl: URL.createObjectURL(new Blob([xhr.response])) } : { response: xhr.response }) };
	xhr.onerror = () => { sendResponse(null) };
	
	xhr.open(request.method || 'GET', request.url);
	xhr.withCredentials = true;
	xhr.send();
	
	return true;
});
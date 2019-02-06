const onHeadersReceived = (details) => {
	let header = details.responseHeaders.find(x => x.name.toLowerCase() === 'content-security-policy');
	if(header != null) {
		header.value = "";
		return { responseHeaders: details.responseHeaders };
	}
};

const filter = {
  urls: ["https://discordapp.com/*","https://ptb.discordapp.com/*","https://canary.discordapp.com/*"],
  types: ["main_frame"]
};

chrome.webRequest.onHeadersReceived.addListener(onHeadersReceived, filter, ["blocking", "responseHeaders"]);
$ErrorActionPreference = 'Stop'


$startMenuPath = $env:APPDATA+'\Microsoft\Windows\Start Menu\Programs\Discord Inc\'
$discordPath = $env:LOCALAPPDATA+'\Discord'
$discordDataPath = $env:APPDATA+'\discord'
$discordResourcesPath = $discordPath+'\app-*'
$discordIconPath = $startMenuPath+'Discord.lnk'
$discordExeName = 'Discord.exe'
$discordPtbPath = $env:LOCALAPPDATA+'\DiscordPTB'
$discordPtbDataPath = $env:APPDATA+'\discordptb'
$discordPtbResourcesPath = $discordPtbPath+'\app-*'
$discordPtbIconPath = $startMenuPath+'Discord PTB.lnk'
$discordPtbExeName = 'DiscordPTB.exe'
$discordCanaryPath = $env:LOCALAPPDATA+'\DiscordCanary'
$discordCanaryDataPath = $env:APPDATA+'\discordcanary'
$discordCanaryResourcesPath = $discordCanaryPath+'\app-*'
$discordCanaryIconPath = $startMenuPath+'Discord Canary.lnk'
$discordCanaryExeName = 'DiscordCanary.exe'
$pluginPath = $env:LOCALAPPDATA+'\SimpleDiscordCrypt'
$startupRegistry = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run'


function RootElectrons([string]$discordResourcesPath, [string]$exeName) {
	foreach($path in (Resolve-Path $discordResourcesPath)) {
		'rooting'
		$electonAsarPath = "$path\resources\electron.asar"
		if(Test-Path $electonAsarPath) { RootElectron $electonAsarPath }
		else { RootPackedElectron "$path\$exeName" }
	}
}

$binaryEncoding = [Text.Encoding]::GetEncoding('iso-8859-1')
function RootElectron([string]$electonAsarPath) {
	$electronAsar = [IO.File]::ReadAllText($electonAsarPath, $binaryEncoding)

	$electronAsar = (New-Object Regex('^(?:\s*\/\/.*\r?\n\s*|\s*)?(exports\.injectTo)\s*?(=)\s*?(function\s*\(.*context.*\)|\(.*context.*\)\s*=>)\s*({)(?=\r?\n)', [Text.RegularExpressions.RegexOptions]::MultiLine)).Replace($electronAsar, {param($m)
		$s = ''
		for($i = 1; $i -lt $m.Groups.Count; $i++) { $s += $m.Groups[$i] }
		$s += 'context.chrome={require};'
		return $s.PadRight($m.Length)
	}, 1)


	[IO.File]::WriteAllText($electonAsarPath, $electronAsar, $binaryEncoding)
}
function BuildPackedElectronRegex {
	function widen($s) { $s.ToCharArray() -join "`0" }
    $o = @{}
	$backgroundPageParts = @("type: 'backgroundPage',"  ,
							 "sandbox: true,"           ,
							 "enableRemoteModule: false")
	$backgroundPageRegex = ($backgroundPageParts | % { [Regex]::Escape((widen $_)) }) -join '\0[\s\0]*'
    $o.backgroundPageReplacement = widen "type: 'backgroundPage', sandbox: false, enableRemoteModule: true"
    $contentStriptRegex = 'const chromeAPI = __webpack_require__\([^\n]*"\.\/lib\/renderer\/chrome-api\.ts"\);?\s*chromeAPI\.injectTo\(extensionId\, window\)'
    $o.contentScriptReplacement = 'const chromeAPI=__webpack_require__("./lib/renderer/chrome-api.ts");window.root=isolatedWorld;chromeAPI.injectTo(extensionId,window)'
    $nodeIntegrationRegex = "hasSwitch\('node-integration'\)"
    $o.nodeIntegrationReplacement = '            true             '
    $o.regex = New-Object Regex "(?:($backgroundPageRegex)|($contentStriptRegex)|($nodeIntegrationRegex))", ([Text.RegularExpressions.RegexOptions]::Compiled)
    return $o
}
$packedElectronRegex = BuildPackedElectronRegex
function RootPackedElectron([string]$exePath) {
	$exeContents = [IO.File]::ReadAllText($exePath, $binaryEncoding)

	$exeContents = $packedElectronRegex.regex.Replace($exeContents, {param($m)
        if($m.Groups[1].Success) {
            $s = $packedElectronRegex.backgroundPageReplacement
            $s + "`0 " * (($m.Length-$s.Length)/2)
        }
        elseif($m.Groups[2].Success) {
            $packedElectronRegex.contentScriptReplacement.PadRight($m.Length)
        }
        else {
            $packedElectronRegex.nodeIntegrationReplacement
        }
	})

	[IO.File]::WriteAllText($exePath, $exeContents, $binaryEncoding)
}

function AddExtension([string]$electonDataPath) {
	'adding extension'
	$extensionListPath = "$electonDataPath\DevTools Extensions"
	if(Test-Path $extensionListPath) {
		[string]$s = Get-Content $extensionListPath
		if($s.Length -ne 0) {
			$extensionList = ConvertFrom-Json $s
			$extensionList = @($extensionList | ? { $_ -notmatch '(?:^|[\\\/])SimpleDiscordcrypt[\\\/]?$' })
			if($extensionList.Length -ne 0) {
				$extensionList += '../../SimpleDiscordCrypt'
				Set-Content $extensionListPath (ConvertTo-Json $extensionList)
				return
			}
		}
	}
	Set-Content $extensionListPath '["../../SimpleDiscordCrypt"]'
}

function StopProcesses([string]$name, [string]$root) {
	$targets = Get-Process | ? { $_.Name -eq $name -or ($_.Path -and $_.Path.StartsWith($root)) }
	if($targets.Length -eq 0) { return }
	try {
		$targets | Stop-Process
	} catch { "PLEASE CLOSE $name!" }
	"waiting for $name to close"
	do {
		sleep 1
		$targets = Get-Process | ? { $_.Name -eq $name -or ($_.Path -and $_.Path.StartsWith($root)) }
	} while($targets.Length -gt 0)
}

function ReplaceStartup([string]$registryKey, [string]$newPath) {
	if((Get-ItemProperty -Path $startupRegistry -Name $registryKey -ErrorAction SilentlyContinue).$registryKey -ne $null) {
		'replacing startup'
		Set-ItemProperty -Path $startupRegistry -Name $registryKey -Value $newPath
	}
}


$install = $false

try {

if(Test-Path $discordPath) {
	'Discord found'
	if(Test-Path $discordDataPath) { 'data directory found' } else { 'data directory not found'; return }
	if(Test-Path $discordResourcesPath) { 'resources directory found' } else { 'resources directory not found'; return }
	
	StopProcesses 'Discord' $discordPath
	
	RootElectrons $discordResourcesPath $discordExeName

	AddExtension $discordDataPath

	ReplaceStartup 'Discord' $discordIconPath
	
	$install = $true
}

if(Test-Path $discordPtbPath) {
	'DiscordPTB found'
	if(Test-Path $discordPtbDataPath) { 'data directory found' } else { 'data directory not found'; return }
	if(Test-Path $discordPtbResourcesPath) { 'resources directory found' } else { 'resources directory not found'; return }
	
	StopProcesses 'DiscordPTB' $discordPtbPath
	
	RootElectrons $discordPtbResourcesPath $discordPtbExeName

	AddExtension $discordPtbDataPath
	
	ReplaceStartup 'DiscordPTB' $discordPtbIconPath

	$install = $true
}

if(Test-Path $discordCanaryPath) {
	'DiscordCanary found'
	if(Test-Path $discordCanaryDataPath) { 'data directory found' } else { 'data directory not found'; return }
	if(Test-Path $discordCanaryResourcesPath) { 'resources directory found' } else { 'resources directory not found'; return }
	
	StopProcesses 'DiscordCanary' $discordCanaryPath
	
	RootElectrons $discordCanaryResourcesPath $discordCanaryExeName

	AddExtension $discordCanaryDataPath
	
	ReplaceStartup 'DiscordCanary' $discordCanaryIconPath

	$install = $true
}


if($install) {
	'installing'

	[void](New-Item "$pluginPath\manifest.json" -Type File -Force -Value @'
{
	"name": "SimpleDiscordCrypt",
	"background": {
	  "page": "background.html"
	},
	"content_scripts": [ {
		"js": [ "SimpleDiscordCryptLoader.js" ],
		"matches": [
			"https://discordapp.com/channels/*",
			"https://discordapp.com/activity",
			"https://discordapp.com/login",
			"https://discordapp.com/app",
			"https://discordapp.com/library",
			"https://discordapp.com/store",
			"https://ptb.discordapp.com/channels/*",
			"https://ptb.discordapp.com/activity",
			"https://ptb.discordapp.com/login",
			"https://ptb.discordapp.com/app",
			"https://ptb.discordapp.com/library",
			"https://ptb.discordapp.com/store",
			"https://canary.discordapp.com/channels/*",
			"https://canary.discordapp.com/activity",
			"https://canary.discordapp.com/login",
			"https://canary.discordapp.com/app",
			"https://canary.discordapp.com/library",
			"https://canary.discordapp.com/store"
		],
		"run_at": "document_start"
	} ]
}
'@)
	
	[void](New-Item "$pluginPath\background.html" -Type File -Force -Value @'
<script>
const require = window.require || chrome.require;

const onHeadersReceived = (details, callback) => {
	let response = { cancel: false };
	let responseHeaders = details.responseHeaders;
	if(responseHeaders['content-security-policy']) {
		responseHeaders['content-security-policy'] = [""];
		response.responseHeaders = responseHeaders;
	}
	callback(response);
};

require('electron').remote.session.defaultSession.webRequest.onHeadersReceived(onHeadersReceived);


let script;
let scriptCallbacks = [];
require('https').get("https://gitlab.com/An0/SimpleDiscordCrypt/raw/master/SimpleDiscordCrypt.user.js", (response) => {
	let data = "";
	response.on('data', (chunk) => data += chunk);
	response.on('end', () => {
		script = data;
		for(let callback of scriptCallbacks) callback(data);
		scriptCallbacks = [];
	});
});

chrome.runtime.onMessage.addListener((data, sender, sendResponse) => {
	if(data.type !== 'SimpleDiscordCrypt') return;
	
	if(script != null) {
		sendResponse(script);
		return;
	}
	else {
		scriptCallbacks.push(sendResponse);
	}
	
	return true;
});
</script>
'@)

	[void](New-Item "$pluginPath\SimpleDiscordCryptLoader.js" -Type File -Force -Value @'
let rooted = false;

if(chrome.require != null) {
	const require = chrome.require;

	if(require != null) {
		const localStorage = window.localStorage;
		delete chrome.storage;
		const CspDisarmed = true;

		require('https').get("https://gitlab.com/An0/SimpleDiscordCrypt/raw/master/SimpleDiscordCrypt.user.js", (response) => {
			let data = "";
			response.on('data', (chunk) => data += chunk);
			response.on('end', () => eval(data));
		});
		//chrome.runtime.sendMessage({ type: 'SimpleDiscordCrypt' }, (script) => eval(script)); //doesn't seem to work on older electron
		rooted = true;
	}

}
else if(window.root != null && root.require != null) {
	let script = document.createElement('script');
	script.textContent = `window.localStorageBackup = window.localStorage`;
	(document.head||document.documentElement).appendChild(script);
	script.remove();

	chrome.runtime.sendMessage({ type: 'SimpleDiscordCrypt' }, (scriptStr) => {
		let script = document.createElement('script');
		script.textContent = `
(()=>{
const localStorage = window.localStorageBackup;
const CspDisarmed = true;
const require = root.require;
${scriptStr}})()`;
		(document.head||document.documentElement).appendChild(script);
		script.remove();
	});
	rooted = true;
}

if(!rooted) console.log("Uh-oh, looks like this version of electron isn't rooted yet");
'@)

	'FINISHED'
}
else { 'Discord not found' }

}
catch { $_ }
finally { [Console]::ReadLine() }

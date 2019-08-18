$ErrorActionPreference = 'Stop'


$startMenuPath = [Environment]::GetFolderPath('StartMenu')+'\Programs\Discord Inc\'
$desktopPath = [Environment]::GetFolderPath('Desktop')+'\'
$discordPath = $env:LOCALAPPDATA+'\Discord'
$discordDataPath = $env:APPDATA+'\discord'
$discordResourcesPath = $discordPath+'\app-*'
$discordIconPath = $startMenuPath+'Discord.lnk'
$discordDesktopIconPath = $desktopPath+'Discord.lnk'
$discordExeName = 'Discord.exe'
$discordPtbPath = $env:LOCALAPPDATA+'\DiscordPTB'
$discordPtbDataPath = $env:APPDATA+'\discordptb'
$discordPtbResourcesPath = $discordPtbPath+'\app-*'
$discordPtbIconPath = $startMenuPath+'Discord PTB.lnk'
$discordPtbDesktopIconPath = $desktopPath+'Discord PTB.lnk'
$discordPtbExeName = 'DiscordPTB.exe'
$discordCanaryPath = $env:LOCALAPPDATA+'\DiscordCanary'
$discordCanaryDataPath = $env:APPDATA+'\discordcanary'
$discordCanaryResourcesPath = $discordCanaryPath+'\app-*'
$discordCanaryIconPath = $startMenuPath+'Discord Canary.lnk'
$discordCanaryDesktopIconPath = $desktopPath+'Discord Canary.lnk'
$discordCanaryExeName = 'DiscordCanary.exe'
$iconLocation = '\app.ico,0'
$pluginPath = $env:LOCALAPPDATA+'\SimpleDiscordCrypt'
$startupRegistry = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run'


$shell = New-Object -ComObject WScript.Shell
function RootElectron([string]$discordIconPath, [string]$exeName, [string]$path, [string]$resourcesPath, [string]$desktopIconPath) {
	'rooting'
	$shortcut = $shell.CreateShortcut($discordIconPath)
	if($shortcut.WorkingDirectory -eq "") {
		$shortcut.WorkingDirectory = (Resolve-Path $resourcesPath | % { $_.Path } | Measure -Maximum).Maximum
		$shortcut.IconLocation = $path + $iconLocation
	}
	$shortcut.TargetPath = $env:WINDIR+'\System32\cmd.exe'
	$shortcut.Arguments = "/c `"set NODE_OPTIONS=-r ../../SimpleDiscordCrypt/NodeLoad.js && start ^`"^`" ^`"$path\Update.exe^`" --processStart $exeName`""
	$shortcut.WindowStyle = 7
	$shortcut.Save()

	if(Test-Path $desktopIconPath) {
		copy $discordIconPath $desktopIconPath -Force
	}
}

function RemoveExtension([string]$electonDataPath) {
	$extensionListPath = "$electonDataPath\DevTools Extensions"
	if(Test-Path $extensionListPath) {
		[string]$s = Get-Content $extensionListPath
		if($s.Length -ne 0) {
			$extensionList = ConvertFrom-Json $s
			$newExtensionList = @($extensionList | ? { $_ -notmatch '(?:^|[\\\/])SimpleDiscordcrypt[\\\/]?$' })
			if($newExtensionList.Length -ne $extensionList.Length) {
				'removing old extension'
				Set-Content $extensionListPath (ConvertTo-Json $newExtensionList)
			}
		}
	}
}

function ReplaceStartup([string]$registryKey, [string]$newPath) {
	if((Get-ItemProperty -Path $startupRegistry -Name $registryKey -ErrorAction SilentlyContinue).$registryKey -ne $null) {
		'replacing startup'
		Set-ItemProperty -Path $startupRegistry -Name $registryKey -Value $newPath
	}
}


$install = $false

try {

while(Test-Path $discordPath) {
	'Discord found'
	if(Test-Path $discordDataPath) { 'data directory found' } else { 'data directory not found'; break }
	if(Test-Path $discordResourcesPath) { 'resources directory found' } else { 'resources directory not found'; break }

	RemoveExtension $discordDataPath

	RootElectron $discordIconPath $discordExeName $discordPath $discordResourcesPath $discordDesktopIconPath

	ReplaceStartup 'Discord' $discordIconPath
	
	$install = $true
	break
}

while(Test-Path $discordPtbPath) {
	'DiscordPTB found'
	if(Test-Path $discordPtbDataPath) { 'data directory found' } else { 'data directory not found'; break }
	if(Test-Path $discordPtbResourcesPath) { 'resources directory found' } else { 'resources directory not found'; break }

	RemoveExtension $discordPtbDataPath

	RootElectron $discordPtbIconPath $discordPtbExeName $discordPtbPath $discordPtbResourcesPath $discordPtbDesktopIconPath
	
	ReplaceStartup 'DiscordPTB' $discordPtbIconPath

	$install = $true
	break
}

while(Test-Path $discordCanaryPath) {
	'DiscordCanary found'
	if(Test-Path $discordCanaryDataPath) { 'data directory found' } else { 'data directory not found'; break }
	if(Test-Path $discordCanaryResourcesPath) { 'resources directory found' } else { 'resources directory not found'; break }

	RemoveExtension $discordCanaryDataPath

	RootElectron $discordCanaryIconPath $discordCanaryExeName $discordCanaryPath $discordCanaryResourcesPath $discordCanaryDesktopIconPath
	
	ReplaceStartup 'DiscordCanary' $discordCanaryIconPath

	$install = $true
	break
}


if($install) {
	'installing'
	
	[void](New-Item "$pluginPath\NodeLoad.js" -Type File -Force -Value @'
const originalRequire = module.__proto__.require;
let electron;

const onHeadersReceived = (details, callback) => {
	let response = { cancel: false };
	let responseHeaders = details.responseHeaders;
	if(responseHeaders['content-security-policy'] != null) {
		responseHeaders['content-security-policy'] = [""];
		response.responseHeaders = responseHeaders;
	}
	callback(response);
};

let orginalBrowserWindow;
function browserWindowHook(options) {
	if(options != null && options.webPreferences != null &&
	   options.webPreferences.preload != null && options.webPreferences.preload.endsWith("mainScreenPreload.js")) {
		let webPreferences = options.webPreferences;
		let originalPreload = webPreferences.preload;
		//webPreferences.nodeIntegration = true;
		//webPreferences.enableRemoteModule = true;
		webPreferences.preload = `${__dirname}/SimpleDiscordCryptLoader.js`;
		let mainWindow = new orginalBrowserWindow(options);
		mainWindow.PreloadScript = originalPreload;
		return mainWindow;
	}
	return new orginalBrowserWindow(options);
}

module.__proto__.require = function(name) {
	let result = originalRequire.apply(this, arguments);
	
	if(name === '@electron/internal/browser/api/browser-window.js') {
		module.__proto__.require = originalRequire;
		electron = require('electron');
		orginalBrowserWindow = electron.BrowserWindow;
		Object.assign(browserWindowHook, orginalBrowserWindow);
		browserWindowHook.prototype = orginalBrowserWindow;
		result = browserWindowHook;
		electron.app.once('ready', () => { electron.session.defaultSession.webRequest.onHeadersReceived(onHeadersReceived) });
	}

	return result;
};
'@)

	[void](New-Item "$pluginPath\SimpleDiscordCryptLoader.js" -Type File -Force -Value @'
let requireGrab = require;
if(requireGrab == null && window.chrome != null) requireGrab = chrome.require; 

if(requireGrab != null) {
	const require = requireGrab;

	if(window.chrome != null && chrome.storage != null) delete chrome.storage;
	
	const localStorage = window.localStorage;
	const CspDisarmed = true;

	require('https').get("https://gitlab.com/An0/SimpleDiscordCrypt/raw/master/SimpleDiscordCrypt.user.js", (response) => {
		let data = "";
		response.on('data', (chunk) => data += chunk);
		response.on('end', () => eval(data));
	});
	
	const remote = require('electron').remote;
	if(remote != null) {
		let currentWindow = remote.getCurrentWindow();
		if(currentWindow.PreloadScript != null) require(currentWindow.PreloadScript);
	}
	/*if(typeof process !== 'undefined')
		process.once('loaded', () => { delete window.require; delete window.module; });*/
}
else console.log("Uh-oh, looks like this version of electron isn't rooted yet");
'@)

	'FINISHED'
}
else { 'Discord not found' }

}
catch { $_ }
finally { [Console]::ReadLine() }

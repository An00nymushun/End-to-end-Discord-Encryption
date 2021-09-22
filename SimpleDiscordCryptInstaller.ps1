$ErrorActionPreference = 'Stop'


$startMenuPath = [Environment]::GetFolderPath('StartMenu')+'\Programs\Discord Inc\'
$desktopPath = [Environment]::GetFolderPath('Desktop')+'\'
$taskbarPath = $env:APPDATA+'\Microsoft\Internet Explorer\Quick Launch\User Pinned\TaskBar\'
$discordPath = $env:LOCALAPPDATA+'\Discord'
$discordDataPath = $env:APPDATA+'\discord'
$discordResourcesPath = $discordPath+'\app-*'
$discordIconPath = $startMenuPath+'Discord.lnk'
$discordDesktopIconPath = $desktopPath+'Discord.lnk'
$discordTaskbarIconPath = $taskbarPath+'Discord.lnk'
$discordExeName = 'Discord.exe'
$discordPtbPath = $env:LOCALAPPDATA+'\DiscordPTB'
$discordPtbDataPath = $env:APPDATA+'\discordptb'
$discordPtbResourcesPath = $discordPtbPath+'\app-*'
$discordPtbIconPath = $startMenuPath+'Discord PTB.lnk'
$discordPtbDesktopIconPath = $desktopPath+'Discord PTB.lnk'
$discordPtbTaskbarIconPath = $taskbarPath+'Discord PTB.lnk'
$discordPtbExeName = 'DiscordPTB.exe'
$discordCanaryPath = $env:LOCALAPPDATA+'\DiscordCanary'
$discordCanaryDataPath = $env:APPDATA+'\discordcanary'
$discordCanaryResourcesPath = $discordCanaryPath+'\app-*'
$discordCanaryIconPath = $startMenuPath+'Discord Canary.lnk'
$discordCanaryDesktopIconPath = $desktopPath+'Discord Canary.lnk'
$discordCanaryTaskbarIconPath = $taskbarPath+'Discord Canary.lnk'
$discordCanaryExeName = 'DiscordCanary.exe'
$iconLocation = '\app.ico,0'
$pluginPath = $env:LOCALAPPDATA+'\SimpleDiscordCrypt'
$startupRegistry = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run'


$shell = New-Object -ComObject WScript.Shell
function RootElectron([string]$discordIconPath, [string]$exeName, [string]$path, [string]$resourcesPath, [string]$desktopIconPath, [string]$taskbarIconPath) {
	'rooting'
	$shortcut = $shell.CreateShortcut($discordIconPath)
	$workingDirectory = $shortcut.WorkingDirectory
	if($workingDirectory -eq "") {
		$shortcut.WorkingDirectory = $workingDirectory = (Resolve-Path $resourcesPath | % { $_.Path } | Measure -Maximum).Maximum
		$shortcut.IconLocation = $path + $iconLocation
	}
	
	$electronLink = "$workingDirectory\electron.exe"
	if(!(Test-Path $electronLink)) {
		[void](New-Item -Path $electronLink -Value "$workingDirectory\$exeName" -ItemType HardLink)
	}
	
	$shortcut.TargetPath = $env:WINDIR+'\System32\cmd.exe'
	$shortcut.Arguments = "/c `"set NODE_OPTIONS=-r ../../SimpleDiscordCrypt/NodeLoad.js && start ^`"^`" ^`"$path\Update.exe^`" --processStart electron.exe`""
	$shortcut.WindowStyle = 7
	$shortcut.Save()

	if(Test-Path $desktopIconPath) {
		copy $discordIconPath $desktopIconPath -Force
	}
	if(Test-Path $taskbarIconPath) {
		copy $discordIconPath $taskbarIconPath -Force
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

	RootElectron $discordIconPath $discordExeName $discordPath $discordResourcesPath $discordDesktopIconPath $discordTaskbarIconPath

	ReplaceStartup 'Discord' $discordIconPath
	
	$install = $true
	break
}

while(Test-Path $discordPtbPath) {
	'DiscordPTB found'
	if(Test-Path $discordPtbDataPath) { 'data directory found' } else { 'data directory not found'; break }
	if(Test-Path $discordPtbResourcesPath) { 'resources directory found' } else { 'resources directory not found'; break }

	RemoveExtension $discordPtbDataPath

	RootElectron $discordPtbIconPath $discordPtbExeName $discordPtbPath $discordPtbResourcesPath $discordPtbDesktopIconPath $discordPtbTaskbarIconPath
	
	ReplaceStartup 'DiscordPTB' $discordPtbIconPath

	$install = $true
	break
}

while(Test-Path $discordCanaryPath) {
	'DiscordCanary found'
	if(Test-Path $discordCanaryDataPath) { 'data directory found' } else { 'data directory not found'; break }
	if(Test-Path $discordCanaryResourcesPath) { 'resources directory found' } else { 'resources directory not found'; break }

	RemoveExtension $discordCanaryDataPath

	RootElectron $discordCanaryIconPath $discordCanaryExeName $discordCanaryPath $discordCanaryResourcesPath $discordCanaryDesktopIconPath $discordCanaryTaskbarIconPath
	
	ReplaceStartup 'DiscordCanary' $discordCanaryIconPath

	$install = $true
	break
}


if($install) {
	'installing'
	
	[void](New-Item "$pluginPath\NodeLoad.js" -Type File -Force -Value @'
const onHeadersReceived = (details, callback) => {
	let response = { cancel: false };
	let responseHeaders = details.responseHeaders;
	if(responseHeaders['content-security-policy'] != null) {
		responseHeaders['content-security-policy'] = [""];
		response.responseHeaders = responseHeaders;
	}
	callback(response);
};

let originalBrowserWindow;
function browserWindowHook(options) {
	if(options?.webPreferences?.preload != null && options.title?.startsWith("Discord")) {
		let webPreferences = options.webPreferences;
		let originalPreload = webPreferences.preload;
		webPreferences.preload = `${__dirname}/SimpleDiscordCryptLoader.js`;
		webPreferences.additionalArguments = [...(webPreferences.additionalArguments || []), `--sdc-preload=${originalPreload}`];
	}
	return new originalBrowserWindow(options);
}
browserWindowHook.ISHOOK = true;


let originalElectronBinding;
function electronBindingHook(name) {
	let result = originalElectronBinding.apply(this, arguments);

	if(name === 'electron_browser_window' && !result.BrowserWindow.ISHOOK) {
		originalBrowserWindow = result.BrowserWindow;
		Object.assign(browserWindowHook, originalBrowserWindow);
		browserWindowHook.prototype = originalBrowserWindow.prototype;
		result.BrowserWindow = browserWindowHook;
		const electron = require('electron');
		electron.app.whenReady().then(() => { electron.session.defaultSession.webRequest.onHeadersReceived(onHeadersReceived) });
	}
	
	return result;
}
electronBindingHook.ISHOOK = true;

originalElectronBinding = process._linkedBinding;
if(originalElectronBinding.ISHOOK) return;
Object.assign(electronBindingHook, originalElectronBinding);
electronBindingHook.prototype = originalElectronBinding.prototype;
process._linkedBinding = electronBindingHook;
'@)

	[void](New-Item "$pluginPath\SimpleDiscordCryptLoader.js" -Type File -Force -Value @'
let requireGrab = require;
if(requireGrab != null) {
	const require = requireGrab;

	if(window.chrome?.storage) delete chrome.storage;

	const localStorage = window.localStorage;
	const CspDisarmed = true;

	const electron = require('electron');

	require('https').get("https://gitlab.com/An0/SimpleDiscordCrypt/-/raw/master/SimpleDiscordCrypt.user.js", (response) => {
		response.setEncoding('utf8');
		let code = "";
		response.on('data', (chunk) => code += chunk);
		response.on('end', () => {
			const unsafeWindow = electron.webFrame.top.context;
			eval(code);
		});
	});

	const commandLineSwitches = process._linkedBinding('electron_common_command_line');
	let originalPreloadScript = commandLineSwitches.getSwitchValue('sdc-preload');

	if(originalPreloadScript != null) {
		commandLineSwitches.appendSwitch('preload', originalPreloadScript);
		require(originalPreloadScript);
	}
}
else console.error("Uh-oh, looks like something is blocking require");
'@)

	'FINISHED'

    $needsWait = $false
    $discordProcesses = Get-Process 'Discord' -ErrorAction SilentlyContinue
    $discordProcesses | % { $needsWait = $_.CloseMainWindow() -or $needsWait }

    $discordPtbProcesses = Get-Process 'DiscordPTB' -ErrorAction SilentlyContinue
    $discordPtbProcesses | % { $needsWait = $_.CloseMainWindow() -or $needsWait }

    $discordCanaryProcesses = Get-Process 'DiscordCanary' -ErrorAction SilentlyContinue
    $discordCanaryProcesses | % { $needsWait = $_.CloseMainWindow() -or $needsWait }

    if($needsWait) { sleep 1 }

    $processes = ($discordProcesses + $discordPtbProcesses + $discordCanaryProcesses)
    if($processes.Length -ne 0) {
        $processes | Stop-Process
        if($discordProcesses.Length -ne 0) { [void](start $discordIconPath)  }
        if($discordPtbProcesses.Length -ne 0) { [void](start $discordPtbIconPath)  }
        if($discordCanaryProcesses.Length -ne 0) { [void](start $discordCanaryIconPath)  }
    }
}
else { 'Discord not found' }

}
catch { $_ }
finally { [Console]::ReadLine() }

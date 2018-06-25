

function RootElectron([string]$electonAsarPath) {
	'rooting'
	$electronAsar = [IO.File]::ReadAllText($electonAsarPath)

	$electronAsar = (New-Object Regex('^(?:\s*\/\/.*\r?\n\s*|\s*)?(exports\.injectTo)\s*?(=)\s*?((?:function)\s*\(.*context.*\)|\(.*context.*\)\s*=>)\s*({)$', [Text.RegularExpressions.RegexOptions]::MultiLine)).Replace($electronAsar, {param($m)
		$s = ''
		for($i = 1; $i -lt $m.Groups.Count; $i++) { $s += $m.Groups[$i] }
		$s += 'context.chrome={require};'
		return $s.PadRight($m.Length)
	}, 1)


	[IO.File]::WriteAllText($electonAsarPath, $electronAsar)
}

function AddExtension([string]$electonDataPath) {
	'adding extension'
	$extensionListPath = "$electonDataPath\DevTools Extensions"
	if(Test-Path $extensionListPath) {
		$extensionList = ConvertFrom-Json (Get-Content $extensionListPath)
		$extensionList = $extensionList | ? { $_ -notmatch '(?:^|[\\\/])SimpleDiscordcrypt[\\\/]?$' }
		if($extensionList.Length -ne 0) {
			$extensionList += '../../SimpleDiscordCrypt'
			Set-Content $extensionListPath (ConvertTo-Json $extensionList)
			return
		}
	}
	Set-Content $extensionListPath '["../../SimpleDiscordCrypt"]'
}

$discordPath = $env:LOCALAPPDATA+'\Discord'
$discordDataPath = $env:APPDATA+'\discord'
$discordResourcesPath = $discordPath+'\app-*\resources'
$discordPtbPath = $env:LOCALAPPDATA+'\DiscordPTB'
$discordPtbDataPath = $env:APPDATA+'\discordptb'
$discordPtbResourcesPath = $discordPtbPath+'\app-*\resources'
$discordCanaryPath = $env:LOCALAPPDATA+'\DiscordCanary'
$discordCanaryDataPath = $env:APPDATA+'\discordcanary'
$discordCanaryResourcesPath = $discordCanaryPath+'\app-*\resources'
$sdcPath = $env:LOCALAPPDATA+'\SimpleDiscordCrypt'


$install = $false

try {

if(Test-Path $discordPath) {
	'Discord found'
	if(Test-Path $discordDataPath) { 'data directory found' } else { 'data directory not found'; return }
	if(Test-Path $discordResourcesPath) { 'resources directory found' } else { 'resources directory not found'; return }
	
	RootElectron(Resolve-Path "$discordResourcesPath\electron.asar")

	AddExtension($discordDataPath)

	$install = $true
}

if(Test-Path $discordPtbPath) {
	'DiscordPTB found'
	if(Test-Path $discordPtbDataPath) { 'data directory found' } else { 'data directory not found'; return }
	if(Test-Path $discordPtbResourcesPath) { 'resources directory found' } else { 'resources directory not found'; return }
	
	RootElectron(Resolve-Path "$discordPtbResourcesPath\electron.asar")

	AddExtension($discordPtbDataPath)

	$install = $true
}

if(Test-Path $discordCanaryPath) {
	'DiscordCanary found'
	if(Test-Path $discordCanaryDataPath) { 'data directory found' } else { 'data directory not found'; return }
	if(Test-Path $discordCanaryResourcesPath) { 'resources directory found' } else { 'resources directory not found'; return }
	
	RootElectron(Resolve-Path "$discordCanaryResourcesPath\electron.asar")

	AddExtension($discordCanaryDataPath)

	$install = $true
}


if($install) {
	'installing'

	[void](New-Item "$sdcPath\manifest.json" -Type File -Force -Value @'
{
	"name": "SimpleDiscordCrypt",
	"content_scripts": [ {
		"js": [ "SimpleDiscordCryptLoader.js" ],
		"matches": [ "*" ],
		"run_at": "document_start"
	} ]
}
'@)

	[void](New-Item "$sdcPath\SimpleDiscordCryptLoader.js" -Type File -Force -Value @'
const localStorage = window.localStorage;
const require = chrome.require;
delete chrome.storage; //fake API

if(require == null) {
	alert("Uh-oh, looks like this version of electron isn't rooted yet");
	return;
}

require('https').get("https://gitlab.com/An0/SimpleDiscordCrypt/raw/master/SimpleDiscordCrypt.user.js", (response) => {
	let data = "";
	response.on('data', (chunk) => data += chunk);
	response.on('end', () => eval(data));
});
'@)

	'FINISHED'
}
else { 'Discord not found' }

}
catch { $_ }
finally { [Console]::ReadLine() }
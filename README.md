<h1 align="center">
    <img src="https://gitlab.com/An0/SimpleDiscordCrypt/-/avatar" height="50" width="50">
    SimpleDiscordCrypt
</h1>

Discord message encryption plugin, it gives end-to-end client side encryption for your messages and files with automatic key exchange, works without BetterDiscord<br>
<br>
For `Chrome` (and similar) use the [extension](https://chrome.google.com/webstore/detail/simplediscordcrypt/hbplgmpfdabobhnadbfpknppljdfkiia)<br>
If you have `Discord installed`, use the [installer](https://gitlab.com/An0/SimpleDiscordCrypt/raw/master/SimpleDiscordCryptInstaller.ps1) (Alt+click to download, right click on the downloaded file and Run with PowerShell)<br>
For `mobile` you should try Yandex Browser, it's Chromium based and supports extensions<br>
[`Firefox` is kind of supported](https://addons.mozilla.org/en-US/firefox/addon/simplediscordcrypt/) but there is incompatibility because of https://bugzilla.mozilla.org/show_bug.cgi?id=1048931<br>
If nothing works, install it as a [userscript](https://gitlab.com/An0/SimpleDiscordCrypt/raw/master/SimpleDiscordCrypt.user.js) (with [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)) or include the js file somehow else<br>
<br>
Please do not download this plugin from untrusted sources, for example there is one in chrome store with the same name<br>
<br>
<br>
**Right click on the lock icon** to open the menu<br>
<br>
If you would like to `download an encrypted image`, **middle click on the image**<br>
<br>
You can **toggle the encryption** with the `lock icon`. You can also use the `:ENC:`, `ENC` or `NOENC` prefix at the start of your message, but prefixes are deprecated since Discord starts uploads before you even send your message.<br>
<br>
If you want to **change** from one installation to another, `export and import` your database<br>
If you would like to use the plugin on **multiple devices**; choose a main one, export the database from that and click on `secondary` when **importing to others**, after new key exchanges you'll have to repeat these steps<br>
<br>
`ECDH P-521` is used for the key exchange and `AES256-CBC` for the messages offering the equivalent security of 256-bits<br>
<br>
I hope this is actually simple as the name suggests<br>
<br>
<br>
Here is a link to the original [DiscordCrypt](https://gitlab.com/leogx9r/DiscordCrypt)<br>
<sup>It has been discontinued</sup><br>
<br>
<br>
<br>
<br>
If you have any questions come to my [Discord server](https://discord.gg/rSUyXeCHBE)<br>
If you want a server blacklisted or you would like users to not use embeds, do tell<br>
We have experimental BetterDiscord loaders for the plugin too.<br>
<br>
List of servers that use the plugin:<br>
<br>
Feel free to tell me if you have one<br>
<br>
<br>
<br>
<br>
# Database
The `database password` is optional but the database isn't! **The database stores stuff like your keys and channel settings.**<br>
You should only have one database as having multiple will mess things up. In order to manage this, you should **keep backups** by `exporting` your database.<br>
If you are using **multiple devices** with the same account, **select one as the main** and **import** its database as `secondary` to the other(s).<br>
If you import the database as secondary you can still export it and import it normally again. The difference is that a client with the secondary setting will ignore key exchanges, which means you have to update your secondary devices with the new database.<br>
##### Cleaning the database <sub>You can paste these into the `Ctrl+Shift+I` console</sub>
<details><summary>SdcClearChannels(filterFunc)</summary>

```js
deleteBefore = (now = new Date()).setMonth(now.getMonth() - 6);
SdcClearChannels((channel) => (
    //Number(channel.lastseen) ms precision unix timestamp
    //String(channel.descriptor) descriptor from the channel manager
    //Boolean(channel.encrypted) is the encryption toggled on

    channel.lastseen < deleteBefore && //not seen in 6 months
    /^DM with \d{17,20}$/.test(channel.descriptor) //name resolution failed

    //'true' return value deletes the record
));
```
</details>
<details><summary>SdcClearKeys(filterFunc)</summary>

```js
deleteBefore = (now = new Date()).setMonth(now.getMonth() - 6);
SdcClearKeys((key) => (
    //Number(key.lastseen) ms precision unix timestamp
    //String(key.descriptor) descriptor from the key manager
    //Boolean(key.hidden) is the key hidden
    //String(key.type) one of ['GROUP', 'CONVERSATION'/*DM*/, 'PERSONAL']
    //Number(key.registered) when the key was added to the database

    key.lastseen < deleteBefore && //not seen in 6 months
    /^(?:DM key with \d{17,20}|\d{17,20}'s personal key)$/.test(key.descriptor)
    //name resolution failed if the id is used as name

    //'true' return value deletes the record
));
```
</details>

# Keys
The things you use to **encrypt messages** (plus there is the `database key` for encrypting the plugin's local database)<br>
You can `select` which key to use for the channel at the top, besides the lock icon.<br>
### Key Types
**Personal key:** Everyone has this (and it's different for everyone), you can use it to encrypt messages in channels **where there are no other options**.<br>
It is shared with everyone you key-exchange with, so the security of it varies.<br>
**Group key:** You can `make` these from the plugin's menu if you are in a guild channel.<br>
It is advised that you **change the name** of the key right away to spot if someone accidentally generated a different key for your channel. You can do this in the `Key Manager`.<br>
After **generating the group key**, you can use it in other channels too.<br>
If you set a group key as `hidden` in the `Key Manager` it will **no longer show up in your key selector** and it **won't be automatically shared** with your friends.<br>
If you really want to know if the other is using the same key as you, compare the first few characters (up to 16) of the encrypted message.<br>
**DM key:** These keys are generated by a Diffie-Hellman key exchange **between two users**, it provides a `secure connection over unsafe medium`.<br>
# Key Exchanges
If the plugin comes across a message with a key that you don't have it will **attempt to get that key by a key exchange** with the message's sender.<br>
You need to be able to `DM` the other user for the key exchange.<br>
If a group key **isn't** set as `hidden` it will **automatically** be shared with a **friend** if they ask for it.<br>
In order to share a key you need to establish a secure connection with an `initial key exchange`, it is usually **automatic** but you can start it manually from the menu by clicking on `Start Key Exchange` from the DM channel.<br>
You can manually share keys by using the `Share Keys` menu option.<br>
During a `key share`, the sharing party will **suggest you channels** to use so it's advised to **not** set anything for the channel (or toggle encryption) **before you have the key** for it.<br>
# Key Rotation and Trusted Keys
Use the `SdcSetKeyRotation(7)` **console command** to **start a key rotation** on the key of the current channel. This will **periodically generate** a new key and switch to it in all the channels that use the `rotated key`.<br>
In the example above, it's every 7 days (by default this is aligned to arbitrary points so if you use the same command on your other primary devices within a day, it will do the same).<br>
If the key is set to `hidden`, the new key will be hidden too.<br>
`Trusted Keys` can be enabled in the `Key Visualizer` (in DM), this feature can be used to do **automatic key exchange** for `hidden keys` and/or `rotated keys`.<br>
Keys shared with `trusted keys` can swap keys for channels automatically, which is **useful for rotated keys**.<br>
# Extras
You can click on an already enlarged **image** to **further enlarge** it, you can also `drag` the enlarged image if it doesn't fit the screen.<br>
Use the `arrow keys` to **navigate** like a gallery when zoomed in.<br>
You can use **any emote** (animated too) in `encrypted messages`.<br>
Messages above 1600 characters will be compressed, but this feature might have incompatibilities with future versions. This also means that the messages can be 2000 character long if they are mostly made of normal characters.<br>
For `large audio and video files`, you can use **Mega**, it automatically **embeds**.<br>
The **encryption** is completely secure unless someone at Discord replaces your messages right when you secure your DMs, to **make sure** you have the right keys, you can use the `Key Visualizer` and **compare** your result with the other party.</br>
</details>
<details><summary><b>Getting notifications on custom phrases</b></summary>
This feature should be a good compensation for no searches and role mentions<br>
Use the <code>SdcSetPingOn(regexStr)</code> console command to set the match string or <b>regex</b> for the extra <b>pings</b><br>
For example SdcSetPingOn(<code>'An0'</code>) will only ping if the message contains that <b>exact word</b>, SdcSetPingOn(<code>/\bAn[0o]\b/i</code>) will match <i>every form of it</i><br>
<b>Regex explanation:</b> <code>/An0/</code> is the <b>same as the first</b> example, <code>/An[0o]/</code> will match <b>An0 and Ano</b>, <code>/An[0o]/i</code> will be <b>case insensitive</b>, so it matches <i><b>ano</b> and <b>ANO</b> and everything inbetween</i>, <code>\b</code> means <code>word border</code>, which means <b>start or end of word</b>, so <code>/\bano\b/</code> <b>won't mach 'another'</b> <i>(only works if you use letters, numbers or '_')</i><br>
<code>/(?:An0|SimpleDiscordCrypt|SDC)/</code> will match <b>any of the three</b> smaller regexes between the <code>(?:)</code><br>
Please note that characters like <code>.\\+?*()[]$^</code> etc, should be escaped like <code>\.</code><br>
<b>Sample regex for role mentions:</b> <code>/<@&(?:473998238156849152|474006463749160992)>/</code> you can get the role ids with <code>\@Role</code> <b>in the chat</b><br>
</details>
<br>
<br>
<br>
To uninstall, just delete it from %localappdata% and make new shortcuts.<br>
<br>
<br>

𝘚𝘪𝘮𝘱𝘭𝘦𝘋𝘪𝘴𝘤𝘰𝘳𝘥𝘊𝘳𝘺𝘱𝘵<br>
Or according to google: simple discord crypt

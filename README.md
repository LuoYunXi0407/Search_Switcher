This repository is based on code provided by @lshchong, with permission by email. 

Email permission received on 2025-07-01. 

You can find the original version in [Chrome Extensions Store](https://chromewebstore.google.com/detail/%E6%90%9C%E7%B4%A2%E5%88%87%E6%8D%A2/ihpjccbjnfcbipmmjhphfdcpdfddpjgd).
 
Modifications made by [@LuoYunXi](https://github.com/LuoYunXi0407).

For a brief introduction to the changes from the original version, see the [Chinese README](./README-zh.md). ~~I don't want to write the English version or just translate them into English now. I'm so tired these days.~~

The original README (in Chinese) by the original author can be found in the end of the [Chinese README](./README-zh.md)。

---

# Search Switcher

English | [中文](./README-zh.md)

Quickly switch search engines via the extension button without having to re-enter your search terms.

![](https://github.com/user-attachments/assets/b65adf99-456a-42b4-a703-d0e9ebb2be6c)


## Usage
Before use it, load the unpacked extension in developer mode to install.

Pin this extension in the extension bar is suggested.

When you want to switch to another engine, just click the extension icon and select an engine.

If the search engine and search term are not currently recognized, the homepage of the search engine will be opened in a new tab.

## Configuration

Just modify platform.json to the search engine you want.

Here is a example platform:

```json
{
	"id": "google",
	"name": "Google",
	"iconUrl": "icon/google.svg",
	"urlTemplate": "https://www.google.com/search?q={searchTerm}",
	"searchParam": "q",
	"matchDomains": ["www.google.com", "www.google.com.hk"],
	"homePage": "https://www.google.com"
}
```

- `id` seems to have no effect now, but it is better to keep it.
- `name` indicates the name to be displayed in the extension popup.
- `iconUrl` can be a local or remote URL.
- `urlTemplate` indicates the URL format when you switch to another platforms.
- `searchParam` indicates the search param for identifying the current platform' search term.
- `matchDomains` means that if the platform has multiple domain, they can all be identified correctly.
- `homePage` as the name( 

## Privacy statement (by original author)
- All data is stored only locally on the user and will not be uploaded to any server
- Only permission to access the search site is requested to identify search terms and platforms
- No user's search history or personal information will be collected

## At Last

Have a nice day.

~~If some **mysterious oriental characters** of this extension name or popup are confusing you, just modify them into your own language.~~

~~These **strings were hardcoded in Chinese** in mainfest.json, popup.html and popup.js (Especially Line 1217/1225)~~











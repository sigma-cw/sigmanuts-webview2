# Sigma's New User-friendly and Time-saving Solution (NUTS) to YouTube Chat Problem

**A *mostly* standalone app to serve widgets for your YouTube livestreams**

## Features

Sigmanuts offers a very flexible experience. The trade-off between having an extra app to run during live stream and having a positive chat experience is worth it!

- Works with any YouTube chat as long as you have access to it (public, private, unlisted, member-only, etc)
- No delay!
- Lightweight (to an extent)
- Supports in-app customization for chats
- Same widget structure as Streamelements - any custom Twitch chat can be adapted with a few tweaks
- Can run as many different widgets as you want
- Only update chat link once and have it refresh for every overlay in OBS

## Links

- Website
- Twitter

## Requirements

There are multiple ways you can run this app.
### Recommended
Windows 11
- .NET Core 3.1 SDK (Download from here)

Windows 10
- .NET Core 3.1 SDK (Download from here)
- WebView2 Runtime (Download from here)

### Standalone
Windows 11
- No requirements

Windows 10
- WebView2 Runtime (Download from here)

## Installation

To install, download the required packages and then run the app, no installation required.

## How does it work?

## Is it against YouTube ToS?

Short answer: Technically, *kind of* yes. But also... *maybe*.

Long answer: It's complicated. There's a clause in YouTube's terms of service that explicitly prohibits any unauthorized bot activity on their website, including scraping. The unfortunate reality is that the way we can make this app work so well is by injecting a script into a YouTube chat that reads the incoming messages and let's you do all sorts of cool things with them. 

In a broader sense, what we are doing is scraping, yes. At the same time, we do not think it is harmful, as it doesn't do any API requests, and loads only once when the user loads the chat. The initial load is handled by the user, so this script is no different from a browser extension one can run for YouTube. We believe that if YouTube allows extensions that inject scripts and styles into YouTube page, this should also be fine, even if both are *technically* against their terms of service.

Regardless of what you read here, you should decide for yourself whether you want to use the app. We have provided you with the information, and as such are not responsible for what you ultimately decide to do with this app.

## Documentation

## Changelog

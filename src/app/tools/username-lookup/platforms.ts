/**
 * @fileOverview Platform configuration for Username Reconnaissance.
 * Separated from actions.ts to avoid "use server" export restrictions.
 */

export const PLATFORM_GROUPS: Record<string, Record<string, string>> = {
  "Social": {
    "Instagram": "https://www.instagram.com/{{username}}/",
    "Twitter": "https://twitter.com/{{username}}",
    "Reddit": "https://www.reddit.com/user/{{username}}",
    "TikTok": "https://www.tiktok.com/@{{username}}",
    "Pinterest": "https://www.pinterest.com/{{username}}/",
    "Facebook": "https://www.facebook.com/{{username}}",
    "Snapchat": "https://www.snapchat.com/add/{{username}}",
    "Telegram": "https://t.me/{{username}}"
  },
  "Tech & Dev": {
    "GitHub": "https://github.com/{{username}}",
    "GitLab": "https://gitlab.com/{{username}}",
    "StackOverflow": "https://stackoverflow.com/users/{{username}}",
    "Dev.to": "https://dev.to/{{username}}",
    "DockerHub": "https://hub.docker.com/u/{{username}}",
    "NPM": "https://www.npmjs.com/~{{username}}",
    "PyPI": "https://pypi.org/user/{{username}}"
  },
  "Gaming": {
    "Steam": "https://steamcommunity.com/id/{{username}}",
    "Twitch": "https://www.twitch.tv/{{username}}",
    "Roblox": "https://www.roblox.com/user.aspx?username={{username}}",
    "Xbox": "https://www.xboxgamertag.com/search/{{username}}",
    "Playstation": "https://psnprofiles.com/{{username}}"
  },
  "Creative & Other": {
    "YouTube": "https://www.youtube.com/@{{username}}",
    "Behance": "https://www.behance.net/{{username}}",
    "Dribbble": "https://dribbble.com/{{username}}",
    "Medium": "https://medium.com/@{{username}}",
    "Patreon": "https://www.patreon.com/{{username}}",
    "Pastebin": "https://pastebin.com/u/{{username}}"
  }
};

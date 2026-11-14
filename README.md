# SDH-GameSync

It is a fork of [Decky Cloud Save](https://github.com/GedasFX/decky-cloud-save) that majorly aims for the implementation of "per-game sync".

It is still based on [rclone](https://rclone.org/), which allows users to back-up game saves to any cloud drive it supports. The GUI supports OneDrive, Google Cloud and Dropbox right now, other providers need to be configured through command line.

## Troubleshooting

If you are having issues with sync, you can check the logs to try to find out the issue. The logs for a specifc game sync can be accessed from the context menu of the game, while the logs for global sync can be accessed from a button in the Quick Access Menu. You can also find all the logs in the Decky Loader logs folder `~/homebrew/logs/SDH-GameSync/`. You may be asked to provide them when asking for help.

It is recommended to modify the `log_level` entry in `~/homebrew/settings/SDH-GameSync/config.json` to `DEBUG` to get more verbose logs, which can help get the issue identified.

## Features
### Extension over Decky Cloud Save
- Ability to pull down the files (saves, mods, anything) from cloud provider on game launch
- Ability to upload the files to cloud on game stop for backing up and cross-device syncing
- Ability to sync only the files specific for the game being launched
- Ability to sync Steam screenshots the moment they are taken, and clear them locally after sync
- Separated plugin logs and sync logs for each sync
- Enhanced filters and filters edit page
- A shared filter for common exclusions and a specific filter for each sync target (game or global)
- Ability to trigger a sync/resync manually using controller
- Ability to modify the local sync root (use at your own risk!)

### Inherited from Decky Cloud Save
* Ability to sync game saves or arbitrary files to the cloud
* A high variety of supported cloud providers, courtesy of [rclone](https://rclone.org/)
* Ability to back up files automatically after a game is closed
* File counter, which estimates the number of files a sync path would pick up. Prevents accidental backing up of the entire steam deck
* Ability to customize destination folder name
* Easily accessable sync logs

### NOTE!
This plugin by default **does not** delete files, even if files get deleted on the other side. This is intentional to protect against accidents. You can change this behavior by enableing `Quick Access Menu - Advanced Mode - Strict Game Sync`, however, **use it at your own risk** since I have warned **twice** before it can be enabled.

## Installation

Find it on the [decky plugin store](https://plugins.deckbrew.xyz/) or download it from [releases page](https://github.com/AkazaRenn/SDH-GameSync/releases/) (use the built-in installer).

## Usage

### Authentication

To sync files, you must first authenticate with a cloud provider. Everything else will be disabled before a cloud provider is configured.

Navigate to `Quick Access Menu - Cloud Provider` and select one of the three providers. A website will open requesting you to authenticate. After putting in the credentials, the page will close by itself and `Currently using: X` should be updated to the new provider.

Dropbox and OneDrive seem to work okay with this, other providers would need to be installed using the steps outlined [here](#other-providers).

### Filters

The second step of setup is specifying the sync paths.

For global sync, navigate to `Quick Access Menu - Global Sync Configs`, for per-game sync, enter `Sync Filters` from the game's context menu. Inside the page, click buttons to `Add Include Filter` or `Add Exclude Filter`. You can sync individual files or folders. After selecting a path, an estimation of the number of files to be synced will be presented. If the count is greater than 9000, be extra cautious, as you may have selected an incorrect path (for a game, the number of save files usually is not be more than 10). Afterwards, click `Save` button to get it into effect.

**IMPORTANT!** The plugin respects symlinks in the sync paths. If a shortcut gets created, the destination would get backed up as well. This will be visible in the estimated files count.

### Other providers

For one or another reason, a provider may not be able to be configured from the Big Picture mode. For these cases, in terminal run `~/homebrew/data/SDH-GameSync/rclone help backends` to find the string representation of your desired cloud type in rclone. After getting the string representation, put in the following command and execute `~/homebrew/data/SDH-GameSync/rclone --config ~/homebrew/settings/SDH-GameSync/rclone.conf config create cloud <your desired cloud type>`, then follow the steps provided by the prompt. Once that's done you can go back to Steam and continue the configuration. **And don't forget to create the upload folder on your cloud! It defaults to `/sdh-game-sync` but may differ if you have changed the config.**

## Config

### Shared Filter

While syncing, three filters will be used: `--filter-from shared.filter --filter-from <target>.filter -filter-from exclude_all.filter`, which the first two is modifiable. `shared.filter` will be shared among all syncs, global and all games, and has the highest priority. It is designed to exclude files that's generally should not be synced (logs, caches, etc.).

### Per-Game Sync

When a game is launched, if enabled, per-game sync will be triggered. The plugin will first send `SIGSTOP` to the game process to prevent it from reading the existing files, then pull the remote data down, and send `SIGCONT` to the process to allow game to start reading the updated files. The sync when a game is stopped does not block anything, as the game has been terminated already.

Per-game sync by default uses [`rclone copy`](https://rclone.org/commands/rclone_copy/). It will modify any mismatched file, but will not delete anything to avoid data loss, which is ideal in most cases. In case that it's causing any problem, an option is provided in `Quick Access Menu - Advanced Options - Strict Game Sync` that changes it to use [`rclone sync`](https://rclone.org/commands/rclone_sync/), which does allow file removal on mismatch, but also exposing a much higher risk of data loss. **Use it at your own risk!**

#### Caveats
1. Whenever the game is starting with auto-sync enabled, the start will be delayed until sync completes. This is obviously undesirable when there is no internet conectivity, so as a workaround, just disable the auto-sync until you get back to civilization.

1. Although the halting process is quick, its not instantanious. This means that for some games, there is a possibility where files already get read. In testing we have not encountered such games, however the possibility is real. Please open an issue if you uncover such case.

#### Filter
Each game has its own filter that can be configured via the config page entered from the context menu of the game, you can also find it in the plugin's settings folder of Decky Loader with the name `<appId>.filter`. `<appId>.filter` should contain all the files that need to be synced. If it doesn't exist, the sync will be skipped as it's presumed that this game does not need the plugin to sync anything.

#### Accidental Shutdown Prevention
If the plugin is shutdown accidentally during a game session (effectively Steam or gamescope crash), a game stop upload cannot be triggered. This may cause a mismatch between the data on cloud and locally, which the local data is newer. In that case, the next game launch will overwrite newer local data with older cloud data causing data loss. To avoid that, a flag will be set to `localStorage` of CEF when an start game sync is finished, making the local data and cloud data as "out of sync", and an stop game sync will remove the flag, making the sync state as "in sync". If the start game sync finds out that the data is out of sync, it will skip that sync to avoid data loss and send a toast to the user, until another stop game sync finishes successfully.

### Global Sync
Global sync uses [`rclone bisync`](https://rclone.org/commands/rclone_bisync/). It will also be triggered on game start and stop if enabled, but will not block the game launching process, given that it should not cover files related to the game itself, effectively improve the game launching time.

#### Filter
Global sync has its own filter too, named `global.filter` in the plugin's settings folder of Decky Loader.

#### Flow

Sync can be initiated in one of two ways: manually by clicking the `Quick Access Menu - Global Sync Now` button, or automatically. However, for the first time of setup, or there's a major change on the filter, it may be required to do a `resync`. The logs will tell you when it's necessary, and you can do it through the buttons on the top-right corner of the global sync logs page.

#### Conflict Resolution

It is entirely possible that at some point file conflicts occur. You will be warned with a toast notification whenever such case occurs. Thankfully, rclone offers great conflict resolution methods.

Whenever a sync occurs which leads to a conflict, one of the 2 file states will be taken as canon (in context for conflict resolutions). For example, if you click `Sync Now`, the canonical files are the ones on the Steam Deck, which means, that if we have a file `a.txt` that was updated on deck (and not synced), and on the remote, the one on the Deck will take priority. Conversely, if its part of autosync on game start, the remote file would take priority instead.

The loser file, will not be deleted, however it will be renamed to `a.txt.conflict1`. If futher conflicts occur, the number at the end just gets incremented. It's up to the user to delete the file that is not up to date.

If you are sure that you don't care about it, kindly update `additional_bisync_args` entry in `config.json` to use another `--conflict-loser` option. Still, zero support will be provided to it.

### Screenshot Upload
Screenshot upload is relatively simple. Whenever a screenshot is taken, the plugin would get the path of the taken screenshot image and trigger a sync to upload it to the cloud. The screenshot upload destination is configurable from `Quick Access Menu - Screenshot Upload Destination`. You can also configure to delete the local copy of the screenshot after the sync is completed.

Note that even if the screenshot is deleted via Steam API, an empty entry of the screenshot will still remain in Steam's Media page. However, after a Steam restart, they will be gone.

## Other (Advanced)
Some more options are available by enabling `Quick Access Menu - Advanced Options`. You will be warned when enabling it though.

### Change Root Folder
Changing sync root is possible from `Quick Access Menu - Advanced Options - Sync Root`. You should update **all filters** accordingly since the paths inside are relative to the sync root, or your files may be deleted by the syncs.

### Change Destination Folder
Changing sync destination on the cloud is possible from `Quick Access Menu - Advanced Options - Sync Destination`. Be wary of path limitations unique to each provider, and you will definitely want to move the files on the cloud as well or your files may be deleted by the syncs.

### Additional Sync Arguments
You can add addition sync arguments to the entries `additional_sync_args` and `additional_bisync_args` in `config.json`. Entries in `additional_sync_args` will be applied to both per-game syncs and global syncs, while `additional_bisync_args` will only be applied to global syncs, since per-game syncs do not use bisync.

## Translations

The interface follows the Steam language. Available: English, French. To add a language, copy `src/i18n/locales/en.ts`, translate the values (keep the `{{placeholders}}`) and register it in `src/i18n/index.ts`; missing keys fall back to English.

## Acknowledgments
Thank you to:
* [GedasFX](https://github.com/GedasFX) for the amazing work of the original [Decky Cloud Save](https://github.com/GedasFX/decky-cloud-save)!
* [Emiliopg91](https://github.com/Emiliopg91), [NL-TCH](https://github.com/NL-TCH) for bi-sync support!
* [Decky Homebrew Community](https://github.com/SteamDeckHomebrew) for assistance with development!
* [rclone](https://rclone.org/) for making this plugin possible!

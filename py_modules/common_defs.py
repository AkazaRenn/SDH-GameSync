import decky

from enum import Enum
from packaging.version import Version
from pathlib import Path
from tempfile import gettempdir
import ssl, certifi

RCLONE_PORT = 53682

PLUGIN_DEFAULT_CONFIG_PATH = Path(decky.DECKY_PLUGIN_DIR) / "default_config.json"
PLUGIN_CONFIG_DIR = Path(decky.DECKY_PLUGIN_SETTINGS_DIR)

RCLONE_BIN_PATH = Path(decky.DECKY_PLUGIN_RUNTIME_DIR) / "rclone"
RCLONE_CFG_PATH = PLUGIN_CONFIG_DIR / "rclone.conf"
RCLONE_BISYNC_CACHE_DIR = Path(decky.HOME) / ".cache/rclone/bisync"

GLOBAL_SYNC_ID = "global"
SHARED_FILTER_NAME = "shared"

SYNC_FILTER_TYPE_DICT = {
    SHARED_FILTER_NAME: -1,
    GLOBAL_SYNC_ID: 0,
}

DEFAULT_VERSION = Version("0")

logger = decky.logger
ssl_context = ssl.create_default_context(cafile=certifi.where())


class RcloneSyncMode(Enum):
    """
    Enum representing the different modes of rclone sync operations.
    """

    COPY = "copy"
    SYNC = "sync"
    BISYNC = "bisync"


class RcloneSyncWinner(Enum):
    """
    Enum representing the winner in rclone bisync
    """

    LOCAL = "path1"
    CLOUD = "path2"

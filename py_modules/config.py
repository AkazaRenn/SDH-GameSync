from pathlib import Path
from typing import Any
import json

import decky
from settings import SettingsManager
from utils import *

PLUGIN_DEFAULT_CONFIG_PATH = Path(decky.DECKY_PLUGIN_DIR) / "default_config.json"
PLUGIN_CONFIG_DIR = Path(decky.DECKY_PLUGIN_SETTINGS_DIR)

class Config():
    _config = SettingsManager(name="config")
    _default_config = dict()
    try:
        with PLUGIN_DEFAULT_CONFIG_PATH.open('r') as f:
            _default_config.update(json.load(f))
    except Exception as e:
        logger.error(f"Failed to load default config: {e}")

    @classmethod
    def get_config(cls) -> dict[str, Any]:
        """
        Retrieves the plugin configuration.

        Returns:
        dict[str, Any]: The plugin configuration.
        """
        # cls.read()
        if not cls._config.settings:
            cls._config.settings = cls._default_config
            cls.commit()

        return cls._config.settings

    @classmethod
    def get_config_item(cls, key: str) -> Any:
        """
        Retrieves a configuration item.

        Parameters:
        key (str): The key to get.

        Returns:
        Any: The value of the configuration item.
             If the config doesn't exist, the default value will be returned.
             If the entry doesn't exist in the default config, the value from the default config fallback will be returned.
        """
        value = cls.get_config().get(key)
        if not value:
            value = cls._default_config.get(key)
            cls.set_config(key, value)

        return value

    @classmethod
    def get_config_items(cls, *keys: str)-> tuple[Any, ...]:
        """
        Retrieves multiple configuration items.

        Parameters:
        *keys (str): The keys to get.

        Returns:
        tuple: Requested configuration items.
        """
        return *[cls.get_config_item(key) for key in keys],

    @classmethod
    def set_config(cls, key: str, value: Any):
        """
        Sets a configuration key-value pair in the plugin configuration file.

        Parameters:
        key (str): The key to set.
        value (Any): The value to set for the key.
        """
        cls._config.setSetting(key, value)

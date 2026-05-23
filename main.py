from typing import Any
import signal

from common_defs import *
from config import Config
from rclone_manager import RcloneManager
from sync_target import *
import utils


class Plugin:

    # rclone.conf Setup

    async def spawn(self, cloud_type: str) -> str:
        logger.debug("Executing spawn(cloud_type=%s)", cloud_type)
        return await RcloneManager.spawn(cloud_type)

    async def spawn_probe(self) -> int | None:
        logger.debug("Executing probe()")
        return RcloneManager.probe()

    async def get_cloud_type(self) -> str:
        logger.debug("Executing get_cloud_type()")
        return RcloneManager.get_cloud_type()

    async def update_rclone(self):
        logger.debug("Executing update_rclone()")
        return RcloneManager.update_rclone()

    async def create_cloud_destination(self):
        logger.debug("Executing create_cloud_destination()")
        return RcloneManager.create_cloud_destination()

    # Sync Paths

    async def get_target_filters(self, app_id: int) -> list[str]:
        logger.debug("Executing get_target_filters(app_id=%d)", app_id)
        return get_sync_target(app_id).get_filters()

    async def set_target_filters(self, app_id: int, paths: list[str]) -> None:
        logger.debug("Executing set_target_filters(app_id=%d, path=%s)", app_id, paths)
        return get_sync_target(app_id).set_filters(paths)

    async def get_shared_filters(self) -> list[str]:
        logger.debug("Executing get_shared_filters()")
        return GlobalSyncTarget.get_shared_filter()

    async def set_shared_filters(self, paths: list[str]) -> None:
        logger.debug("Executing set_shared_filters(path=%s)", paths)
        return GlobalSyncTarget.set_shared_filters(paths)

    async def get_available_filters(self) -> list[int]:
        logger.debug("Executing get_available_filters()")
        return utils.get_available_filters()

    async def test_syncpath(self, path: str) -> int:
        logger.debug("Executing test_syncpath(%s)", path)
        return utils.test_syncpath(path)

    # Syncing

    async def sync_local_first(self, app_id: int) -> int:
        logger.debug("Executing sync_local_first(app_id=%d)", app_id)
        return await self._sync(RcloneSyncWinner.LOCAL, app_id)

    async def sync_cloud_first(self, app_id: int) -> int:
        logger.debug("Executing sync_cloud_first(app_id=%d)", app_id)
        return await self._sync(RcloneSyncWinner.CLOUD, app_id)

    async def resync_local_first(self) -> int:
        logger.debug("Executing resync_local_first()")
        return await GlobalSyncTarget().resync(RcloneSyncWinner.LOCAL)

    async def resync_cloud_first(self) -> int:
        logger.debug("Executing resync_cloud_first()")
        return await GlobalSyncTarget().resync(RcloneSyncWinner.CLOUD)

    async def copy_capture(self, path: str) -> int:
        logger.debug("Executing copy_capture(path=%s), path")
        return await CaptureCopyTarget(path).sync()

    async def copy_clip(self, clip: str, recordings_dir: str) -> int:
        logger.debug("Executing copy_clip(clip=%s, recordings_dir=%s)", clip, recordings_dir)
        return await ClipCopyTarget(clip, recordings_dir).sync()

    async def delete_lock_files(self):
        logger.debug("Executing delete_lock_files()")
        return utils.delete_lock_files()

    async def _sync(self, winner: RcloneSyncWinner, app_id: int) -> int:
        return await get_sync_target(app_id).sync(winner)

    # Processes

    async def pause_process(self, pid: int) -> None:
        logger.debug("Executing pause_process(pid=%d)", pid)
        utils.send_signal(pid, signal.SIGSTOP)

    async def resume_process(self, pid: int) -> None:
        logger.debug("Executing resume_process(pid=%d)", pid)
        utils.send_signal(pid, signal.SIGCONT)

    # Configuration

    async def get_config(self) -> dict[str, Any]:
        logger.debug("Executing get_config()")
        return Config.get_config()

    async def set_config(self, key: str, value: Any):
        logger.debug("Executing set_config(key=%s, value=%s)", key, value)
        Config.set_config(key, value)

    # Logger

    async def log_debug(self, msg: str) -> None:
        logger.debug(msg)

    async def log_info(self, msg: str) -> None:
        logger.info(msg)

    async def log_warning(self, msg: str) -> None:
        logger.warning(msg)

    async def log_error(self, msg: str) -> None:
        logger.error(msg)

    async def get_last_sync_log(self, app_id: int) -> str:
        logger.debug("Executing get_last_sync_log(app_id=%d)", app_id)
        return get_sync_target(app_id).get_last_sync_log()

    async def get_plugin_log(self) -> str:
        logger.debug("Executing get_plugin_log()")
        return utils.get_plugin_log()

    # Lifecycle

    async def _main(self):
        logger_level = Config.get_config_item("log_level")
        logger.setLevel(logger_level)

        logger.debug("rclone bin path: %s", RCLONE_BIN_PATH)
        logger.debug("rclone cfg path: %s", RCLONE_CFG_PATH)

    async def _unload(self):
        RcloneManager.kill_current_spawn()

    async def _migration(self):
        # plugin_config.migrate()
        pass

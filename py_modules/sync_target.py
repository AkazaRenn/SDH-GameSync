import decky

from datetime import datetime
from asyncio.subprocess import create_subprocess_exec
from pathlib import Path
from shutil import rmtree
from subprocess import list2cmdline
from typing import Awaitable, Callable
import logging

from config import *
from utils import *

ONGOING_SYNCS = set()
PLUGIN_EXCLUDE_ALL_FILTER_PATH = Path(decky.DECKY_PLUGIN_DIR) / "exclude_all.filter"


class _SyncTarget:
    _filter_required = True
    _sync_mode = RcloneSyncMode.COPY
    _shared_filter_file = PLUGIN_CONFIG_DIR / f"{SHARED_FILTER_NAME}.filter"

    def __init__(self, id: str):
        self._id = id
        self._log_dir = Path(decky.DECKY_PLUGIN_LOG_DIR) / self._id
        self._rclone_log_path = None
        self._target_filter_file = PLUGIN_CONFIG_DIR / f"{self._id}.filter"

    async def _start_sync_task(self, sync_task: Callable[[], Awaitable[int]]) -> int:
        """
        Wrapper of the sync_function for preparation and clean up.

        Parameters:
        sync_function (Callable[[], Awaitable[int]]): The sync task to be executed.

        Returns:
        int: Exit code of the sync process.
        """
        if self._id in ONGOING_SYNCS:
            return -1

        ONGOING_SYNCS.add(self._id)
        try:
            sync_result = await sync_task()
        except Exception as e:
            logger.error("Error during sync: %s", e)
            sync_result = -1
        ONGOING_SYNCS.discard(self._id)
        return sync_result

    async def sync(self, winner: RcloneSyncWinner) -> int:
        """
        Runs the rclone sync process.

        Parameters:
        winner (RcloneSyncWinner): The winner of the sync, its data will be preserved as priority.

        Returns:
        int: Exit code of the rclone sync process if it runs, -1 if it cannot run.
        """

        async def sync_task():
            return await self._rclone_execute(winner)

        return await self._start_sync_task(sync_task)

    def _get_rclone_log_path(self, max_log_files: int = 5) -> Path:
        """
        Creates the rclone log file.

        Parameters:
        max_log_files (int): Max number of log files to keep, old ones will be deleted.

        Returns:
        Path: The path to the created rclone log file.
        """
        self._log_dir.mkdir(parents=True, exist_ok=True)

        current_time = datetime.now().strftime("%Y-%m-%d %H.%M.%S")
        self._rclone_log_path = self._log_dir / f"rclone {current_time}.log"

        # remove extra log files
        all_log_files = sorted(self._log_dir.glob("rclone *.log"))
        if len(all_log_files) >= (max_log_files):
            for old_log_file in all_log_files[: -(max_log_files - 1)]:
                old_log_file.unlink(missing_ok=True)

        return self._rclone_log_path

    def get_last_sync_log(self) -> str:
        """
        Retrieves the last synchronization log.

        Returns:
        str: The last synchronization log contents.
        """
        if not self._rclone_log_path:
            all_log_files = sorted(self._log_dir.glob("rclone *.log"))
            if all_log_files:
                self._rclone_log_path = all_log_files[-1]
            else:
                return "No logs available."
        try:
            with self._rclone_log_path.open() as f:
                return f.read()
        except Exception as e:
            err_msg = f'Error reading log file "{self._rclone_log_path}":\n{e}'
            logger.error(err_msg)
            return err_msg

    def _get_sync_paths(
        self, winner: RcloneSyncWinner = RcloneSyncWinner.LOCAL
    ) -> tuple[str, str]:
        """
        Retrieves the sync root and destination directory from the configuration.

        Parameters:
        winner (RcloneSyncWinner): Winner of this sync

        Returns:
        tuple[str, str]: A tuple containing the source sync path and destination sync path.
        """
        sync_root, sync_dest = Config.get_config_items("sync_root", "sync_destination")

        if (winner == RcloneSyncWinner.CLOUD) and (
            self._sync_mode != RcloneSyncMode.BISYNC
        ):
            return f"cloud:{sync_dest}", sync_root
        else:
            return sync_root, f"cloud:{sync_dest}"

    async def _rclone_execute(
        self, winner: RcloneSyncWinner, extra_args: list[str] = []
    ) -> int:
        """
        Runs the rclone sync process.

        Parameters:
        winner (RcloneSyncWinner): The winner of the sync, its data will be preserved as priority.
        extra_args (list[str]): Extra arguemnts to be passed to rclone

        Returns:
        int: Exit code of the rclone sync process if it runs, -1 if it cannot run.
        """
        if self._filter_required and (not self._target_filter_file.exists()):
            logger.info(f'No filter for sync "{self._id}"')
            return 0

        if not self._shared_filter_file.exists():
            self._shared_filter_file.touch(exist_ok=True)

        arguments = ["--config", str(RCLONE_CFG_PATH), self._sync_mode.value]
        arguments.extend(self._get_sync_paths(winner))

        if self._filter_required:
            arguments.extend(
                [
                    "--filter-from",
                    str(self._shared_filter_file),
                    "--filter-from",
                    str(self._target_filter_file),
                    "--filter-from",
                    str(PLUGIN_EXCLUDE_ALL_FILTER_PATH),
                ]
            )

        arguments.extend(
            [
                "--log-file",
                str(self._get_rclone_log_path()),
                "--log-format",
                "nolevel",
            ]
        )

        if self._sync_mode == RcloneSyncMode.BISYNC:
            arguments.extend(["--conflict-resolve", winner.value])
            arguments.extend(Config.get_config_item("additional_bisync_args"))

        arguments.extend(Config.get_config_item("additional_sync_args"))
        arguments.extend(extra_args)
        arguments.extend(self._get_verbose_flag())

        logger.info(f'Running command: "{RCLONE_BIN_PATH}" {list2cmdline(arguments)}')
        current_sync = await create_subprocess_exec(
            str(RCLONE_BIN_PATH),
            *arguments,
            stdin=PIPE,
            stdout=PIPE,
            stderr=PIPE,
        )
        sync_stdcout, sync_stderr = await current_sync.communicate()
        sync_result = current_sync.returncode

        logger.info(f'Sync for "{self._id}" finished with exit code: {sync_result}')
        if sync_stdcout:
            logger.info(f'Sync for "{self._id}" stdout:\n{sync_stdcout.decode()}')
        if sync_stderr:
            logger.error(f'Sync for "{self._id}" stderr:\n{sync_stderr.decode()}')

        return sync_result

    @classmethod
    def get_shared_filter(cls) -> list[str]:
        """
        Retrieves sync filters from the shared file.

        Returns:
        list[str]: A list of filters, '\\n's will be stripped.
        """
        return get_filters(cls._shared_filter_file)

    @classmethod
    def set_shared_filters(cls, filters: list[str]):
        """
        Updates sync filters to the shared file.

        Parameters:
        filters (list[str]): The filters to set, elements inside should not contain '\\n'.
        """
        set_filters(cls._shared_filter_file, filters)

    def get_filters(self) -> list[str]:
        """
        Retrieves sync filters from the target file.

        Returns:
        list[str]: A list of filters, '\\n's will be stripped.
        """
        return get_filters(self._target_filter_file)

    def set_filters(self, filters: list[str]):
        """
        Updates sync filters to the target file.

        Parameters:
        filters (list[str]): The filters to set, elements inside should not contain '\\n'.
        """
        set_filters(self._target_filter_file, filters)

    def _get_verbose_flag(self) -> list[str]:
        """
        Returns the verbose flag for the rclone command.

        Returns:
        list[str]: The verbose flag in a list.
        """
        if logger.level <= logging.DEBUG:
            return ["-vv"]
        elif logger.level <= logging.WARNING:
            return ["-v"]
        else:
            return []


class GlobalSyncTarget(_SyncTarget):
    _sync_mode = RcloneSyncMode.BISYNC

    def __init__(self):
        super().__init__(GLOBAL_SYNC_ID)

    async def resync(self, winner: RcloneSyncWinner) -> int:
        """
        Triggers rclone bisync resync to fix sync issues. Only works when bisync is enabled.

        Parameters:
        winner (RcloneSyncWinner): The winner of the sync, its data will be preserved as priority.

        Returns:
        int: Exit code of the rclone sync process if it runs, -1 if it cannot run.
        """

        async def sync_task():
            return await self._rclone_execute(winner, ["--resync"])

        return await self._start_sync_task(sync_task)


class GameSyncTarget(_SyncTarget):
    _sync_mode = RcloneSyncMode.COPY

    def __init__(self, app_id: int):
        if app_id <= 0:
            raise ValueError(f"Invalid app_id {app_id}, it is required to be > 0")
        super().__init__(str(app_id))
        if Config.get_config_item("strict_game_sync"):
            self._sync_mode = RcloneSyncMode.SYNC


class SingleFileCopyTarget(_SyncTarget):
    _filter_required = False
    _sync_mode = RcloneSyncMode.COPY

    def __init__(self, file_path: str, destination: str):
        if not file_path:
            raise ValueError("capture_path is required")
        if not Path(file_path).is_file():
            raise ValueError(f"Invalid file path: {file_path}")
        super().__init__(file_path)
        self._file_path = Path(file_path)
        self._destination = destination

    async def sync(self, winner: RcloneSyncWinner = RcloneSyncWinner.LOCAL) -> int:
        """
        Runs the rclone sync process.

        Returns:
        int: Exit code of the rclone sync process if it runs, -1 if it cannot run.
        """
        return await super().sync(winner)

    def _get_sync_paths(self, winner: RcloneSyncWinner = RcloneSyncWinner.LOCAL) -> tuple[str, str]:
        """
        Retrieves the sync root and destination directory from the configuration.

        Returns:
        tuple[str, str]: A tuple containing the source sync path and destination sync path.
        """
        return (
            str(self._file_path),
            f"cloud:{self._destination}",
        )

    def _get_rclone_log_path(self, max_log_files: int = 0) -> Path:
        """
        Returns the rclone log file path, for screenshots it will be the config log

        Returns:
        Path: The path to the created rclone log file.
        """
        return Path(decky.DECKY_PLUGIN_LOG)

    def _get_verbose_flag(self) -> list[str]:
        """
        Returns the verbose flag for the rclone command.

        Returns:
        list[str]: The verbose flag in a list.
        """
        return []


class CaptureCopyTarget(SingleFileCopyTarget):
    def __init__(self, screenshot_path: str):
        super().__init__(screenshot_path, Config.get_config_item("capture_upload_destination"))


class ClipCopyTarget():
    def __init__(self, clip: str, path: str):
        self._clip_dir = Path(path) / "clips" / clip
        self._clips = combine_clips(self._clip_dir)
        if not self._clips:
            raise ValueError(f"Empty outputs {self._clip_dir}", self._clip_dir)

    async def sync(self) -> int:
        destination = Config.get_config_item("capture_upload_destination_video")
        for clip in self._clips:
            logger.debug("Copying clip %s", clip)
            rc = await SingleFileCopyTarget(str(clip), destination).sync()
            clip.unlink()

            if rc != 0:
                return rc

        rmtree(self._clip_dir)
        return 0


def get_sync_target(app_id: int) -> _SyncTarget:
    """
    Returns the sync target based on the app_id.

    Parameters:
    app_id (int): The app_id of the game.

    Returns:
    _SyncTarget: The sync target.
    """
    if app_id > 0:
        return GameSyncTarget(app_id)
    else:
        return GlobalSyncTarget()

from asyncio import create_subprocess_exec
from asyncio.subprocess import Process, PIPE
from time import sleep
from packaging.version import Version
import re, urllib, subprocess

from common_defs import *
from utils import *


class RcloneManager:
    current_spawn: Process | None = None

    @classmethod
    async def spawn(cls, cloud_type: str) -> str:
        """
        Spawns a new rclone process with the specified cloud type.

        Parameters:
        cloud_type (str): The type of cloud to use.

        Returns:
        str: The URL for authentication.
        """
        logger.info("Updating rclone.conf")

        cls.kill_current_spawn()
        if is_port_in_use(RCLONE_PORT):
            raise Exception("RCLONE_PORT_IN_USE")

        cls.current_spawn = await create_subprocess_exec(
            RCLONE_BIN_PATH,
            *(
                [
                    "--config",
                    RCLONE_CFG_PATH,
                    "config",
                    "create",
                    "cloud",
                    cloud_type,
                ]
            ),
            stderr=PIPE,
        )

        url = await cls.get_url_from_rclone_process()
        logger.debug("Login URL: %s", url)
        return url

    @classmethod
    def kill_current_spawn(cls):
        """
        Kills the previous spawned process.

        Parameters:
        process (asyncio.subprocess.Process): The process to be killed.
        """
        if cls.current_spawn and cls.current_spawn.returncode is None:
            logger.warning("Killing previous Process")
            cls.current_spawn.kill()
            sleep(0.1)  # Give time for OS to clear up the port
            cls.current_spawn = None

    @classmethod
    async def get_url_from_rclone_process(cls):
        """
        Extracts the URL from the stderr of the rclone process.

        Parameters:
        process (asyncio.subprocess.Process): The rclone process.

        Returns:
        str: The URL extracted from the process output.
        """
        for _ in range(5):
            line = (await cls.current_spawn.stderr.readline()).decode()
            logger.debug("Rclone output: %s", line)
            if url_re_match := re.search(r"http://127.0.0.1:\d+/auth\?state=.*", line):
                return url_re_match.group(0)

        logger.warning("Failed to extract URL from rclone process")
        cls.kill_current_spawn()
        return ""

    @classmethod
    def probe(cls) -> int | None:
        """
        Checks if the current rclone process is running.

        Returns:
        int: The return code of the rclone process.
        """
        if not cls.current_spawn:
            return 0

        return cls.current_spawn.returncode

    @classmethod
    def get_cloud_type(cls) -> str:
        """
        Retrieves the current cloud type from the rclone configuration.

        Returns:
        str: The current cloud type, empty string if it doesn't exist
        """
        try:
            with RCLONE_CFG_PATH.open("r") as f:
                l = f.readlines()
                return l[1].strip().split(" ")[-1]
        except Exception as e:
            logger.warning("Failed to get cloud type from rclone config: %s", e)

        return ""

    @classmethod
    def update_rclone(cls):
        """
        Checks for updates to rclone and updates if necessary.
        """
        latest_version = cls._get_latest_rclone_version()
        logger.info("Latest version: %s", latest_version)
        current_version = cls._get_current_rclone_version()
        logger.info("Current version: %s", current_version)

        if latest_version > current_version:
            logger.info("Updating rclone from %s to %s", current_version, latest_version)
            cls._get_rclone()
            return

        logger.debug("No update required")
        return "No update required"

    @classmethod
    def _get_latest_rclone_version(cls) -> Version:
        """
        Retrieves the latest version of rclone from GitHub.

        Returns:
        Version: The latest version of rclone.
        """
        url = "https://downloads.rclone.org/version.txt"
        try:
            with urllib.request.urlopen(url, context=ssl_context) as response:
                if response.status == 200:
                    return Version(response.read().decode("utf-8").strip().split(' ')[-1])
        except Exception as e:
            logger.warning(f"Failed to fetch the latest version of rclone: {e}")

        return DEFAULT_VERSION

    @classmethod
    def _get_current_rclone_version(cls) -> Version:
        """
        Retrieves the current version of rclone from the rclone configuration.

        Returns:
        Version: The current version of rclone.
        """
        if not RCLONE_BIN_PATH.exists():
            logger.info("Rclone binary does not exist in path %s", RCLONE_BIN_PATH)
            return DEFAULT_VERSION

        with subprocess.Popen(
            [RCLONE_BIN_PATH, "--version"], stdout=subprocess.PIPE
        ) as p:
            if p.stdout:
                lines = p.stdout.readlines()
            else:
                logger.error("No stdout getting rclone version")
                lines = []

        pattern = re.compile(rb"rclone v[\d\.]+")
        for line in lines:
            if re.search(pattern, line):
                return Version(line.decode().strip().split(' ')[-1])

        logger.warning("Failed to extract the current version of rclone")
        return DEFAULT_VERSION

    @classmethod
    def _get_rclone(cls) -> None:
        """
        Downloads the latest version of rclone and replaces the current version.
        """
        download_url = "https://downloads.rclone.org/rclone-current-linux-amd64.zip"
        with urllib.request.urlopen(download_url, context=ssl_context) as response:
            if response.status == 200:
                import io, zipfile

                zip_data = io.BytesIO(response.read())
                with zipfile.ZipFile(zip_data) as zip_ref:
                    for entry in zip_ref.namelist():
                        if entry.endswith("/rclone"):
                            with open(RCLONE_BIN_PATH, "wb") as f:
                                f.write(zip_ref.read(entry))
                            # Make the binary executable
                            RCLONE_BIN_PATH.chmod(
                                RCLONE_BIN_PATH.stat().st_mode | 0o111
                            )
                            logger.info("Rclone downloaded to %s", RCLONE_BIN_PATH)
                            return
                    logger.error(
                        "Failed to extract the latest version of rclone, zip content: %s",
                        zip_ref.namelist(),
                    )
            else:
                logger.error(
                    "Failed to download the latest version. HTTP status: %d",
                    response.status,
                )

    @classmethod
    def create_cloud_destination(cls):
        """
        Creates the cloud destination directory if it doesn't exist.
        """
        sync_destination = Config.get_config_item("sync_destination")
        with subprocess.Popen(
            [
                RCLONE_BIN_PATH,
                "--config",
                RCLONE_CFG_PATH,
                "mkdir",
                f"cloud:{sync_destination}",
                "-v",
            ],
            stdout=subprocess.PIPE,
            text=True,
        ) as p:
            if p.stdout:
                logger.debug("Creating cloud destination: %s", p.stdout.read())
            else:
                logger.warning("No stdout when creating cloud destination")

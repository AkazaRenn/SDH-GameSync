import { callable } from "@decky/api"

// rclone.conf Setup
export const spawn = callable<[backend_type: string], string>("spawn");
export const spawn_probe = callable<[], number | null>("spawn_probe");
export const get_cloud_type = callable<[], string>("get_cloud_type");
export const update_rclone = callable<[], void>("update_rclone");
export const create_cloud_destination = callable<[], void>("create_cloud_destination");

// Sync Paths
export const get_target_filters = callable<[app_id: number], Array<string>>("get_target_filters");
export const set_target_filters = callable<[app_id: number, paths: Array<string>], void>("set_target_filters");
export const get_shared_filters = callable<[], Array<string>>("get_shared_filters");
export const set_shared_filters = callable<[paths: Array<string>], void>("set_shared_filters");
export const get_available_filters = callable<[], Array<number>>("get_available_filters");
export const test_syncpath = callable<[path: string], number>("test_syncpath");

// Syncing
export const sync_local_first = callable<[app_id: number], number>("sync_local_first");
export const sync_cloud_first = callable<[app_id: number], number>("sync_cloud_first");
export const resync_local_first = callable<[], number>("resync_local_first");
export const resync_cloud_first = callable<[], number>("resync_cloud_first");
export const copy_capture = callable<[path: string], number>("copy_capture");
export const copy_clip = callable<[name: string, recordings_dir: string], number>("copy_clip");
export const delete_clip_locally = callable<[name: string, recordings_dir: string], number>("delete_clip_locally");
export const delete_lock_files = callable<[], void>("delete_lock_files");

// Processes
export const pause_process = callable<[pid: number], void>("pause_process");
export const resume_process = callable<[pid: number], void>("resume_process");

// Configuration
export const get_config = callable<[], object>("get_config");
export const set_config = callable<[key: string, value: any], void>("set_config");

// Logger
export const log_debug = callable<[msg: string], void>("log_debug");
export const log_info = callable<[msg: string], void>("log_info");
export const log_warning = callable<[msg: string], void>("log_warning");
export const log_error = callable<[msg: string], void>("log_error");
export const get_last_sync_log = callable<[app_id: number], string>("get_last_sync_log");
export const get_plugin_log = callable<[], string>("get_plugin_log");

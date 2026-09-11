// Shared by MEASUREMENT and WORKOUT. The backend DTO still advertises 10fps,
// but its frame validator accepts increasing sequences/timestamps at 15fps.
export const POSE_TRANSMISSION_FPS = 15;
export const POSE_TRANSMISSION_INTERVAL_MS = 1_000 / POSE_TRANSMISSION_FPS;

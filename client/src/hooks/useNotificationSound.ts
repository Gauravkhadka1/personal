// useNotificationSound.ts
export const playNotificationSound = (notification: { sound?: string }) => {
  if (notification) {
    // Determine which sound to play based on notification type
    let soundFile = '/sounds/default.mp3';
    
    if (notification.sound === 'task_assigned') {
      soundFile = '/sounds/task-assigned.mp3';
    } else if (notification.sound === 'status_changed') {
      soundFile = '/sounds/status-changed.mp3';
    } else if (notification.sound === 'subtask_assigned') {
      soundFile = '/sounds/subtask-assigned.mp3';
    }
    
    // Play the sound
    const audio = new Audio(soundFile);
    audio.play().catch(e => console.error("Error playing sound:", e));
  }
};
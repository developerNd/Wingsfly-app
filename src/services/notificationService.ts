import notifee, { 
  TimestampTrigger, 
  TriggerType, 
  AndroidImportance,
  AuthorizationStatus,
  RepeatFrequency
} from '@notifee/react-native';
import { Task } from '../types/task';
import { SubRoutine, Activity } from '../types/routine';
import { addMinutes, isBefore, parseISO } from 'date-fns';

class NotificationService {
  constructor() {
    this.initialize();
  }

  initialize = async () => {
    // Request permissions
    const settings = await notifee.requestPermission();

    if (settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED) {
      // Create notification channels for Android
      await this.createChannels();
    }
  };

  private createChannels = async () => {
    try {
      console.log('Creating notification channels with sound: warning_notification');
      const channel = await notifee.createChannel({
        id: 'task-reminders',
        name: 'Task Reminders',
        importance: AndroidImportance.HIGH,
        sound: 'warning_notification',
        vibration: true,
        vibrationPattern: [300, 500],
      });
      console.log('Channel created:', channel);

      const routineChannel = await notifee.createChannel({
        id: 'routine-reminders',
        name: 'Routine Reminders',
        importance: AndroidImportance.HIGH,
        sound: 'warning_notification',
        vibration: true,
        vibrationPattern: [300, 500],
      });
      console.log('Routine channel created:', routineChannel);
    } catch (error) {
      console.error('Error creating channels:', error);
    }
  };

  scheduleTaskNotification = async (task: Task) => {
    if (!task.scheduledTime || !task.scheduledDate) return;

    try {
      console.log('Scheduling notification with custom sound configuration');
      // Parse the scheduled time
      const [hours, minutes] = task.scheduledTime.split(':').map(Number);
      const scheduledDate = new Date(task.scheduledDate);
      scheduledDate.setHours(hours, minutes, 0, 0);

      // Calculate notification time (10 minutes before task)
      const notificationTime = addMinutes(scheduledDate, -10);

      // Don't schedule if the time has already passed
      if (isBefore(notificationTime, new Date())) {
        return;
      }

      // Create the trigger
      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: notificationTime.getTime(),
      };

      // Get existing channel to verify sound setting
      const channel = await notifee.getChannel('task-reminders');
      console.log('Current channel configuration:', channel);

      // Schedule the notification
      const notification = await notifee.createTriggerNotification(
        {
          id: `task-${task.id}`,
          title: 'Upcoming Task',
          body: `${task.title} starts in 10 minutes`,
          android: {
            channelId: 'task-reminders',
            importance: AndroidImportance.HIGH,
            sound: 'warning_notification',
            pressAction: {
              id: 'default',
            },
            actions: [
              {
                title: '✅ I\'m Available',
                pressAction: {
                  id: 'available',
                },
              },
              {
                title: '❌ Reschedule',
                pressAction: {
                  id: 'reschedule',
                },
              },
            ],
          },
          ios: {
            sound: 'warning_notification.wav',
            categoryId: 'task-reminder',
          },
        },
        trigger,
      );
      console.log('Notification scheduled:', notification);
    } catch (error) {
      console.error('Error scheduling task notification:', error);
    }
  };

  scheduleRoutineActivityNotification = async (
    routineTitle: string,
    activity: Activity,
    routineType: 'morning' | 'evening'
  ) => {
    if (!activity.scheduled_time) return;

    try {
      // Parse the scheduled time
      const [hours, minutes] = activity.scheduled_time.split(':').map(Number);
      const scheduledDate = new Date();
      scheduledDate.setHours(hours, minutes, 0, 0);

      // Calculate notification time (10 minutes before activity)
      const notificationTime = addMinutes(scheduledDate, -10);

      // Don't schedule if the time has already passed
      if (isBefore(notificationTime, new Date())) {
        // If it's passed for today, schedule for tomorrow
        notificationTime.setDate(notificationTime.getDate() + 1);
      }

      // Create the trigger
      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: notificationTime.getTime(),
        repeatFrequency: RepeatFrequency.DAILY, // Use imported RepeatFrequency
      };

      // Schedule the notification
      await notifee.createTriggerNotification(
        {
          id: `routine-${routineType}-${activity.id}`,
          title: `${routineType.charAt(0).toUpperCase() + routineType.slice(1)} Routine`,
          body: `${activity.title} starts in 10 minutes`,
          android: {
            channelId: 'routine-reminders',
            importance: AndroidImportance.HIGH,
            pressAction: {
              id: 'default',
            },
          },
          ios: {
            sound: 'default',
          },
        },
        trigger,
      );
    } catch (error) {
      console.error('Error scheduling routine notification:', error);
    }
  };

  // Schedule notifications for all tasks
  scheduleAllTaskNotifications = async (tasks: Task[]) => {
    await Promise.all(tasks.map(task => this.scheduleTaskNotification(task)));
  };

  // Schedule notifications for all routine activities
  scheduleAllRoutineNotifications = async (routines: { title: string; type: 'morning' | 'evening'; activities: Activity[] }[]) => {
    await Promise.all(
      routines.flatMap(routine =>
        routine.activities.map(activity =>
          this.scheduleRoutineActivityNotification(routine.title, activity, routine.type)
        )
      )
    );
  };

  // Cancel a specific notification
  cancelNotification = async (id: string) => {
    await notifee.cancelNotification(id);
  };

  // Cancel all notifications
  cancelAllNotifications = async () => {
    await notifee.cancelAllNotifications();
  };
}

export default new NotificationService();
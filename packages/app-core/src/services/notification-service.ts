// Platform-agnostic notification service
export interface NotificationPermission {
  granted: boolean;
  denied: boolean;
  prompt: boolean;
}

export interface NotificationConfig {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
  silent?: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface NotificationService {
  // Permission management
  checkPermission(): Promise<NotificationPermission>;
  requestPermission(): Promise<boolean>;

  // Notification display
  showNotification(config: NotificationConfig): Promise<void>;
  showLocalNotification(config: NotificationConfig): Promise<void>;

  // Event handling
  onNotificationClick(callback: (data: any) => void): () => void;
  onNotificationReceived(callback: (notification: NotificationConfig) => void): () => void;

  // Badge management (mobile)
  setBadgeCount(count: number): Promise<void>;
  clearBadge(): Promise<void>;

  // Subscription management (web push)
  subscribe(): Promise<string | null>;
  unsubscribe(): Promise<void>;
  getSubscription(): Promise<any | null>;
}

// Web notification service implementation
export class WebNotificationService implements NotificationService {
  private clickListeners: Set<(data: any) => void> = new Set();
  private receiveListeners: Set<(notification: NotificationConfig) => void> = new Set();

  async checkPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return { granted: false, denied: true, prompt: false };
    }

    const permission = Notification.permission;
    return {
      granted: permission === 'granted',
      denied: permission === 'denied',
      prompt: permission === 'default',
    };
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  async showNotification(config: NotificationConfig): Promise<void> {
    const permission = await this.checkPermission();
    if (!permission.granted) {
      console.warn('Notification permission not granted');
      return;
    }

    const notification = new Notification(config.title, {
      body: config.body,
      icon: config.icon,
      badge: config.badge,
      image: config.image,
      tag: config.tag,
      data: config.data,
      requireInteraction: config.requireInteraction,
      silent: config.silent,
      actions: config.actions,
    });

    notification.onclick = (event) => {
      this.clickListeners.forEach(listener => {
        try {
          listener(config.data);
        } catch (error) {
          console.error('Error in notification click listener:', error);
        }
      });
    };
  }

  async showLocalNotification(config: NotificationConfig): Promise<void> {
    // For web, local notifications are the same as regular notifications
    return this.showNotification(config);
  }

  onNotificationClick(callback: (data: any) => void): () => void {
    this.clickListeners.add(callback);
    return () => this.clickListeners.delete(callback);
  }

  onNotificationReceived(callback: (notification: NotificationConfig) => void): () => void {
    this.receiveListeners.add(callback);
    return () => this.receiveListeners.delete(callback);
  }

  async setBadgeCount(count: number): Promise<void> {
    if ('setAppBadge' in navigator) {
      try {
        await (navigator as any).setAppBadge(count);
      } catch (error) {
        console.warn('Failed to set app badge:', error);
      }
    }
  }

  async clearBadge(): Promise<void> {
    if ('clearAppBadge' in navigator) {
      try {
        await (navigator as any).clearAppBadge();
      } catch (error) {
        console.warn('Failed to clear app badge:', error);
      }
    }
  }

  async subscribe(): Promise<string | null> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.VAPID_PUBLIC_KEY,
      });

      return JSON.stringify(subscription);
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  async unsubscribe(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
    }
  }

  async getSubscription(): Promise<any | null> {
    if (!('serviceWorker' in navigator)) {
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      return await registration.pushManager.getSubscription();
    } catch (error) {
      console.error('Failed to get push subscription:', error);
      return null;
    }
  }
}

// Mobile notification service implementation
export class MobileNotificationService implements NotificationService {
  // This would integrate with Expo Notifications or react-native-push-notification
  private clickListeners: Set<(data: any) => void> = new Set();
  private receiveListeners: Set<(notification: NotificationConfig) => void> = new Set();

  async checkPermission(): Promise<NotificationPermission> {
    // Implementation would use Expo.Notifications.getPermissionsAsync()
    // or similar mobile notification permission APIs
    return { granted: false, denied: false, prompt: true };
  }

  async requestPermission(): Promise<boolean> {
    // Implementation would use Expo.Notifications.requestPermissionsAsync()
    // or similar mobile notification permission APIs
    return false;
  }

  async showNotification(config: NotificationConfig): Promise<void> {
    // Implementation would use Expo.Notifications.scheduleNotificationAsync()
    // or similar mobile notification APIs
  }

  async showLocalNotification(config: NotificationConfig): Promise<void> {
    // Implementation would use local notification APIs
    return this.showNotification(config);
  }

  onNotificationClick(callback: (data: any) => void): () => void {
    this.clickListeners.add(callback);
    return () => this.clickListeners.delete(callback);
  }

  onNotificationReceived(callback: (notification: NotificationConfig) => void): () => void {
    this.receiveListeners.add(callback);
    return () => this.receiveListeners.delete(callback);
  }

  async setBadgeCount(count: number): Promise<void> {
    // Implementation would use Expo.Notifications.setBadgeCountAsync()
    // or similar mobile badge APIs
  }

  async clearBadge(): Promise<void> {
    return this.setBadgeCount(0);
  }

  async subscribe(): Promise<string | null> {
    // Implementation would use Expo.Notifications.getExpoPushTokenAsync()
    // or similar mobile push token APIs
    return null;
  }

  async unsubscribe(): Promise<void> {
    // Implementation would clear the push token
  }

  async getSubscription(): Promise<any | null> {
    // Implementation would get the current push token
    return null;
  }
}

// Factory functions
export function createWebNotificationService(): NotificationService {
  return new WebNotificationService();
}

export function createMobileNotificationService(): NotificationService {
  return new MobileNotificationService();
}

// Platform-agnostic factory
export function createNotificationService(): NotificationService {
  const isMobile = typeof window !== 'undefined' &&
    (window as any).ReactNativeWebView !== undefined;

  if (isMobile) {
    return createMobileNotificationService();
  }

  return createWebNotificationService();
}

// Singleton notification service instance
let notificationServiceInstance: NotificationService | null = null;

export function getNotificationService(): NotificationService {
  if (!notificationServiceInstance) {
    notificationServiceInstance = createNotificationService();
  }
  return notificationServiceInstance;
}

// Notification utilities
export const notificationUtils = {
  // Show a simple text notification
  async showSimple(title: string, body: string, data?: any): Promise<void> {
    const service = getNotificationService();
    await service.showNotification({
      title,
      body,
      data,
    });
  },

  // Show a notification with action buttons
  async showWithActions(
    title: string,
    body: string,
    actions: NotificationAction[],
    data?: any
  ): Promise<void> {
    const service = getNotificationService();
    await service.showNotification({
      title,
      body,
      actions,
      data,
      requireInteraction: true,
    });
  },

  // Request permission and show notification
  async requestAndShow(config: NotificationConfig): Promise<void> {
    const service = getNotificationService();
    const granted = await service.requestPermission();

    if (granted) {
      await service.showNotification(config);
    } else {
      console.warn('Notification permission not granted');
    }
  },

  // Update badge count
  async updateBadge(count: number): Promise<void> {
    const service = getNotificationService();
    await service.setBadgeCount(count);
  },
};
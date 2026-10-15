export interface ServiceWorkerController {
  postMessage(message: unknown): void;
  state?: string;
}

export interface ServiceWorkerRegistrationLike {
  waiting?: ServiceWorkerController | null;
  installing?: ServiceWorkerController | null;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
}

export interface ServiceWorkerContainerLike {
  controller: ServiceWorkerController | null;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
  register(scriptURL: string): Promise<ServiceWorkerRegistrationLike>;
}

export interface PWAUpdateManagerOptions {
  navigatorServiceWorker?: ServiceWorkerContainerLike;
  reloadPage?: () => void;
  onUpdateAvailable?: (worker: ServiceWorkerController) => void;
  onUpdateDismissed?: () => void;
}

export class PWAUpdateManager {
  private swContainer: ServiceWorkerContainerLike | null;
  private reloadPageFn: () => void;
  private onUpdateAvailableFn?: (worker: ServiceWorkerController) => void;
  private onUpdateDismissedFn?: () => void;

  private isRefreshRequested = false;
  private isRefreshing = false;
  private waitingWorker: ServiceWorkerController | null = null;
  private dismissedWorker: ServiceWorkerController | null = null;
  private controllerChangeListener: EventListener | null = null;

  constructor(options: PWAUpdateManagerOptions = {}) {
    this.swContainer =
      options.navigatorServiceWorker ||
      (typeof window !== 'undefined' && 'serviceWorker' in navigator
        ? (navigator.serviceWorker as unknown as ServiceWorkerContainerLike)
        : null);

    this.reloadPageFn =
      options.reloadPage ||
      (() => {
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      });

    this.onUpdateAvailableFn = options.onUpdateAvailable;
    this.onUpdateDismissedFn = options.onUpdateDismissed;
  }

  public init(): void {
    if (!this.swContainer) return;

    this.controllerChangeListener = () => {
      this.handleControllerChange();
    };

    this.swContainer.addEventListener('controllerchange', this.controllerChangeListener);

    this.swContainer
      .register('/sw.js')
      .then((registration) => {
        this.checkRegistration(registration);
      })
      .catch((err) => {
        console.error('Service Worker registration failed:', err);
      });
  }

  public checkRegistration(registration: ServiceWorkerRegistrationLike): void {
    if (!registration) return;

    if (registration.waiting) {
      this.handleWorkerUpdate(registration.waiting);
    }

    registration.addEventListener('updatefound', () => {
      const installing = registration.installing;
      if (!installing) return;

      if ('addEventListener' in installing && typeof installing.addEventListener === 'function') {
        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed') {
            this.handleWorkerUpdate(installing);
          }
        });
      }
    });
  }

  public handleWorkerUpdate(worker: ServiceWorkerController | null): void {
    if (!worker) return;
    if (this.dismissedWorker === worker) return;
    if (this.swContainer && this.swContainer.controller) {
      this.waitingWorker = worker;
      if (this.onUpdateAvailableFn) {
        this.onUpdateAvailableFn(worker);
      }
    }
  }

  public handleControllerChange(): void {
    if (this.isRefreshRequested && !this.isRefreshing) {
      this.isRefreshing = true;
      this.reloadPageFn();
    }
  }

  public refresh(): void {
    if (this.waitingWorker) {
      if (this.waitingWorker.state === 'redundant') {
        if (this.onUpdateDismissedFn) this.onUpdateDismissedFn();
        return;
      }
      this.isRefreshRequested = true;
      this.waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
    if (this.onUpdateDismissedFn) this.onUpdateDismissedFn();
  }

  public dismiss(): void {
    if (this.waitingWorker) {
      this.dismissedWorker = this.waitingWorker;
    }
    if (this.onUpdateDismissedFn) this.onUpdateDismissedFn();
  }

  public cleanup(): void {
    if (this.swContainer && this.controllerChangeListener) {
      this.swContainer.removeEventListener('controllerchange', this.controllerChangeListener);
    }
  }

  public getWaitingWorker(): ServiceWorkerController | null {
    return this.waitingWorker;
  }

  public getIsRefreshRequested(): boolean {
    return this.isRefreshRequested;
  }

  public getIsRefreshing(): boolean {
    return this.isRefreshing;
  }
}

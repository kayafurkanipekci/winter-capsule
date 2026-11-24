export type Locale = "tr" | "en" | "es" | "fr" | "de" | "pt";

export const SUPPORTED_LOCALES: readonly Locale[] = ["tr", "en", "es", "fr", "de", "pt"] as const;

export interface Translations {
  meta: {
    title: string;
    description: string;
  };
  home: {
    title: string;
    subtitle: string;
    warning: string;
    login: string;
    register: string;
    lettersToYear: (year: number) => string;
  };
  create: {
    title: string;
    subtitle: string;
    usernameLabel: string;
    usernamePlaceholder: string;
    pinLabel: string;
    creating: string;
    createButton: string;
    backHome: string;
    errors: {
      invalidInput: string;
      usernameTaken: string;
      genericError: string;
    };
    warningTitle: string;
    warningNoSpaces: string;
    success: {
      title: string;
      descriptionLine1: string;
      descriptionLine2: string;
      shareInvite: string;
      goToBox: string;
    };
  };
  login: {
    title: string;
    subtitle: string;
    usernameLabel: string;
    usernamePlaceholder: string;
    checking: string;
    submit: string;
    noBoxYet: string;
    createFree: string;
    backHome: string;
    notFound: {
      title: string;
      description: (username: string) => string;
      wrongSpelling: string;
      createNew: string;
      tryAgain: string;
      helpDivider: string;
      forgotUsernamePrompt: string;
      copied: string;
    };
  };
  dashboard: {
    sealsBroken: string;
    countdown: (days: number, hours: number) => string;
    boxNotFound: string;
    enterPinError: string;
    wrongPin: string;
    loggingIn: string;
    loginButton: string;
    forgotPin: string;
    forgotDrawer: {
      title: string;
      description: string;
      copied: string;
    };
    lockedToast: (timeLeft: string) => string;
    allReadToast: string;
    emptyBoxToast: string;
    backExit: string;
    shareButton: string;
    sealsOpened: string;
    viewMailbox: string;
    viewGrid: string;
    hintUnlockedUnread: string;
    hintUnlockedAllRead: string;
    hintLocked: string;
    unreadCount: (count: number) => string;
    anonymousLabel: string;
  };
  userPage: {
    searchingBox: string;
    notFoundTitle: string;
    notFoundDescription: (username: string) => string;
    claimPrompt: string;
    createWithName: string;
    backHome: string;
    introSubtitle: string;
    writeLetter: string;
    sendError: string;
    successTitle: (username: string) => string;
    createOwnBox: string;
  };
  letterEditor: {
    header: string;
    placeholder: string;
    cancel: string;
    seal: string;
  };
  letterReader: {
    header: string;
  };
  calendarReminder: {
    eventTitle: string;
    eventDetails: (origin: string) => string;
    buttonLabel: string;
  };
  shareDrawer: {
    title: string;
    shareText: string;
    shareTitle: string;
    downloadStory: string;
    storyPlatforms: string;
    imageErrorAlert: string;
    boxLinkLabel: string;
    storyTitle: string;
    storyPromptLine1: (year: number) => string;
    storyPromptLine2: string;
    storyBadge: string;
    storyFooter: string;
    downloadFilename: string;
  };
  warningPopup: {
    confirmButton: string;
  };
}

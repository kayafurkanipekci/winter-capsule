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
    fullNameLabel: string;
    fullNamePlaceholder: string;
    usernameLabel: string;
    usernamePlaceholder: string;
    pinLabel: string;
    creating: string;
    createButton: string;
    backHome: string;
    errors: {
      invalidInput: string;
      fullNameInvalid: string;
      usernameInvalid: string;
      usernameReserved: string;
      usernameTaken: string;
      pinInvalid: string;
      genericError: string;
    };
    warningTitle: string;
    warningNoSpaces: string;
    success: {
      title: string;
      descriptionLine1: string;
      descriptionLine2: string;
      rememberedNotice: string;
      minFourNotice: string;
      shareInvite: string;
      goToBox: string;
    };
  };
  login: {
    title: string;
    subtitle: string;
    usernameLabel: string;
    usernamePlaceholder: string;
    pinLabel: string;
    checking: string;
    submit: string;
    noBoxYet: string;
    createFree: string;
    backHome: string;
    forgotPin: string;
    wrongPin: string;
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
    seasonTitle: (season: number) => string;
    cardsCollected: (count: number) => string;
    minFourHint: string;
    openBox: string;
    continueGame: string;
    viewResults: string;
    loading: string;
    logout: string;
    pastSeasonsTitle: string;
    authored: {
      title: string;
      empty: string;
      pending: string;
      found: (cluesUsed: number) => string;
      missed: string;
      missedWithGuess: (name: string) => string;
      passed: string;
      classic: string;
    };
  };
  userPage: {
    searchingBox: string;
    notFoundTitle: string;
    notFoundDescription: (username: string) => string;
    claimPrompt: string;
    createWithName: string;
    backHome: string;
    ownerTitle: string;
    ownerDescription: string;
    goToDashboard: string;
    boxClosedTitle: string;
    boxClosedDescription: string;
    alreadySubmittedTitle: string;
    alreadySubmittedDescription: string;
    introSubtitle: string;
    writeLetter: string;
    sendError: string;
    form: {
      authorNameLabel: string;
      authorNamePlaceholder: string;
      authorNameHint: string;
      clueTextLabel: string;
      clueTextPlaceholder: string;
      clueTextHint: string;
      clueExtraLabel: string;
      clueExtraPlaceholder: string;
      cluePhotoLabel: string;
      cluePhotoHint: string;
      selectPhoto: string;
      removePhoto: string;
      compressing: string;
      noteLabel: string;
      notePlaceholder: string;
      notePhotoLabel: string;
      showWrongGuessLabel: string;
      previewButton: string;
      cancel: string;
    };
    preview: {
      title: string;
      immutableWarning: string;
      backToEdit: string;
      sealAndSend: string;
      sending: string;
    };
    errors: {
      fullNameInvalid: string;
      clueInvalid: string;
      nameTaken: string;
      alreadySubmitted: string;
      boxClosed: string;
      cannotSendToSelf: string;
      invalidImage: string;
    };
    successTitle: (username: string) => string;
    anonymousTitle: string;
    anonymousHint: string;
    createAccount: string;
    loginAccount: string;
    stayAnonymousNote: string;
    createOwnBox: string;
    goToMyBox: string;
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
  game: {
    loading: string;
    backToDashboard: string;
    rulesModal: {
      title: string;
      rule1: string;
      rule2: string;
      rule3: string;
      scoringTitle: string;
      scoreNoHint: string;
      scoreOneHint: string;
      scoreTwoHints: string;
      scorePass: string;
      scoreWrong: string;
      startButton: string;
    };
    progress: (answered: number, total: number) => string;
    whoAmI: string;
    revealClue: string;
    cluesRemaining: (count: number) => string;
    noMoreClues: string;
    namesTitle: string;
    namesHint: string;
    passButton: string;
    confirmTitle: string;
    confirmGuess: (name: string) => string;
    confirmPass: string;
    confirmOk: string;
    confirmCancel: string;
    results: {
      title: string;
      classicTitle: string;
      classicSubtitle: string;
      classicEmpty: string;
      totalScore: (points: number, max: number) => string;
      yourGuess: string;
      passed: string;
      correct: string;
      wrong: string;
      cluesLabel: string;
      noteLabel: string;
      openAttachment: string;
      shareInCircleToggle: string;
      circleTitle: string;
      circleEmpty: string;
      youLabel: string;
      shareResultImage: string;
      resultStoryFilename: string;
    };
  };
}

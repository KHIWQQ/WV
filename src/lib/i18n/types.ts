export type Locale = "th" | "en" | "zh";

export interface Translations {
  // Common
  common: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    add: string;
    back: string;
    loading: string;
    saving: string;
    searching: string;
    noData: string;
    error: string;
    tryAgain: string;
    errorLoadData: string;
    other: string;
    total: string;
    page: string;
    items: string;
    perMonth: string;
    perYear: string;
    or: string;
    all: string;
    unlimited: string;
    upgrade: string;
    confirmDelete: string;
    confirmDeleteMessage: string;
    cannotBeUndone: string;
    errorOccurred: string;
    cannotDisplaySection: string;
    retry: string;
  };

  // Auth
  auth: {
    login: string;
    register: string;
    logout: string;
    email: string;
    password: string;
    confirmPassword: string;
    displayName: string;
    yourName: string;
    loggingIn: string;
    registering: string;
    loginWithGithub: string;
    registerWithGithub: string;
    noAccount: string;
    hasAccount: string;
    invalidCredentials: string;
    verifyEmail: string;
    loginError: string;
    registerError: string;
    emailInUse: string;
    passwordMin8: string;
    startManaging: string;
    atLeast8Chars: string;
    tagline: string;
  };

  // Navigation
  nav: {
    overview: string;
    assets: string;
    transactions: string;
    liabilities: string;
    market: string;
    portfolio: string;
    retirement: string;
    adminSystem: string;
    userManagement: string;
    mainMenu: string;
  };

  // Dashboard
  dashboard: {
    wealthOverview: string;
    wealthSummary: string;
    netWorth: string;
    totalAssets: string;
    totalLiabilities: string;
    thisMonthIncome: string;
    driftTitle: string;
    driftHint: string;
    noNetWorthHistory: string;
    assetAllocation: string;
    noAssetData: string;
    recentTransactions: string;
    noTransactions: string;
    cashflow6Months: string;
    noIncomeExpenseData: string;
  };

  // Assets
  assets: {
    title: string;
    allAssets: string;
    addAsset: string;
    editAsset: string;
    syncPrice: string;
    updating: string;
    noAssets: string;
    cost: string;
    category: string;
    selectCategory: string;
    name: string;
    nameExample: string;
    symbol: string;
    symbolExample: string;
    autoUpdatePrice: string;
    quantity: string;
    totalCost: string;
    currentPriceUnit: string;
    totalValue: string;
    notes: string;
    additionalNotes: string;
    added: string;
    addError: string;
    edited: string;
    editError: string;
    deleted: string;
    deleteError: string;
    countryRegion: string;
  };

  // Asset Categories
  assetCategories: {
    cash: string;
    stock_th: string;
    stock_us: string;
    mutual_fund: string;
    crypto: string;
    gold: string;
    bond: string;
    real_estate: string;
    vehicle: string;
    insurance: string;
    ssf_rmf: string;
    other: string;
  };

  // Liabilities
  liabilities: {
    title: string;
    outstandingBalance: string;
    totalPayment: string;
    addLiability: string;
    editLiability: string;
    noLiabilities: string;
    balance: string;
    loanAmount: string;
    interestRate: string;
    monthlyPayment: string;
    paid: string;
    name: string;
    nameExample: string;
    type: string;
    selectType: string;
    startDate: string;
    endDate: string;
    notes: string;
    additionalNotes: string;
    added: string;
    addError: string;
    edited: string;
    editError: string;
    deleted: string;
    deleteError: string;
    manageLiabilities: string;
    // Phase 5: amortization + payoff + LTV
    ltvTitle: string;
    ltvHint: string;
    viewDetails: string;
    amortizationSchedule: string;
    amortizationHint: string;
    totalInterest: string;
    payoffIn: string;
    months: string;
    payoffCalc: string;
    payoffCalcHint: string;
    extraPerMonth: string;
    monthsSaved: string;
    interestSaved: string;
    underwaterWarning: string;
  };

  // Liability Types
  liabilityTypes: {
    mortgage: string;
    car_loan: string;
    personal_loan: string;
    credit_card: string;
    education_loan: string;
    other: string;
  };

  // Transactions
  transactions: {
    title: string;
    addTransaction: string;
    editTransaction: string;
    income: string;
    expense: string;
    buy: string;
    sell: string;
    type: string;
    selectType: string;
    category: string;
    selectCategory: string;
    categoryExample: string;
    amount: string;
    details: string;
    additionalDetails: string;
    date: string;
    searchTransactions: string;
    allCategories: string;
    incomeSection: string;
    expenseSection: string;
    expenseByCategory: string;
    incomeByCategory: string;
    expenseRatio: string;
    dailyExpense: string;
    monthlyTrend: string;
    balance: string;
    daily: string;
    monthly: string;
    yearly: string;
    added: string;
    addError: string;
    edited: string;
    editError: string;
    deleted: string;
    deleteError: string;
    noTransactions: string;
  };

  // Income Categories
  incomeCategories: {
    salary: string;
    freelance: string;
    interest: string;
    dividend: string;
    rental: string;
    business: string;
    bonus: string;
    asset_sale: string;
    other_income: string;
  };

  // Expense Categories
  expenseCategories: {
    food: string;
    housing: string;
    transport: string;
    shopping: string;
    health: string;
    entertainment: string;
    education: string;
    utilities: string;
    insurance: string;
    debt_payment: string;
    donation: string;
    personal: string;
    other_expense: string;
  };

  // Market
  market: {
    title: string;
    subtitle: string;
    thaiStocks: string;
    usStocks: string;
    cryptocurrency: string;
    searchPlaceholder: string;
    noResults: string;
    stock: string;
    crypto: string;
    commodity: string;
    index: string;
    fund: string;
    other: string;
    gold: string;
    loadingChart: string;
    noPriceData: string;
    price: string;
    volume: string;
    marketCap: string;
    currency: string;
    exchange: string;
    addToWatchlist: string;
    noDataFor: string;
  };

  // Watchlist
  watchlist: {
    title: string;
    add: string;
    limited: string;
    listName: string;
    noWatchlist: string;
    noSymbols: string;
    created: string;
    deleted: string;
    itemAdded: string;
    itemExists: string;
    itemRemoved: string;
    addToWatchlist: string;
    noWatchlistCreate: string;
    createNew: string;
    upgradePremium: string;
  };

  // Sync
  sync: {
    pricesUpdated: string;
    items: string;
    skipped: string;
    noDataFound: string;
    noAssetsToUpdate: string;
    updateError: string;
  };

  // Settings
  settings: {
    title: string;
    subtitle: string;
    profile: string;
    security: string;
    profileInfo: string;
    profileInfoDesc: string;
    changePassword: string;
    changePasswordDesc: string;
    profilePicture: string;
    uploading: string;
    clickToChange: string;
    displayName: string;
    yourName: string;
    email: string;
    cannotChangeEmail: string;
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
    reenterPassword: string;
    uploadSuccess: string;
    uploadError: string;
    saveSuccess: string;
    saveError: string;
    passwordChanged: string;
    passwordChangeError: string;
    selectImageFile: string;
    fileTooLarge: string;
  };

  // Header
  header: {
    notifications: string;
    user: string;
    accountSettings: string;
    darkMode: string;
    lightMode: string;
    language: string;
    noNotifications: string;
    markAllRead: string;
    toggleMenu: string;
  };

  // Sidebar
  sidebar: {
    manageWealthSmart: string;
    upgradeToUnlock: string;
    upgradeDesc: string;
    seeBenefits: string;
  };

  // Premium
  premium: {
    featureRestricted: string;
    unlimitedItems: string;
    accessFeatures: string;
    retirementTools: string;
    upgradeToPremium: string;
    pricingTitle: string;
    pricingDesc: string;
    freePlan: string;
    premiumPlan: string;
    freeFeature1: string;
    freeFeature2: string;
    freeFeature3: string;
    premiumFeature1: string;
    premiumFeature2: string;
    premiumFeature3: string;
    premiumFeature4: string;
    premiumPrice: string;
    currentPlan: string;
    contactAdmin: string;
    contactAdminDesc: string;
  };

  // Portfolio
  portfolio: {
    title: string;
    totalValue: string;
    gainLoss: string;
    noInvestmentData: string;
    valueByType: string;
    value: string;
    returnsByType: string;
    type: string;
    cost: string;
    currentValue: string;
  };

  // Retirement
  retirement: {
    title: string;
    subtitle: string;
    step1Title: string;
    step1Desc: string;
    step2Title: string;
    step2Desc: string;
    step3Title: string;
    step3Desc: string;
    featureReady: string;
    currentAge: string;
    retireAge: string;
    lifeExpectancy: string;
    currentSavings: string;
    monthlyContribution: string;
    expectedReturn: string;
    inflationRate: string;
    monthlyExpenseRetire: string;
    calculate: string;
    projectedWealth: string;
    requiredWealth: string;
    surplus: string;
    shortfall: string;
    result: string;
    onTrack: string;
    needMore: string;
    years: string;
    perMonth: string;
    wealthProjection: string;
    targetLine: string;
    projectedLine: string;
    age: string;
  };

  // Admin
  admin: {
    systemFor: string;
    totalUsers: string;
    fromLastMonth: string;
    premiumMembers: string;
    totalAssetsInSystem: string;
    noPermission: string;
    serverStatus: string;
    growthChart: string;
    importantReport: string;
    newUsersPerMonth: string;
    subscriptionBreakdown: string;
    freeUsers: string;
    premiumUsersLabel: string;
    users: string;
    userManagement: string;
    userManagementDesc: string;
    cannotLoadUsers: string;
    nameMember: string;
    email: string;
    role: string;
    package: string;
    joinDate: string;
    noUsersFound: string;
    roleUpdated: string;
    roleUpdateError: string;
    statusUpdated: string;
    packageSaved: string;
    packageUpdateError: string;
    connectionError: string;
    roleSaved: string;
  };

  // Validation
  validation: {
    selectCategory: string;
    enterAssetName: string;
    quantityGt0: string;
    costBasisGte0: string;
    currentPriceGte0: string;
    valueGte0: string;
    enterLiabilityName: string;
    loanAmountGt0: string;
    balanceGte0: string;
    interestRateGte0: string;
    monthlyPaymentGte0: string;
    selectStartDate: string;
    selectCategoryTx: string;
    amountGt0: string;
    selectDate: string;
    enterName: string;
    nameTooLong: string;
    passwordMin8: string;
    passwordMismatch: string;
  };

  // Auth page
  roleGate: {
    unauthorized: string;
    noPermission: string;
    backToHome: string;
  };

  // Months
  months: {
    january: string;
    february: string;
    march: string;
    april: string;
    may: string;
    june: string;
    july: string;
    august: string;
    september: string;
    october: string;
    november: string;
    december: string;
  };

  monthsShort: {
    jan: string;
    feb: string;
    mar: string;
    apr: string;
    may: string;
    jun: string;
    jul: string;
    aug: string;
    sep: string;
    oct: string;
    nov: string;
    dec: string;
  };

  // Metadata
  metadata: {
    title: string;
    description: string;
  };
}

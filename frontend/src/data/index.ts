export const CURRENCY = "ADA";
export const CURRENCY_LABEL = "PHP";

export interface ActivityItem {
  icon: string;
  color: "purple" | "zinc" | "green";
  text: string;
  time: string;
}

export interface Group {
  id: string;
  icon: string;
  name: string;
  description: string;
  badge: string;
  badgeVariant: "purple" | "zinc";
  balance: string;
  balanceColor: string;
}

export interface Expense {
  id: string;
  icon: string;
  name: string;
  paidBy: string;
  amount: string;
  when: string;
}

export interface Member {
  id: string;
  name: string;
  contribution: string;
  balance: string;
  balanceColor: string;
  avatar: string;
  isYou: boolean;
}


export interface GroupMember {
  id: string;
  name: string;
  email: string;
  isOwner: boolean;
  avatar: string | null;
}

export const activityItems: ActivityItem[] = [
  {
    icon: "payments",
    color: "purple",
    text: "You paid ₱200.00 to Apartment Expenses",
    time: "2 hours ago",
  },
  {
    icon: "person_add",
    color: "zinc",
    text: "Sarah Connor joined Ski Trip 2024",
    time: "Yesterday at 4:30 PM",
  },
  {
    icon: "check_circle",
    color: "green",
    text: "Weekly Dinner was fully settled",
    time: "2 days ago",
  },
  {
    icon: "receipt_long",
    color: "purple",
    text: "Added expense Lift Passes (₱1,200.00)",
    time: "3 days ago",
  },
];

export const groups: Group[] = [
  {
    id: "ski-trip",
    icon: "downhill_skiing",
    name: "Ski Trip 2024",
    description: "Baguio, Philippines",
    badge: "Active",
    badgeVariant: "purple",
    balance: "+₱850.00",
    balanceColor: "var(--color-tertiary)",
  },
  {
    id: "apartment",
    icon: "home_work",
    name: "Apartment Expenses",
    description: "Shared rent, utilities, and groceries.",
    badge: "Monthly",
    badgeVariant: "zinc",
    balance: "-₱320.15",
    balanceColor: "var(--color-error)",
  },
  {
    id: "dinner",
    icon: "restaurant",
    name: "Weekly Dinner",
    description: "Rotating hosts for Friday night dinner.",
    badge: "Settling",
    badgeVariant: "zinc",
    balance: "₱0.00",
    balanceColor: "#000",
  },
];

export const expenses: Expense[] = [
  {
    id: "1",
    icon: "chalet",
    name: "Luxury Cabin Rental",
    paidBy: "Alex Rivera",
    amount: "₱2,400.00",
    when: "Yesterday",
  },
  {
    id: "2",
    icon: "restaurant",
    name: "Summit Dinner & Drinks",
    paidBy: "You",
    amount: "₱450.00",
    when: "2 days ago",
  },
  {
    id: "3",
    icon: "shopping_cart",
    name: "Grocery Restock",
    paidBy: "Jordan Smith",
    amount: "₱180.50",
    when: "3 days ago",
  },
];

export const members: Member[] = [
  {
    id: "alex",
    name: "Alex Rivera",
    contribution: "25%",
    balance: "+₱840.00",
    balanceColor: "var(--color-tertiary)",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDW_OQ2nXav8V1zxHuhBlhYS7_uJJYufsSiy-kqZXZObREIZp1Zvjrd6c7yAmP0SAZo4z5NkObyH_1gVioS5xInzbWj-RD2JXIf0R-ZgstlqDLNFR-85hgb_qr695VC16tyI3y7S7-RZqQu_lzEIIW5BqEo5Z_aF3xWB6flRNjWWsUKdVHnzojHfBVWIB13Sm70Iog6K3wdjGKc9WuoLgoQ-zFSQW_6NUScCxttVVkxqEUkl8ZH5uC-yL_H_uOJk6Gv6AiScPxTdvY3",
    isYou: false,
  },
  {
    id: "you",
    name: "You",
    contribution: "25%",
    balance: "-₱245.50",
    balanceColor: "var(--color-error)",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCQl1WOBHsJBhdXtIlAl_p2sRBBIUfvHWjvx0J6QA-9FEY3DUjj2zJydeHxsP2Qc4QPK6IxEadbyExk2sajmPQXv_8KFj5SY7fxN2pVMAnLzWXe7_g_wdd3T4guwWsIlYD79dktSqbBjKPCvrJO-AYGNrbXA0wtLLG9hKDzw8sAKGijUApMcs7ZdVK2UMkKBajI-p1ZvQadd8ojwcxg62VJndtGRvvD7tPWqjyCJWBJOdpkLg_JAlMHxggZ092xneX67w2eSvztw2Ve",
    isYou: true,
  },
  {
    id: "sarah",
    name: "Sarah Chen",
    contribution: "25%",
    balance: "-₱594.50",
    balanceColor: "var(--color-error)",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDqYYMwyvg4Vrc2JVrwG8qRbn4n3GQWD6prReZDSWyBFcUaS0GlBOM6xoTjGbi9g4YQFkQdobsOoCsmRXH39bNWJh2T_lNnSXPDz9FbP83LaHYIhwoATEL9Uult1YcsBNrpBv_sLuj9UoQ7XDiThhp5tvwVNUQnVgm2A3JVl-lE0sm4UsIkWi3wFxFPZdN3GmsM5kLMZDn1eNi2wLkiz71hP6kXohJbZOmVTwIm88i9YPrcd0KGkcnfssQbcU6p4psH33Zc3ij3q849",
    isYou: false,
  },
];


export const groupMembers: GroupMember[] = [
  {
    id: "owner",
    name: "You (Owner)",
    email: "you@example.com",
    isOwner: true,
    avatar: null,
  },
  {
    id: "alex",
    name: "Alex Rivera",
    email: "alex@example.com",
    isOwner: false,
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBICQkWvKR8ChQ-jVceEWuKAFMPgDUxRJ0hCEltLYOG9E79Wt6hXug7D2SvLOEyfWWJPD7feciGCQDxWsjH-O3AFq8Tcta_eEVBqUbwcNty1BP5q8ZOiz_Y4c4mg6Gpccw0lXiTMiuakqdpGDBCgC-PT7w34wUMnurIfn74ef0aDQdbvb8hYrtGTi4ovgQiE2k1jSIUYu7EQX909yYAJ2Gfm44g7Ow-zL0j9r4-MYW2TEODmYGnWAZGtu2ZpLG7uS8cpHNIrjOsv6ij",
  },
  {
    id: "sarah",
    name: "Sarah Chen",
    email: "sarah@example.com",
    isOwner: false,
    avatar: null,
  },
];

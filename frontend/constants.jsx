import { DocCategory } from './types';

export const INITIAL_DOCUMENTS = [
  { 
    id: '1', 
    name: 'LeaseAgreement_2024.pdf', 
    category: DocCategory.LEGAL, 
    size: '2.4MB', 
    uploadedAt: '2024-03-01', 
    lastAccessed: '2 hours ago', 
    status: 'Safe' 
  },
  { 
    id: '2', 
    name: 'TaxReturn_Q1.xlsx', 
    category: DocCategory.FINANCE, 
    size: '450KB', 
    uploadedAt: '2024-03-10', 
    lastAccessed: 'Yesterday', 
    status: 'Safe' 
  },
  { 
    id: '3', 
    name: 'HealthInsurance_Policy.pdf', 
    category: DocCategory.MEDICAL, 
    size: '1.8MB', 
    uploadedAt: '2024-02-15', 
    lastAccessed: '3 days ago', 
    status: 'Safe' 
  },
  { 
    id: '4', 
    name: 'Passport_Copy.jpg', 
    category: DocCategory.PERSONAL, 
    size: '3.1MB', 
    uploadedAt: '2023-11-20', 
    lastAccessed: '1 month ago', 
    status: 'Flagged' 
  },
  { 
    id: '5', 
    name: 'InvestmentPortfolio.pdf', 
    category: DocCategory.FINANCE, 
    size: '5.2MB', 
    uploadedAt: '2024-03-12', 
    lastAccessed: 'Just now', 
    status: 'Safe' 
  },
];

export const INITIAL_ACTIVITY = [
  { 
    id: 'act1', 
    action: 'Uploaded', 
    docName: 'InvestmentPortfolio.pdf', 
    timestamp: '2024-03-12 10:30', 
    user: 'Alex Morgan' 
  },
  { 
    id: 'act2', 
    action: 'Viewed', 
    docName: 'LeaseAgreement_2024.pdf', 
    timestamp: '2024-03-12 09:15', 
    user: 'Alex Morgan' 
  },
  { 
    id: 'act3', 
    action: 'Downloaded', 
    docName: 'TaxReturn_Q1.xlsx', 
    timestamp: '2024-03-11 16:45', 
    user: 'Alex Morgan' 
  },
  { 
    id: 'act4', 
    action: 'Flagged', 
    docName: 'Passport_Copy.jpg', 
    timestamp: '2024-03-10 11:20', 
    user: 'System' 
  },
];

export const USER_MOCK = {
  name: 'Alex Morgan',
  email: 'alex.m@vault.security',
  role: 'Administrator',
  avatar: 'https://picsum.photos/seed/alex/200/200',
};
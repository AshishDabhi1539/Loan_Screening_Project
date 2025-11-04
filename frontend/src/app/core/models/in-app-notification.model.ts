/**
 * In-App Notification Models
 * Backend notification system models
 */

export interface InAppNotification {
  id: number;
  userId: string;
  type: NotificationTypeEnum;
  priority: NotificationPriority;
  recipientRole: RecipientRole;
  title: string;
  message: string;
  isRead: boolean;
  relatedEntityType?: string;
  relatedEntityId?: number;
  metadataJson?: string;
  createdByEvent?: string;
  createdAt: Date;
  readAt?: Date;
}

export enum NotificationTypeEnum {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  IN_APP = 'IN_APP'
}

export enum NotificationPriority {
  INFO = 'INFO',
  IMPORTANT = 'IMPORTANT',
  CRITICAL = 'CRITICAL'
}

export enum RecipientRole {
  APPLICANT = 'APPLICANT',
  LOAN_OFFICER = 'LOAN_OFFICER',
  SENIOR_LOAN_OFFICER = 'SENIOR_LOAN_OFFICER',
  COMPLIANCE_OFFICER = 'COMPLIANCE_OFFICER',
  SENIOR_COMPLIANCE_OFFICER = 'SENIOR_COMPLIANCE_OFFICER',
  ADMIN = 'ADMIN'
}

export interface NotificationPage {
  content: InAppNotification[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface NotificationConfig {
  color: string;
  icon: string;
  bgColor: string;
  textColor: string;
}

export const NOTIFICATION_CONFIGS: Record<NotificationPriority, NotificationConfig> = {
  [NotificationPriority.CRITICAL]: {
    color: '#dc3545',
    icon: '🔴',
    bgColor: '#fee',
    textColor: '#721c24'
  },
  [NotificationPriority.IMPORTANT]: {
    color: '#ffc107',
    icon: '🟡',
    bgColor: '#fff3cd',
    textColor: '#856404'
  },
  [NotificationPriority.INFO]: {
    color: '#17a2b8',
    icon: '🔵',
    bgColor: '#d1ecf1',
    textColor: '#0c5460'
  }
};

export type Role = "PATIENT" | "PROVIDER" | "ADMIN" | string;
export type UserStatus = "ACTIVE" | "BLOCKED" | "INACTIVE" | string;
export type ProviderStatus = "PENDING" | "APPROVED" | "REJECTED" | "BLOCKED" | "ACTIVE" | string;
export interface User {
  id: number;
  name: string;
  fullName?: string;
  email: string;
  phone?: string;
  role: Role;
  provider?: string;
  isActive?: boolean;
  active?: boolean;
  blocked?: boolean;
  status?: UserStatus;
  createdAt?: string;
  profilePicUrl?: string;
}
export interface AuthResponse {
  token?: string;
  tokenType?: string;
  userId?: number;
  id?: number;
  name?: string;
  email?: string;
  role?: Role;
}
export interface Provider {
  providerId: number;
  userId: number;
  providerName?: string;
  fullName?: string;
  specialization?: string;
  qualification?: string;
  experienceYears?: number;
  bio?: string;
  clinicName?: string;
  clinicAddress?: string;
  fee?: number;
  consultationFee?: number;
  avgRating?: number;
  verified?: boolean;
  isVerified?: boolean;
  isActive?: boolean;
  active?: boolean;
  blocked?: boolean;
  isBlocked?: boolean;
  status?: ProviderStatus;
  available?: boolean;
  isAvailable?: boolean;
  createdAt?: string;
  user?: User;
  name?: string;
  email?: string;
  phone?: string;
}
export interface Slot {
  slotId: number;
  providerId: number;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes?: number;
  booked?: boolean;
  isBooked?: boolean;
  blocked?: boolean;
  isBlocked?: boolean;
  recurrence?: string;
}
export interface Appointment {
  appointmentId: number;
  patientId: number;
  providerId: number;
  slotId: number;
  serviceType: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: string;
  notes?: string;
  modeOfConsultation: string;
  patientName?: string;
  providerName?: string;
  paymentStatus?: string;
}
export interface Payment {
  paymentId: number;
  appointmentId: number;
  patientId: number;
  providerId?: number;
  slotId?: number;
  amount: number;
  status: string;
  mode: string;
  transactionId?: string;
  currency?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paidAt?: string;
  refundedAt?: string;
  notes?: string;
}
export interface Review {
  reviewId: number;
  appointmentId: number;
  patientId: number;
  providerId: number;
  rating: number;
  comment: string;
  reviewDate?: string;
  verified?: boolean;
  isVerified?: boolean;
  anonymous?: boolean;
  isAnonymous?: boolean;
}
export interface MedicalRecord {
  recordId: number;
  appointmentId: number;
  patientId: number;
  providerId: number;
  diagnosis: string;
  prescription: string;
  notes?: string;
  attachmentUrl?: string;
  followUpDate?: string;
  createdAt?: string;
  updatedAt?: string;
}
export interface MedicalReport {
  reportId: number;
  appointmentId: number;
  patientId: number;
  providerId: number;
  providerName?: string;
  diagnosis: string;
  prescription: string;
  notes?: string;
  reportDate?: string;
  createdAt?: string;
}
export interface NotificationItem {
  notificationId: number;
  id?: number;
  recipientId: number;
  type: string;
  title: string;
  message: string;
  channel?: string;
  relatedId?: number;
  relatedType?: string;
  read?: boolean;
  isRead?: boolean;
  sentAt?: string;
  createdAt?: string;
}

export interface AdminDashboardStats {
  totalPatients: number;
  totalProviders: number;
  activePatients: number;
  blockedPatients: number;
  activeProviders: number;
  blockedProviders: number;
  pendingProviders: number;
  rejectedProviders: number;
}

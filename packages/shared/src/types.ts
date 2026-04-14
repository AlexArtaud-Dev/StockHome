// ─── Enums ───────────────────────────────────────────────────────────────────

export type ContainerType = 'box' | 'shelf' | 'drawer' | 'bag' | 'other';

export type MovementAction =
  | 'created'
  | 'moved'
  | 'updated'
  | 'deleted'
  | 'quantity_changed';

export type HouseholdType =
  | 'house'
  | 'flat'
  | 'apartment'
  | 'studio'
  | 'garage'
  | 'office'
  | 'storage'
  | 'other';

// ─── Entities ────────────────────────────────────────────────────────────────

export interface Household {
  id: string;
  name: string;
  type: HouseholdType;
  ownerId: string | null;
  isOwner: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string | null;
  username: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  isAdmin: boolean;
  isEmailVerified: boolean;
  notifyExpiryEnabled: boolean;
  notifyExpiryDays: number;
  notifyWeeklySummary: boolean;
  weeklyDigestDayOfWeek: number; // 0=Sunday, 1=Monday … 6=Saturday
  createdAt: string;
}

export interface HouseholdMember {
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  email: string | null;
  joinedAt: string;
  isOwner: boolean;
}

export interface HouseholdInvitation {
  id: string;
  householdId: string;
  householdName: string;
  inviterName: string;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  email: string | null;
  username: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  isAdmin: boolean;
  isEmailVerified: boolean;
  isBanned: boolean;
  createdAt: string;
}

export interface Room {
  id: string;
  householdId: string;
  name: string;
  icon: string | null;
  color: string | null;
  photoPath: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Container {
  id: string;
  roomId: string;
  parentContainerId: string | null;
  name: string;
  description: string | null;
  type: ContainerType;
  icon: string | null;
  photoPath: string | null;
  qrCode: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Item {
  id: string;
  containerId: string | null;
  roomId: string;
  householdId: string;
  name: string;
  description: string | null;
  quantity: number;
  icon: string | null;
  photoPath: string | null;
  qrCode: string | null;
  isConsumable: boolean;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  categories?: Category[];
  tags?: Tag[];
  stockRule?: StockRule | null;
}

export interface Category {
  id: string;
  householdId: string;
  name: string;
  parentCategoryId: string | null;
  icon: string | null;
  color: string | null;
}

export interface Tag {
  id: string;
  householdId: string;
  name: string;
}

export interface StockRule {
  id: string;
  itemId: string;
  minQuantity: number | null;
  renewalIntervalDays: number | null;
  lastRenewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MovementLog {
  id: string;
  itemId: string;
  userId: string;
  action: MovementAction;
  details: Record<string, unknown>;
  createdAt: string;
}

export interface MovementLogEnriched {
  id: string;
  itemId: string;
  itemName: string;
  userId: string;
  userName: string;
  action: MovementAction;
  details: Record<string, unknown>;
  createdAt: string;
}

// ─── DTOs ────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  error: string;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Auth
export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

// Room
export interface CreateRoomDto {
  name: string;
  icon?: string;
  color?: string;
  sortOrder?: number;
}

export interface UpdateRoomDto {
  name?: string;
  icon?: string;
  color?: string;
  sortOrder?: number;
}

// Container
export interface CreateContainerDto {
  roomId: string;
  parentContainerId?: string;
  name: string;
  description?: string;
  type: ContainerType;
  icon?: string;
  sortOrder?: number;
}

export interface UpdateContainerDto {
  name?: string;
  description?: string;
  type?: ContainerType;
  icon?: string;
  parentContainerId?: string;
  sortOrder?: number;
}

// Item
export interface CreateItemDto {
  containerId?: string;
  roomId: string;
  name: string;
  description?: string;
  quantity?: number;
  icon?: string;
  isConsumable?: boolean;
  expiresAt?: string | null;
  categoryIds?: string[];
  tagNames?: string[];
}

export interface UpdateItemDto {
  containerId?: string;
  name?: string;
  description?: string;
  quantity?: number;
  icon?: string;
  isConsumable?: boolean;
  expiresAt?: string | null;
  categoryIds?: string[];
  tagNames?: string[];
}

export interface AdjustQuantityDto {
  delta: number;
}

// Stock Rule
export interface CreateStockRuleDto {
  minQuantity?: number;
  renewalIntervalDays?: number;
}

export interface UpdateStockRuleDto {
  minQuantity?: number;
  renewalIntervalDays?: number;
}

// Category
export interface CreateCategoryDto {
  name: string;
  parentCategoryId?: string;
  icon?: string;
  color?: string;
}

export interface UpdateCategoryDto {
  name?: string;
  parentCategoryId?: string;
  icon?: string;
  color?: string;
}

// Shopping list entry
export interface ShoppingListItem {
  item: Item;
  reason: 'below_minimum' | 'renewal_due';
  currentQuantity: number;
  minQuantity: number | null;
}

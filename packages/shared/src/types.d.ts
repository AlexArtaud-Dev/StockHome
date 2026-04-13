export type ContainerType = 'box' | 'shelf' | 'drawer' | 'bag' | 'other';
export type MovementAction = 'created' | 'moved' | 'updated' | 'deleted' | 'quantity_changed';
export interface Household {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
}
export interface User {
    id: string;
    householdId: string;
    username: string;
    displayName: string | null;
    createdAt: string;
}
export interface Room {
    id: string;
    householdId: string;
    name: string;
    icon: string | null;
    color: string | null;
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
export interface LoginDto {
    username: string;
    password: string;
}
export interface RegisterDto {
    username: string;
    password: string;
    displayName?: string;
    householdName: string;
}
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}
export interface AuthResponse {
    user: User;
    tokens: AuthTokens;
}
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
export interface CreateItemDto {
    containerId?: string;
    roomId: string;
    name: string;
    description?: string;
    quantity?: number;
    icon?: string;
    isConsumable?: boolean;
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
    categoryIds?: string[];
    tagNames?: string[];
}
export interface AdjustQuantityDto {
    delta: number;
}
export interface CreateStockRuleDto {
    minQuantity?: number;
    renewalIntervalDays?: number;
}
export interface UpdateStockRuleDto {
    minQuantity?: number;
    renewalIntervalDays?: number;
}
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
export interface ShoppingListItem {
    item: Item;
    reason: 'below_minimum' | 'renewal_due';
    currentQuantity: number;
    minQuantity: number | null;
}
//# sourceMappingURL=types.d.ts.map
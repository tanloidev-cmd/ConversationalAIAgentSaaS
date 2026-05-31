export function tenantPk(tenantId: string): string {
  return `TENANT#${tenantId}`;
}

export function sessionMetaSk(sessionId: string): string {
  return `SESSION#${sessionId}`;
}

export function sessionMessageSk(sessionId: string, messageId: string): string {
  return `SESSION#${sessionId}#MSG#${messageId}`;
}

export function userSessionGsiPk(userId: string): string {
  return `USER#${userId}`;
}

export function userSessionGsiSk(sessionId: string): string {
  return `SESSION#${sessionId}`;
}

import jwt from "jsonwebtoken";

export interface TokenPayload {
  sub: string;
  email: string;
  roles: string[];
  groups: string[];
}

export class JWTService {
  private secret: string;
  private expiresIn: number;

  constructor() {
    this.secret = process.env.JWT_SECRET || "default-secret";
    const expiresInStr = process.env.JWT_EXPIRES_IN || "24h";
    this.expiresIn = this.parseExpiresIn(expiresInStr);
  }

  private parseExpiresIn(value: string): number {
    const match = /^(\d+)([smhd])$/.exec(value);
    if (!match) return 86400;

    const num = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case "s": return num;
      case "m": return num * 60;
      case "h": return num * 3600;
      case "d": return num * 86400;
      default: return 86400;
    }
  }

  generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.secret, {
      expiresIn: this.expiresIn,
    });
  }

  verifyToken(token: string): TokenPayload {
    return jwt.verify(token, this.secret) as TokenPayload;
  }
}

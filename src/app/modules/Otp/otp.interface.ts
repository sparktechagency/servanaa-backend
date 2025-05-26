

// Interface for OTP Document
export type TOtp = {
    email: string;
    otp: number;
    phone?: string;
    createdAt: Date;
  }